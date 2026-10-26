// Source-authorized, voluntary physical peril resolution for any compiled adventure.
// Evolved dice, health, and critical injury code stay in their canonical modules.
// The referee may present opportunities; it cannot spawn attacks or mutate a save.
import {validateCompiledAdventure} from './adventure-definition.mjs';
import {resolveSkillCheck} from './evolved-checks.mjs';
import {applyCreatureAttack} from './evolved-encounters.mjs';
import {enrichInjuries} from './evolved-injuries.mjs';

const copy=x=>JSON.parse(JSON.stringify(x));
function known(compiled){
 if(!validateCompiledAdventure(compiled))throw new RangeError('Validated adventure required.');
 return compiled.definition.perils||[];
}
function eligible(compiled,state,actor,peril){
 return Boolean(actor&&!actor.dead&&!actor.broken&&state?.outcome==='playing'&&
  actor.location===peril.room&&
  state.dinosaurs?.some(d=>d.id===peril.creatureId&&!d.defeated&&d.location===peril.room)&&
  (!peril.variant||compiled.hiddenFacts[peril.variant.slot]?.id===peril.variant.choice)&&
  !state.perilRecords?.some(r=>r.id===peril.id&&r.actorId===actor.id));
}
export function availablePhysicalPerils(compiled,state,actorId){
 const defs=known(compiled);
 const actor=state.actors?.find(a=>a.id===actorId);
 return defs.filter(p=>eligible(compiled,state,actor,p))
  .map(p=>({id:p.id,title:p.title,description:p.description,skill:p.skill}));
}
export function validPerilRecords(compiled,state){
 const defs=known(compiled),records=state?.perilRecords;
 if(records===undefined)return true;
 if(!Array.isArray(records)||records.length>defs.length*(state?.actors?.length||0))return false;
 const seen=new Set();let last=-1;
 return records.every(r=>{
  const peril=defs.find(p=>p.id===r?.id);
  const key=r?.id+':'+r?.actorId;
  const action=state.actions?.find(a=>a.kind==='danger'&&a.target===r?.id&&
   a.actorId===r.actorId&&a.beat===r.beat&&a.damage===r.damage&&
   a.success===r.success);
  if(!peril||seen.has(key)||r.room!==peril.room||
   !state.actors.some(a=>a.id===r.actorId)||
   !Number.isSafeInteger(r.beat)||r.beat<last||r.beat>=state.beat||
   typeof r.success!=='boolean'||!Number.isSafeInteger(r.damage)||
   r.damage<0||r.damage>peril.baseDamage+peril.attackerDice-1||
   (r.success&&r.damage!==0)||
   (peril.variant&&compiled.hiddenFacts[peril.variant.slot]?.id!==peril.variant.choice)||
   (!action&&r.beat>=(state.actions?.[0]?.beat??-1)))return false;
  seen.add(key);last=r.beat;return true;
 });
}
export function resolvePhysicalPeril(compiled,state,{actorId,perilId,skillSeed,attackSeed,time=0,push=0}={}){
 const defs=known(compiled);
 const reject=reason=>({accepted:false,state,reason});
 if(!validPerilRecords(compiled,state))return reject('Invalid previous peril history.');
 const peril=defs.find(p=>p.id===perilId);
 const actor=state?.actors?.find(a=>a.id===actorId);
 if(!peril||!eligible(compiled,state,actor,peril))
  return reject('This risky physical interaction is not available to that survivor.');
 if(!Number.isSafeInteger(skillSeed)||skillSeed<0||skillSeed>0xffffffff||
    !Number.isSafeInteger(attackSeed)||attackSeed<0||attackSeed>0xffffffff)
  return reject('A seeded Evolved resolution is required.');
 const check=resolveSkillCheck(actor,{skill:peril.skill,modifier:peril.modifier,
  context:'hazard_evade',seed:skillSeed,push});
 let strike=null,after=check.after;
 if(!check.success){
  strike=applyCreatureAttack(after,{seed:attackSeed,attackerDice:peril.attackerDice,
   baseDamage:peril.baseDamage});
  after=enrichInjuries(strike.after,time,attackSeed);
 }
 const record={id:peril.id,actorId,room:peril.room,beat:state.beat,
  success:check.success,damage:strike?.damage||0};
 return {accepted:true,check,strike,actorAfter:after,record,
  result:{kind:'danger',id:peril.id,success:check.success,damage:record.damage,
   critical:strike?.critical?.code??null}};
}
