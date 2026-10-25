// 009-B2a: pure, source-gated objective progress using validated adventure data.
// Does not roll dice, assess skill eligibility or apply untrusted AI proposals.
import {validateCompiledAdventure} from './adventure-definition.mjs';
const copy=x=>JSON.parse(JSON.stringify(x));
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function definition(compiled){
 if(!validateCompiledAdventure(compiled))throw new RangeError('Expected a validated compiled adventure.');
 return compiled.definition;
}
function already(state,o){
 if(state.objectiveRecords?.some(r=>r.id===o.id))return true;
 // Optional legacy Party-v3 histories: existing true flags prove prior effects.
 const flags=o.effects.filter(e=>e.type==='flag');
 return flags.length>0&&flags.every(e=>state.flags?.[e.name]===e.value);
}
export function objectiveStatus(compiled,state){
 const d=definition(compiled);
 return {adventureId:d.id,
  completedIds:d.objectives.filter(o=>already(state,o)).map(o=>o.id),
  remainingIds:d.objectives.filter(o=>!already(state,o)).map(o=>o.id)};
}
export function validObjectiveRecords(compiled,state){
 const d=definition(compiled),records=state?.objectiveRecords;
 if(records===undefined)return true; // old accepted saves
 if(!Array.isArray(records)||records.length>d.objectives.length)return false;
 const seen=new Set();
 return records.every(r=>{
  const o=d.objectives.find(x=>x.id===r?.id);
  if(!o||seen.has(r.id)||r.room!==o.room||
   !Number.isSafeInteger(r.beat)||r.beat<0||
   !Number.isSafeInteger(state.beat)||r.beat>state.beat||
   typeof r.actorId!=='string'||!state.actors?.some(a=>a.id===r.actorId))return false;
  seen.add(r.id);
  return true;
 });
}
export function commitAuthorizedObjective(compiled,state,{objectiveId,actorId,authorization}={}){
 const d=definition(compiled);
 const reject=reason=>({accepted:false,state,reason});
 // Requires an already resolved, deterministic engine action; never a UI command.
 if(authorization?.kind!=='engine-committed-rule'||authorization.success!==true)
  return reject('A successful engine-authorized action is required.');
 if(!state||state.outcome!=='playing'||state.adventureOutcome)
  return reject('Adventure is not active.');
 if(!validObjectiveRecords(compiled,state))return reject('Invalid objective records.');
 const o=d.objectives.find(x=>x.id===objectiveId);
 if(!o)return reject('Unknown authored objective.');
 const actor=state.actors?.find(x=>x.id===actorId);
 if(!actor||actor.dead||actor.broken)return reject('A living capable survivor is required.');
 if(actor.location!==o.room)return reject('The physical interaction is not in this room.');
 if(already(state,o))return reject('Objective already complete.');
 if(o.requires.some(id=>!already(state,d.objectives.find(x=>x.id===id))))
  return reject('Prerequisites are not complete.');
 if(!state.flags||o.effects.some(e=>e.type==='flag'&&!own(state.flags,e.name)))
  return reject('State lacks authored flags.');
 const next=copy(state);
 for(const effect of o.effects){
  if(effect.type==='flag')next.flags[effect.name]=effect.value;
  if(effect.type==='end')next.adventureOutcome=effect.outcome;
 }
 next.objectiveRecords??=[];
 next.objectiveRecords.push({id:o.id,actorId,room:actor.location,beat:state.beat});
 return {accepted:true,state:next,result:{objectiveId:o.id,
  effects:copy(o.effects),adventureOutcome:next.adventureOutcome||null}};
}
