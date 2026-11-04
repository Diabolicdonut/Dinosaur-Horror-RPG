// DHR-021: source-limited, nonexecuting NPC equipment/resource proposals.
// This is an engine-side advisory boundary, not a save format or an action
// executor. Only trusted replay/world snapshots and AUTHOR-attested catalogues
// may enter this function; neither clients nor narration grant equipment.
import {adventureFingerprint,validateCompiledAdventure} from './adventure-definition.mjs';
import {planNpcAction} from './npc-action-choices.mjs';

const ID=/^[a-z][a-z0-9_-]{0,63}$/;
const ROLES=new Set(['medical','supply','tool','weapon']);
const SOURCE_KEYS=['adventureId','revision','fingerprint','seed'];
const CATALOG_KEYS=['source','items'];
const ITEM_KEYS=['itemId','role','usesPerItem'];
const WORLD_KEYS=['actors','rooms','usage'];
const ACTOR_KEYS=['id','location','inventory','gear'];
const ROOM_KEYS=['items'];
const USAGE_KEYS=['used','destroyed'];
const COST=Object.freeze({minimumActions:1,executorMustCharge:true});
const byId=(a,b)=>a.localeCompare(b);
const fail=message=>{throw new RangeError('Invalid NPC resource decision: '+message);};
function plain(x){
 if(!x||typeof x!=='object'||Array.isArray(x))return false;
 const p=Object.getPrototypeOf(x);
 return p===Object.prototype||p===null;
}
function exact(x,keys){
 return plain(x)&&Object.keys(x).length===keys.length&&
  keys.every(key=>Object.hasOwn(x,key));
}
function id(x){return typeof x==='string'&&ID.test(x);}
function quantity(x){return Number.isSafeInteger(x)&&x>=0;}
function list(x){
 return Array.isArray(x)&&x.length<=256&&x.every(id);
}
function count(items,itemId){return items.filter(value=>value===itemId).length;}
function add(a,b){
 if(!quantity(a)||!quantity(b)||!Number.isSafeInteger(a+b))fail('unsafe resource total');
 return a+b;
}
function frozenRows(rows){return Object.freeze(rows.map(row=>Object.freeze(row)));}
function sourceId(compiled){
 return {adventureId:compiled.adventureId,revision:compiled.revision,
  fingerprint:compiled.fingerprint,seed:compiled.seed};
}

/**
 * Read-only resource snapshot:
 *  catalog = {source:{adventureId,revision,fingerprint,seed},
 *    items:[{itemId,role:'medical'|'supply'|'tool'|'weapon',usesPerItem}]}
 *  world = {actors:[{id,location,inventory,gear}],rooms:{roomId:{items}},
 *    usage:{itemId:{used,destroyed}}}
 *
 * The catalog MUST be trusted author metadata for real manifest item IDs, not
 * AI/player-authored equipment classes. Its source binding and item stock are
 * verified here; the authored meaning of an item is an upstream trust boundary.
 * All catalogued units must be accounted for among on-floor, carried and
 * destroyed units. One multi-use item per ID is allowed; repeated IDs may only
 * have one use per unit (without stable serials their charge cannot be tracked).
 *
 * 'used' is cumulative committed uses, 'destroyed' is the count of exhausted
 * items permanently removed. A single multi-use item can remain empty in
 * inventory, or be removed only after all charges are spent. One-use items
 * must be destroyed when used. The executor owns all such mutations.
 */
