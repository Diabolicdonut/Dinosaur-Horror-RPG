// DHR-018: actor-local witnessed knowledge and attributed hearsay.
// Standalone GM-side pure contract; only an authoritative replay may supply frames/events.
// Do not feed raw AI declarations or player-save patches to this module.
import {adventureFingerprint,validateCompiledAdventure} from './adventure-definition.mjs';

const ID=/^[a-z][a-z0-9_-]{0,63}$/;
const KINDS=new Set(['danger','distress','clue']);
const MAX_FRAMES=256,MAX_EVENTS=256;
function fail(reason){throw new RangeError('Invalid NPC knowledge provenance: '+reason);}
function plain(x){
 if(!x||typeof x!=='object'||Array.isArray(x))return false;
 const p=Object.getPrototypeOf(x);
 return p===Object.prototype||p===null;
}
function exact(x,keys){
 return plain(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
}
function slug(x){return typeof x==='string'&&ID.test(x);}
function matchingKeys(x,ids){
 return plain(x)&&Object.keys(x).length===ids.length&&ids.every(id=>Object.hasOwn(x,id));
}
function active(compiled,item){
 const variant=item.variant||item.when;
 return !variant||compiled.hiddenFacts?.[variant.slot]?.id===(variant.choice);
}
const freezeRows=rows=>Object.freeze(rows.map(x=>Object.freeze(x)));
const sourceId=compiled=>Object.freeze({
 adventureId:compiled.adventureId,revision:compiled.revision,
 fingerprint:compiled.fingerprint,seed:compiled.seed
});
const compare=(a,b)=>a.localeCompare(b);

/**
 * Compile a strict, source-bound, actor-local history from authoritative frames
 * and explicit witnessed or spoken events. The frames MUST originate from a
 * previously validated engine/world replay, not an AI, client, or a player save.
 *
 * Frame: {beat, npcRooms:{npcId:room}, creatureRooms:{creatureId:room},
 *         distressedNpcIds:[npcId,...]}
 * Event observe: {id,type:'observe',npcId,factId,kind,beat,location}
 * Event report:  {id,type:'report',fromNpcId,toNpcId,factId,kind,beat,location}
 *
 * Source facts: selected variant clues; seeded predators; or an actually
 * distressed named NPC at that frame. A report is always attributed hearsay,
 * even when its sender has first-hand experience. No dice, attacks, movement,
 * fictional source truth, or saved-state changes are performed here.
 */
export function compileNpcKnowledgeLedger(compiled,input){
 if(!validateCompiledAdventure(compiled))fail('invalid compiled adventure');
 if(!exact(input,['frames','events'])||!Array.isArray(input.frames)||
    !input.frames.length||input.frames.length>MAX_FRAMES||
    !Array.isArray(input.events)||input.events.length>MAX_EVENTS)
  fail('bounded frames/events required');
 const npcs=(compiled.definition.supportingCast||[]).filter(x=>active(compiled,x))
  .sort((a,b)=>compare(a.id,b.id));
 const creatures=compiled.definition.initialCreatures.filter(x=>active(compiled,x))
  .sort((a,b)=>compare(a.id,b.id));
 const npcIds=npcs.map(x=>x.id),creatureIds=creatures.map(x=>x.id);
 const npcById=Object.fromEntries(npcs.map(n=>[n.id,n]));
 const creatureById=Object.fromEntries(creatures.map(c=>[c.id,c]));
 const rooms=compiled.definition.rooms;
 const frames=[],byBeat=new Map();
 let previous=null;
 for(const candidate of input.frames){
  if(!exact(candidate,['beat','npcRooms','creatureRooms','distressedNpcIds'])||
     !Number.isSafeInteger(candidate.beat)||candidate.beat<0||
     (previous===null?candidate.beat!==0:candidate.beat<=previous.beat)||
     !matchingKeys(candidate.npcRooms,npcIds)||
     !matchingKeys(candidate.creatureRooms,creatureIds)||
     !Array.isArray(candidate.distressedNpcIds)||
     candidate.distressedNpcIds.length>npcIds.length)
   fail('missing, duplicated or out-of-order world frame');
  const npcRooms={},creatureRooms={};
  for(const npc of npcs){
   const at=candidate.npcRooms[npc.id],before=previous?.npcRooms[npc.id];
   if(typeof at!=='string'||!Object.hasOwn(rooms,at))fail('nonexistent NPC room');
   if(!previous&&at!==npc.location)fail('invented initial NPC position');
   if(previous&&at!==before){
    const route=npc.autonomy?.path,exit=npc.dangerResponse?.exit;
    if(!(route&&route[route.indexOf(before)+1]===at) &&
       !(exit&&before===npc.location&&at===exit))
      fail('NPC moved outside source-authorized route');
   }
   npcRooms[npc.id]=at;
  }
  for(const creature of creatures){
   const at=candidate.creatureRooms[creature.id];
   const before=previous?.creatureRooms[creature.id],path=creature.patrol?.path;
   if(typeof at!=='string'||!Object.hasOwn(rooms,at)||
      (!previous&&at!==creature.location)||
      (previous&&at!==before&&(!path||
       path[(path.indexOf(before)+1)%path.length]!==at)))
    fail('invented creature, remote position or unsupported movement');
   creatureRooms[creature.id]=at;
  }
  const distressed=[...candidate.distressedNpcIds];
  if(new Set(distressed).size!==distressed.length||
     distressed.some(id=>!slug(id)||!Object.hasOwn(npcById,id))||
     (!previous&&distressed.length))fail('unverified distress identity or initial condition');
  distressed.sort(compare);
  const frame=Object.freeze({beat:candidate.beat,
   npcRooms:Object.freeze(npcRooms),creatureRooms:Object.freeze(creatureRooms),
   distressedNpcIds:Object.freeze(distressed)});
  frames.push(frame);byBeat.set(frame.beat,frame);previous=frame;
 }
 const clueRooms=new Map();
 for(const [slot,option] of Object.entries(compiled.hiddenFacts)){
  if(!slug(option.fact)||clueRooms.has(option.fact))fail('ambiguous seeded fact ID');
  clueRooms.set(option.fact,option.clueRoom);
 }
 const uniqueIds=new Set(),uniqueClaims=new Set(),kinds=new Map(),entries=[];
 for(const event of input.events){
  const observation=event?.type==='observe';
  if(!(observation?exact(event,['id','type','npcId','factId','kind','beat','location']):
    exact(event,['id','type','fromNpcId','toNpcId','factId','kind','beat','location']))||
    !['observe','report'].includes(event.type)||!slug(event.id)||
    !slug(event.factId)||!KINDS.has(event.kind)||
    !Number.isSafeInteger(event.beat)||event.beat<0||
    !byBeat.has(event.beat)||uniqueIds.has(event.id)||
    typeof event.location!=='string'||!Object.hasOwn(rooms,event.location))
   fail('invalid event shape, identity or timestamp');
  uniqueIds.add(event.id);
  const frame=byBeat.get(event.beat);
  const id=observation?event.npcId:event.toNpcId;
  if(!slug(id)||!Object.hasOwn(npcById,id)||
     frame.npcRooms[id]!==event.location)
   fail('absent or remote knowledge recipient');
  if(!observation&&(!slug(event.fromNpcId)||
     !Object.hasOwn(npcById,event.fromNpcId)||event.fromNpcId===id||
     frame.npcRooms[event.fromNpcId]!==event.location))
   fail('unidentified or nonlocal report source');
  if(observation){
   let present=false;
   if(event.kind==='clue')
    present=clueRooms.get(event.factId)===event.location;
   if(event.kind==='danger')
    present=Object.hasOwn(creatureById,event.factId)&&
     creatureById[event.factId].disposition==='predatory'&&
     frame.creatureRooms[event.factId]===event.location;
   if(event.kind==='distress')
    present=frame.distressedNpcIds.some(subject=>
     event.factId==='distress-'+subject&&
     frame.npcRooms[subject]===event.location);
   if(!present)fail('unwitnessed, unseeded, remote or incorrect-world fact');
  }
  const earlierKind=kinds.get(event.factId);
  if(earlierKind&&earlierKind!==event.kind)fail('contradictory fact kind');
  kinds.set(event.factId,event.kind);
  const dedupe=(observation?'seen:':'said:'+event.fromNpcId+':')+
   id+':'+event.factId;
  if(uniqueClaims.has(dedupe))fail('duplicate evidence or repeated report');
  uniqueClaims.add(dedupe);
  entries.push(Object.freeze(observation?
   {id:event.id,npcId:id,factId:event.factId,kind:event.kind,
    source:'observed',beat:event.beat,location:event.location,fromNpcId:null}:
   {id:event.id,npcId:id,factId:event.factId,kind:event.kind,
    source:'reported',beat:event.beat,location:event.location,
    fromNpcId:event.fromNpcId}));
 }
 entries.sort((a,b)=>a.beat-b.beat||compare(a.id,b.id));
 Object.freeze(frames);
 Object.freeze(entries);
 const source=sourceId(compiled);
 const canonical={schemaVersion:1,source,frames,entries};
 return Object.freeze({...canonical,identity:'npc-knowledge-v1:'+
  adventureFingerprint(canonical),
  npcIds:Object.freeze(npcIds)});
}

function at(ledger,npcId,beat){
 if(!exactLedger(ledger)||!slug(npcId)||!ledger.npcIds.includes(npcId)||
    !Number.isSafeInteger(beat)||beat<0)fail('invalid actor or query beat');
 const frame=ledger.frames.find(x=>x.beat===beat);
 if(!frame)fail('query requires an exact authoritative world frame');
 return frame;
}
function exactLedger(ledger){
 return plain(ledger)&&ledger.schemaVersion===1&&
  Array.isArray(ledger.npcIds)&&Array.isArray(ledger.frames)&&
  Array.isArray(ledger.entries)&&typeof ledger.identity==='string';
}
function evidenceAt(ledger,npcId,beat){
 const frame=at(ledger,npcId,beat);
 const grouped=new Map();
 for(const entry of ledger.entries){
  if(entry.beat>beat)break;
  if(entry.npcId!==npcId)continue;
  const history=grouped.get(entry.factId)||[];
  history.push(entry);
  grouped.set(entry.factId,history);
 }
 return {frame,grouped};
}

/** DHR-008 compatible view; it never upgrades an unverified rumor. */
export function npcKnownFactsAt(ledger,npcId,beat){
 const {frame,grouped}=evidenceAt(ledger,npcId,beat);
 const facts=[];
 for(const [id,history] of grouped){
  const seen=history.filter(x=>x.source==='observed');
  const last=seen[seen.length-1],latest=history[history.length-1];
  const local=Boolean(last&&last.location===frame.npcRooms[npcId]&&
   (last.kind==='clue'||last.beat===beat));
  facts.push(Object.freeze({id,kind:latest.kind,
   source:last?'observed':'reported',local}));
 }
 return freezeRows(facts.sort((a,b)=>compare(a.id,b.id)));
}

/** Report sources remain visible even after the NPC independently witnesses a fact. */
export function npcFactProvenanceAt(ledger,npcId,factId,beat){
 if(!slug(factId))fail('invalid fact reference');
 const {grouped}=evidenceAt(ledger,npcId,beat);
 const history=grouped.get(factId)||[];
 const witnessed=history.some(x=>x.source==='observed');
 const reports=history.filter(x=>x.source==='reported')
  .map(x=>x.fromNpcId).sort(compare);
 return Object.freeze({status:witnessed?'observed':reports.length?'reported':'unknown',
  witnessed,reports:Object.freeze(reports)});
}
