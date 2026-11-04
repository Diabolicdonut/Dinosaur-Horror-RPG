// DHR-012 / #102: pure, fail-closed physical eligibility for DHR-011 shots.
// No runtime integration, state mutation, dice, ammunition or damage.
// All six inputs EXCEPT the action are engine-owned. In particular, 'scene'
// is an authored/engine-certified spatial snapshot, never an AI assertion.
import {validateCompiledAdventure, validAdventureBinding} from './adventure-definition.mjs';
import {createAdventureWorld} from './adventure-world.mjs';
import {validateCreatureContinuity} from './adventure-creatures.mjs';
import {validateAmmunitionConservation} from './weapon-ammunition.mjs';

const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const id=x=>typeof x==='string'&&/^[a-z][A-Za-z0-9_-]{1,63}$/.test(x);
const validKeys=(x,keys)=>Object.keys(x).every(k=>keys.includes(k));
const fail=why=>{throw new RangeError('Invalid ranged geometry: '+why);};
const deny=reason=>Object.freeze({eligible:false,reason});
const BANDS=Object.freeze(['adjacent','short','medium','long','extreme']);
const pair=(a,b)=>[a,b].sort().join('|');
const isBool=x=>typeof x==='boolean';

function validateAction(action) {
  if(!record(action)||!validKeys(action,[
    'actorId','weaponId','targetId','seed','push','spendStoryPoint','storyPointTiming'])||
    !id(action.actorId)||!id(action.weaponId)||!id(action.targetId)||
    !Number.isSafeInteger(action.seed)||action.seed<0||action.seed>0xffffffff||
    (own(action,'push')&&![0,1,2].includes(action.push))||
    (own(action,'spendStoryPoint')&&!isBool(action.spendStoryPoint))||
    (own(action,'storyPointTiming')&&!['before','after'].includes(action.storyPointTiming)))
    fail('attack declaration includes invented range, cover, modifier or other invalid field');
}
function targetRoster(targets) {
  if(!Array.isArray(targets)||targets.length>256)fail('trusted target roster');
  const ids=new Set();
  for(const t of targets) {
    if(!record(t)||!id(t.id)||ids.has(t.id)||
      (own(t,'dead')&&!isBool(t.dead))||
      (own(t,'defeated')&&!isBool(t.defeated)))fail('invalid or duplicate world target');
    ids.add(t.id);
  }
  return ids;
}
function registerScene(compiled,state,scene,world) {
  if(!record(scene)||!validKeys(scene,[
    'sightlines','sameZoneRanges','doorPositions','covers','weaponRanges'])||
    !Array.isArray(scene.sightlines)||!Array.isArray(scene.sameZoneRanges)||
    !Array.isArray(scene.doorPositions)||!Array.isArray(scene.covers)||
    !Array.isArray(scene.weaponRanges)||
    scene.sightlines.length>600||scene.sameZoneRanges.length>200||
    scene.doorPositions.length>200||scene.covers.length>200||
    scene.weaponRanges.length>200)fail('engine-certified physical scene required');
  const sights=new Set();
  for(const edge of scene.sightlines) {
    if(!Array.isArray(edge)||edge.length!==2||!edge.every(id)||
      edge[0]===edge[1]||!world.hasRoom(edge[0])||!world.hasRoom(edge[1])||
      world.distance(edge[0],edge[1])>4||
      sights.has(pair(...edge)))fail('invalid or duplicate direct sightline');
    sights.add(pair(...edge));
  }
  const bodies=[...state.actors,...(Array.isArray(state.dinosaurs)?state.dinosaurs:[])];
  const bodyLocations=new Map();
  for(const body of bodies) {
    if(!record(body)||!id(body.id)||bodyLocations.has(body.id)||
      !world.hasRoom(body.location))fail('uncertified body or physical location');
    bodyLocations.set(body.id,body.location);
  }
  const same=new Map();
  for(const relative of scene.sameZoneRanges) {
    if(!record(relative)||!validKeys(relative,['a','b','range'])||
      !id(relative.a)||!id(relative.b)||relative.a===relative.b||
      !['adjacent','short'].includes(relative.range)||
      !bodyLocations.has(relative.a)||!bodyLocations.has(relative.b)||
      bodyLocations.get(relative.a)!==bodyLocations.get(relative.b)||
      same.has(pair(relative.a,relative.b)))fail('invalid certified same-zone separation');
    same.set(pair(relative.a,relative.b),relative.range);
  }
  const doors=new Set();
  for(const at of scene.doorPositions) {
    if(!record(at)||!validKeys(at,['actorId','toward'])||
      !id(at.actorId)||!id(at.toward)||!bodyLocations.has(at.actorId)||
      !world.room(bodyLocations.get(at.actorId)).exits.includes(at.toward)||
      doors.has(at.actorId+'|'+at.toward))fail('invented doorway position');
    doors.add(at.actorId+'|'+at.toward);
  }
  const cover=new Map();
  for(const c of scene.covers) {
    if(!record(c)||!validKeys(c,['id','room','level','itemId','occludes'])||
      !id(c.id)||cover.has(c.id)||!world.hasRoom(c.room)||
      !['partial','full'].includes(c.level)||
      (own(c,'occludes')&&!isBool(c.occludes))||
      (own(c,'itemId')&&(!id(c.itemId)||!own(compiled.definition.itemNames,c.itemId))))
      fail('invalid authored cover');
    cover.set(c.id,c);
  }
  const ranges=new Map();
  for(const r of scene.weaponRanges) {
    if(!record(r)||!validKeys(r,['itemId','minimum','maximum'])||
      !id(r.itemId)||ranges.has(r.itemId)||
      !BANDS.includes(r.minimum)||!BANDS.includes(r.maximum)||
      BANDS.indexOf(r.minimum)>BANDS.indexOf(r.maximum))
      fail('invalid source-authored weapon ranges');
    ranges.set(r.itemId,r);
  }
  return {sights,same,doors,cover,ranges};
}
function openVisualPath(world,sights,from,to) {
  if(from===to)return true;
  // Sightlines are not transitive: a bend or wall can block a shot even if
  // adjoining rooms can each see one another.
  if(!sights.has(pair(from,to)))return false;
  const visited=new Set([from]),queue=[from];
  for(let i=0;i<queue.length;i++) {
    for(const next of world.room(queue[i]).exits) {
      if(!sights.has(pair(queue[i],next))||visited.has(next))continue;
      if(next===to)return true;
      visited.add(next);queue.push(next);
    }
  }
  return false;
}
function rangeBand(hops,sameZone) {
  if(hops===0)return sameZone;
  if(hops===1)return 'medium';
  if(hops<=3)return 'long';
  if(hops===4)return 'extreme';
  return null;
}