function verifiedResources(compiled,ledger,query,catalog,world){
 if(!exact(catalog,CATALOG_KEYS)||!exact(catalog.source,SOURCE_KEYS)||
    SOURCE_KEYS.some(key=>catalog.source[key]!==sourceId(compiled)[key])||
    !Array.isArray(catalog.items)||catalog.items.length>32)
  fail('untrusted source catalogue');
 const sourceStock=new Map();
 for(const item of compiled.definition.startItems)
  sourceStock.set(item,(sourceStock.get(item)||0)+1);
 for(const room of Object.values(compiled.definition.rooms))
  for(const item of room.items)sourceStock.set(item,(sourceStock.get(item)||0)+1);
 const definitions=new Map();
 for(const item of catalog.items){
  if(!exact(item,ITEM_KEYS)||!id(item.itemId)||!ROLES.has(item.role)||
     !Number.isSafeInteger(item.usesPerItem)||item.usesPerItem<1||
     item.usesPerItem>256||definitions.has(item.itemId)||
     !sourceStock.has(item.itemId))
   fail('invented, duplicate, or unsupported authored item');
  if(sourceStock.get(item.itemId)>1&&item.usesPerItem!==1)
   fail('ambiguous repeated multi-use item without unique serial identity');
  definitions.set(item.itemId,item);
 }
 if(!exact(world,WORLD_KEYS)||!Array.isArray(world.actors)||
    world.actors.length>64||!plain(world.rooms)||!plain(world.usage))
  fail('world resource snapshot');
 const rooms=compiled.definition.rooms;
 if(Object.keys(world.rooms).length!==Object.keys(rooms).length||
    Object.keys(world.rooms).some(room=>!Object.hasOwn(rooms,room)))
  fail('missing or fabricated physical room');
 for(const room of Object.values(world.rooms))
  if(!exact(room,ROOM_KEYS)||!list(room.items))fail('invalid floor inventory');
 const actors=new Map();
 for(const actor of world.actors){
  if(!exact(actor,ACTOR_KEYS)||!id(actor.id)||!id(actor.location)||
     !Object.hasOwn(rooms,actor.location)||!list(actor.inventory)||
     !list(actor.gear)||actors.has(actor.id))
   fail('invalid or duplicated resource carrier');
  actors.set(actor.id,actor);
 }
 const frame=ledger.frames.find(f=>f.beat===query.beat);
 if(!frame)fail('missing attested resource decision frame');
 for(const [npcId,location] of Object.entries(frame.npcRooms))
  if(!actors.has(npcId)||actors.get(npcId).location!==location)
   fail('NPC item location contradicts witnessed world frame');
 if(!actors.has(query.npcId))fail('missing decision actor');
 if(Object.keys(world.usage).length!==definitions.size||
    Object.keys(world.usage).some(item=>!definitions.has(item)))
  fail('usage ledgers must match source equipment');
 const available=new Map();
 for(const [itemId,definition] of definitions){
  const usage=world.usage[itemId],stock=sourceStock.get(itemId);
  if(!exact(usage,USAGE_KEYS)||!quantity(usage.used)||
     !quantity(usage.destroyed)||usage.destroyed>stock||
     usage.used>stock*definition.usesPerItem)
   fail('invalid finite-use accounting');
  let physical=0;
  for(const actor of actors.values())
   physical=add(physical,count(actor.inventory,itemId)+count(actor.gear,itemId));
  for(const room of Object.values(world.rooms))
   physical=add(physical,count(room.items,itemId));
  if(add(physical,usage.destroyed)!==stock)
   fail('source stock omitted, duplicated or minted: '+itemId);
  if(definition.usesPerItem===1){
   if(usage.used!==usage.destroyed)fail('one-use item not conserved');
  }else if(usage.destroyed!==0&&
    !(usage.destroyed===1&&usage.used===definition.usesPerItem))
   fail('multi-use item exhausted without charges');
  available.set(itemId,definition.usesPerItem*stock-usage.used);
 }
 return {actors,definitions,available};
}
function frozenOption(kind,fields={}){
 return Object.freeze({kind,...fields,cost:COST});
}

/**
 * A proposal NEVER transfers, consumes, rolls, heals, attacks, observes,
 * advances the world clock or writes save fields. All positive proposals
 * require a nonzero executor action charge; an executor must revalidate the
 * world and source/knowledge ledger before committing anything.
 *
 * 'assist' means an attempt, not a free heal. 'use_equipment' is an equipment
 * attempt, not an earned effect. 'offer_equipment' is a transfer intention, not
 * a duplicate inventory grant. Weapons are transferable only, never fired here.
 */
