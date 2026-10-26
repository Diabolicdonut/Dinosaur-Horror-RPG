// 009-B2b2c2a: data-bound, deterministic physical animal presence and patrol.
// No artificial story-spawn, teleport, off-map fact reveal, attack or fake combat.
// Combat, injury clocks and NPC dialogue remain the authority of separate engines.
import {validateCompiledAdventure} from './adventure-definition.mjs';

const copy=x=>JSON.parse(JSON.stringify(x));
function definitions(compiled){
 if(!validateCompiledAdventure(compiled))throw new RangeError('Validated AdventureInstance required.');
 return compiled.definition.initialCreatures.filter(c=>
  !c.when||compiled.hiddenFacts[c.when.slot]?.id===c.when.choice);
}
export function initialAdventureCreatures(compiled){
 return copy(definitions(compiled).map(d=>({
  id:d.id,kind:d.species,location:d.location,disposition:d.disposition,defeated:false
 })));
}
export function validateCreatureContinuity(compiled,state){
 const defs=definitions(compiled),creatures=state?.dinosaurs,records=state?.creatureRecords;
 if(!Array.isArray(creatures)||creatures.length!==defs.length)return false;
 if(records===undefined)return !defs.some(d=>d.patrol);
 if(!Array.isArray(records)||records.length>2000)return false;
 const positions=Object.fromEntries(defs.map(d=>[d.id,d.location]));
 const seen=new Set();let last=-1;
 for(const r of records){
  const d=defs.find(d=>d.id===r?.id);
  const marker=r?.id+':'+r?.beat;
  if(!d?.patrol||seen.has(marker)||!Number.isSafeInteger(r.beat)||
   r.beat<1||r.beat>state.beat||r.beat<last||
   !Number.isInteger(state.actors?.length)||state.actors.length===0||
   r.beat%state.actors.length!==0||
   ((r.beat/state.actors.length-1)%d.patrol.cadence)!==0||
   r.from!==positions[d.id]||
   d.patrol.path[(d.patrol.path.indexOf(r.from)+1)%d.patrol.path.length]!==r.to)
   return false;
  seen.add(marker);last=r.beat;positions[d.id]=r.to;
 }
 return creatures.every((creature,i)=>{
  const d=defs[i];
  if(creature.id!==d.id||creature.kind!==d.species||
   creature.disposition!==d.disposition||creature.defeated!==false)return false;
  if(d.patrol)return creature.location===positions[d.id];
  // A neutral animal may flee along a separately Evolved-checked, authored edge.
  const escaped=state.actions?.some(a=>
   a.kind==='wildlife'&&a.target==='approach'&&a.success===false);
  return creature.location===d.location||
   (escaped&&compiled.definition.rooms[d.location]?.exits.includes(creature.location));
 });
}
export function advanceAutonomousCreatures(compiled,previous){
 const defs=definitions(compiled);
 if(!validateCreatureContinuity(compiled,previous))
  throw new RangeError('Cannot advance a physically inconsistent animal population.');
 const state=copy(previous);
 state.creatureRecords??=[];
 if(state.outcome!=='playing'||!Number.isInteger(state.beat)||
  !state.actors?.length||state.beat===0||state.beat%state.actors.length!==0)
  return state;
 const completed=state.beat/state.actors.length;
 for(const d of defs){
  if(!d.patrol||(completed-1)%d.patrol.cadence!==0||
     state.creatureRecords.some(r=>r.id===d.id&&r.beat===state.beat))continue;
  const animal=state.dinosaurs.find(c=>c.id===d.id);
  if(!animal||animal.defeated)continue;
  const from=animal.location;
  const i=d.patrol.path.indexOf(from);
  if(i<0)throw new RangeError('Animal is outside its authored patrol.');
  const to=d.patrol.path[(i+1)%d.patrol.path.length];
  // The authored, two-way physical room graph is checked at compile time.
  animal.location=to;
  state.creatureRecords.push({id:d.id,from,to,beat:state.beat});
  // Never narrate a creature's distant position in a global event log.
 }
 return state;
}