/**
 * Pure preflight for a future DHR-011 shot. Source-owned inputs:
 *  compiled: validated, fingerprinted adventure definition and seed;
 *  state: engine-validated candidate world (including locations and gear);
 *  stock: independent authored finite ammunition total;
 *  targets: engine-derived DHR-011 target roster;
 *  scene: independently authored visible room pairs, current authenticated
 *         same-room separations/door positions, physical cover and gun ranges.
 *
 * Same-room positions must explicitly certify SHORT or ADJACENT; mere room
 * membership cannot be treated as a weapon range. Cross-room visibility needs
 * a DIRECT authored sightline plus an open, contiguous sightline path.
 * A full-cover target with occludes:true is invisible; otherwise source cover
 * penalizes its actually occupied, real position. No player-supplied ranges.
 *
 * 'eligible' means geometry only, NOT a legal committed attack, successful
 * roll, attack action, hit or wound. 'modifier' is a certified dice adjustment
 * for the future combined roll integration; DHR-011 does not yet accept it.
 */
export function assessRangedGeometry(compiled,state,stock,action,targets,scene) {
  if(!validateCompiledAdventure(compiled))fail('validated compiled adventure required');
  if(!record(state)||!Array.isArray(state.actors)||!record(state.rooms)||
    !validAdventureBinding(state.adventureBinding,compiled))fail('world/adventure binding');
  const world=createAdventureWorld(compiled);
  if(Object.keys(state.rooms).sort().join('|')!==
      Object.keys(compiled.definition.rooms).sort().join('|'))
    fail('world rooms differ from certified adventure graph');
  validateAction(action);
  const roster=targetRoster(targets);
  validateAmmunitionConservation(state,stock);
  const source=registerScene(compiled,state,scene,world);
  const shooter=state.actors.find(a=>a.id===action.actorId);
  if(!shooter)return deny('Attacking actor does not exist.');
  if(shooter.dead||shooter.broken||shooter.pendingSkip||shooter.health===0)
    return deny('Attacking actor cannot act.');
  if(shooter.id===action.targetId)return deny('Shooter cannot target themself.');
  if(!roster.has(action.targetId))return deny('Target absent from trusted roster.');
  const target=[...state.actors,...(state.dinosaurs||[])].find(a=>a.id===action.targetId);
  if(!target)return deny('Target absent from actual world.');
  if(target.dead||target.defeated||target.health===0)
    return deny('Target already out of action.');
  if(state.dinosaurs?.some(d=>d.id===target.id)&&
    !validateCreatureContinuity(compiled,state))
    return deny('Creature location or seeded presence cannot be certified.');
  const weapon=state.weapons?.find(w=>w.id===action.weaponId);
  if(!weapon||weapon.class!=='ranged'||weapon.ownerId!==shooter.id)
    return deny('Actor lacks the declared physical ranged weapon.');
  if(weapon.ammo.loaded===0)return deny('Ranged weapon has no loaded ammunition.');
  const spec=source.ranges.get(weapon.itemId);
  if(!spec)return deny('No source-certified range profile for this weapon.');
  if(target.hidden===true)return deny('Concealed target has not been seen.');
  const hops=world.distance(shooter.location,target.location);
  if(!Number.isFinite(hops)||hops>4)return deny('Target is outside certified range geometry.');
  const separation=hops===0?source.same.get(pair(shooter.id,target.id)):null;
  if(hops===0&&!separation)
    return deny('Same-zone target separation is not physically certified.');
  if(separation==='adjacent')
    return deny('Adjacent contact requires the close-combat firearm procedure.');
  if(!openVisualPath(world,source.sights,shooter.location,target.location))
    return deny('No open, direct physical line of sight to target.');
  const band=rangeBand(hops,separation),index=BANDS.indexOf(band);
  const min=BANDS.indexOf(spec.minimum),max=BANDS.indexOf(spec.maximum);
  const doorwayException=band==='medium'&&max===1&&
    source.doors.has(shooter.id+'|'+target.location);
  if(index>max&&!doorwayException)
    return deny('Target exceeds weapon maximum range.');
  const activeCover=target.coverId==null?null:source.cover.get(target.coverId);
  if(target.coverId!=null&&(!activeCover||activeCover.room!==target.location))
    return deny('Target cover is not a physically present authored barrier.');
  if(activeCover?.itemId&&
    !state.rooms[activeCover.room].items.includes(activeCover.itemId))
    return deny('Claimed cover object is no longer physically present.');
  if(activeCover?.level==='full'&&activeCover.occludes===true)
    return deny('Full barrier entirely blocks line of sight.');
  const belowMin=Math.max(0,min-index);
  const rangeModifier=-2*belowMin;
  const coverModifier=activeCover?.level==='full'?-3:
    activeCover?.level==='partial'?-2:0;
  return Object.freeze({
    eligible:true,actorId:shooter.id,targetId:target.id,
    weaponId:weapon.id,rangeBand:band,zoneHops:hops,
    doorwayException,rangeModifier,coverModifier,
    modifier:rangeModifier+coverModifier,
    coverId:activeCover?.id??null,
    // The lower-level attack must still verify initiative, budget, state,
    // ammo, skill check and seed. Dice modifiers must be integrated later.
    hasCommittedAction:false,ammoSpent:0,draws:0,
  });
}