export function planNpcResourceDecision(compiled,motive,ledger,query,catalog,world){
 if(!validateCompiledAdventure(compiled))fail('invalid compiled adventure');
 // DHR-019 rechecks the motive, source identity, normalized evidence ledger,
 // actor, beat and known local facts before any resources are considered.
 const base=planNpcAction(compiled,motive,ledger,query);
 const {actors,definitions,available}=
  verifiedResources(compiled,ledger,query,catalog,world);
 const owner=actors.get(query.npcId);
 if(owner.location!==base.room)fail('actor and decision room differ');
 const proposals=[Object.freeze({kind:'hold'})];
 // When the upstream priority is an actual witnessed retreat, do not invent
 // combat/treatment as a substitute for the safety decision.
 if(base.chosen.kind!=='withdraw'){
  const items=[...definitions.values()].sort((a,b)=>byId(a.itemId,b.itemId))
   .filter(item=>count(owner.inventory,item.itemId)+
    count(owner.gear,item.itemId)>0&&available.get(item.itemId)>0);
  for(const option of base.candidates){
   if(option.kind==='consider_help'){
    const target=option.factId.startsWith('distress-')?
     option.factId.slice('distress-'.length):null;
    const witness=ledger.frames.find(f=>f.beat===query.beat);
    const recipient=target&&actors.get(target);
    if(!recipient||target===query.npcId||
       !witness.distressedNpcIds.includes(target)||
       recipient.location!==owner.location)continue;
    proposals.push(frozenOption('assist',
     {targetNpcId:target,factId:option.factId}));
    for(const item of items){
     if(item.role==='medical'||item.role==='supply')
      proposals.push(frozenOption('use_equipment',{
       itemId:item.itemId,targetNpcId:target,factId:option.factId,
       consumesUses:1}));
     // This is a proposed handoff to a colocated, actually distressed
     // named recipient; the executor decides if the transfer is accepted.
     proposals.push(frozenOption('offer_equipment',{
      itemId:item.itemId,targetNpcId:target,factId:option.factId,
      consumesUses:0}));
    }
   }else if(option.kind==='consider_inspection'){
    for(const item of items.filter(item=>item.role==='tool'))
     proposals.push(frozenOption('use_equipment',{
      itemId:item.itemId,factId:option.factId,consumesUses:1}));
   }
  }
 }
 // Prefer equipment-backed care to abstract assistance, and never force
 // an equipment use in a quiet/unknown-world scene.
 const chosen=proposals.find(p=>p.kind==='use_equipment'&&p.targetNpcId)||
  proposals.find(p=>p.kind==='assist')||
  proposals.find(p=>p.kind==='use_equipment')||
  proposals.find(p=>p.kind==='offer_equipment')||proposals[0];
 const source=Object.freeze(sourceId(compiled));
 const canonicalCatalog=[...definitions.values()].sort((a,b)=>byId(a.itemId,b.itemId));
 const canonicalActors=[...actors.values()].sort((a,b)=>byId(a.id,b.id))
  .map(a=>({id:a.id,location:a.location,
   inventory:[...a.inventory].sort(byId),gear:[...a.gear].sort(byId)}));
 const canonicalRooms=Object.fromEntries(Object.entries(world.rooms)
  .sort(([a],[b])=>byId(a,b)).map(([id,room])=>[id,[...room.items].sort(byId)]));
 const canonicalUsage=Object.fromEntries(canonicalCatalog.map(item=>
  [item.itemId,world.usage[item.itemId]]));
 const identity='npc-resource-decision-v1:'+adventureFingerprint({
  source,base:base.identity,catalog:canonicalCatalog,actors:canonicalActors,
  rooms:canonicalRooms,usage:canonicalUsage,proposals,chosen
 });
 return Object.freeze({schemaVersion:1,source,npcId:query.npcId,
  beat:query.beat,room:base.room,candidates:frozenRows(proposals),
  chosen,identity});
}
