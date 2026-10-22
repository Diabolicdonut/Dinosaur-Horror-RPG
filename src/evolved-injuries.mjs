// 007-G: source-grounded injury and clinical clock procedures, original code.
// Authority: user-owned Alien RPG Evolved Edition, printed pp. 68–71.
// Mechanical facts are mapped to an original Jurassic survival data representation.
// Existing 007-E D66 saves remain loadable; enrichment is lazy and non-destructive.
import {createDiceStream,resolveSkillCheck} from './evolved-checks.mjs';
export const MEDICAL_VERSION='007-G';
export const ROUND_SECONDS=10, STRETCH_SECONDS=600, SHIFT_SECONDS=21600, DAY_SECONDS=86400;
const copy=x=>JSON.parse(JSON.stringify(x));
const rec=(label,opts={})=>Object.freeze({label,lethal:null,heal:null,surgery:false,mods:{},...opts});
// D66 index: modifiers, movement action overrides and treatment requirements.
// Effects described as data, not copied rulebook text. D6 durations are in days.
export const TRAUMA=Object.freeze({
 11:rec('Clear Head',{stressRelief:true}),12:rec('Breathless'),13:rec('Acute Pain',{stressGain:1}),
 14:rec('Ankle Strain',{moveFull:true,heal:'shift'}),
 15:rec('Obscured Sight',{mods:{ranged_combat:-1,observation:-1},heal:'shift'}),
 16:rec('Head Impact',{mods:{observation:-1,comtech:-1},heal:'d6'}),
 21:rec('Ear Injury',{mods:{observation:-2},heal:'d6'}),
 22:rec('Toe Fracture',{moveFull:true,heal:'d6'}),
 23:rec('Hand Injury',{twoHands:-1,heal:'d6'}),
 24:rec('Dental Trauma',{mods:{manipulation:-2},heal:'d6'}),
 25:rec('Thigh Penetration',{moveFull:true,heal:'2d6'}),
 26:rec('Shoulder Laceration',{twoArms:-2,heal:'d6'}),
 31:rec('Nasal Fracture',{mods:{manipulation:-1,observation:-1},heal:'d6'}),
 32:rec('Rib Fractures',{mods:{mobility:-2,close_combat:-2},heal:'2d6'}),
 33:rec('Ocular Trauma',{mods:{ranged_combat:-2,observation:-2},surgery:true,heal:'2d6'}),
 34:rec('Throat Injury',{mods:{manipulation:-2,command:-2},heal:'2d6'}),
 35:rec('Arm Fracture',{twoArms:-3,heal:'3d6'}),
 36:rec('Leg Fracture',{moveFull:true,heal:'3d6'}),
 41:rec('Crushed Foot',{moveFull:true,surgery:true,heal:'3d6'}),
 42:rec('Facial Injury',{mods:{manipulation:-2},surgery:true,heal:'2d6'}),
 43:rec('Acute Trauma',{mentalTrauma:true,heal:null}),
 44:rec('Thoracic Puncture',{lethal:'shift',mods:{mobility:-2,close_combat:-2},surgery:true,heal:'d6'}),
 45:rec('Abdominal Bleeding',{lethal:'shift',bleedSkills:['mobility','close_combat'],heal:'d6'}),
 46:rec('Septic Wound',{lethal:'shift',infectionRisk:true,heal:null}),
 51:rec('Skull Fracture',{lethal:'shift',mods:{observation:-2,comtech:-2},surgery:true,heal:'3d6'}),
 52:rec('Spinal Trauma',{lethal:'shift',immobile:true,surgery:true,heal:'4d6'}),
 53:rec('Arm Hemorrhage',{lethal:'stretch',twoArms:-1,heal:'d6'}),
 54:rec('Leg Hemorrhage',{lethal:'stretch',moveFull:true,heal:'d6'}),
 55:rec('Arm Amputation',{lethal:'stretch',twoArms:-3,surgery:true,prosthesis:true,heal:'4d6'}),
 56:rec('Leg Amputation',{lethal:'stretch',moveFull:true,surgery:true,prosthesis:true,heal:'4d6'}),
 61:rec('Neck Vessel Rupture',{lethal:'round',stamina:-1,heal:'2d6'}),
 62:rec('Internal Hemorrhage',{lethal:'round',stamina:-2,heal:'3d6'}),
 63:rec('Severe Hemorrhage',{lethal:'round',stamina:-3,surgery:true,heal:'4d6'}),
 64:rec('Severe Abdominal Trauma',{lethal:'instant'}),
 65:rec('Cranial Destruction',{lethal:'instant'}),
 66:rec('Cardiac Penetration',{lethal:'instant'})
});
const acceptedN=n=>Number.isSafeInteger(n)&&n>=0;
const unitSeconds=unit=>unit==='round'?ROUND_SECONDS:unit==='stretch'?STRETCH_SECONDS:
  unit==='shift'?SHIFT_SECONDS:null;
export function worldSeconds(state){
 const c=state.clock||{};
 return (acceptedN(c.explorationStretches)?c.explorationStretches:
   Math.floor(state.beat/state.actors.length))*STRETCH_SECONDS+
   (acceptedN(c.combatSeconds)?c.combatSeconds:0);
}
export function woundModifiers(actor,skill,{twoHands=false,twoArms=false}={}){
 let modifier=0,moveFull=false,immobile=false,bleeds=false;
 for(const wound of actor.criticalInjuries||[]){
  if(wound.healed)continue;
  const rule=TRAUMA[wound.code];
  if(!rule)continue;
  modifier+=rule.mods?.[skill]||0;
  if(skill==='stamina')modifier+=rule.stamina||0;
  if(twoHands)modifier+=rule.twoHands||0;
  if(twoArms)modifier+=rule.twoArms||0;
  moveFull ||= Boolean(rule.moveFull);
  immobile ||= Boolean(rule.immobile);
  bleeds ||= Boolean(rule.bleedSkills?.includes(skill));
 }
 return {modifier:Math.max(-15,modifier),moveFull,immobile,bleeds};
}
export function healingDays(rule,seed){
 if(!rule.heal||rule.heal==='shift')return rule.heal==='shift'?1/4:null;
 const count=rule.heal==='d6'?1:Number.parseInt(rule.heal[0],10);
 if(![1,2,3,4].includes(count))throw new RangeError('Unknown healing duration.');
 const rng=createDiceStream(seed);
 return Array.from({length:count},()=>rng.rollD6()).reduce((a,b)=>a+b,0);
}
/** Add mechanical wound facts and deadlines to old 007-E/007-F injury codes. */
export function enrichInjuries(actor,time,seed=1993){
 const next=copy(actor);
 next.criticalInjuries=(next.criticalInjuries||[]).map((w,i)=>{
  if(w.healed||w.medicalVersion==='007-G')return w;
  const rule=TRAUMA[w.code];
  if(!rule)return w; // Preserve unknown historical codes without inventing outcomes.
  const born=acceptedN(w.inflictedAt)?w.inflictedAt:time;
  const lethal=rule.lethal;
  return {...w,label:rule.label,lethal:Boolean(lethal),
   deadline:lethal||null,medicalVersion:MEDICAL_VERSION,inflictedAt:born,
   stabilized:Boolean(w.stabilized),
   deathSuccesses:w.deathSuccesses||0,
   nextDeathAt:lethal&&lethal!=='instant'?
     (acceptedN(w.nextDeathAt)?w.nextDeathAt:born+unitSeconds(lethal)):null,
   surgeryDone:Boolean(w.surgeryDone),
   healingDays:w.healingDays??healingDays(rule,(seed^(w.code<<8)^i)>>>0),
   healingProgress:w.healingProgress||0,healed:Boolean(w.healed)
  };
 });
 return next;
}
export function applyNewCritical(actor,critical,{time=0,seed=1993}={}){
 if(!critical)return copy(actor);
 const next=copy(actor);
 next.criticalInjuries=[...(next.criticalInjuries||[]),critical];
 const indexed=enrichInjuries(next,time,seed);
 const rule=TRAUMA[critical.code];
 if(rule?.stressRelief)indexed.stress=0;
 if(rule?.stressGain)indexed.stress=Math.min(30,(indexed.stress||0)+1);
 if(rule?.lethal==='instant'){indexed.dead=true;indexed.health=0;}
 return indexed;
}
export function pendingLethal(actor){
 return (actor.criticalInjuries||[]).filter(w=>{
  const rule=TRAUMA[w.code];
  return Boolean(rule?.lethal&&rule.lethal!=='instant'&&!w.healed&&!w.stabilized);
 });
}
export function clinicallyEligible(patient){
 return Boolean(patient&&!patient.dead&&(patient.broken||pendingLethal(patient).length));
}
export function resolveClinicalAid(medic,patient,{seed=1993,self=false,medicalGear=false,time=0}={}){
 if(!clinicallyEligible(patient)||!medic||(!self&&medic.id===patient.id))
  return {accepted:false,reason:'No living broken or unstabilized lethal-injury patient.'};
 if(self&&patient.id!==medic.id)return {accepted:false,reason:'Self-care must target the actor.'};
 if(self&&patient.broken)return {accepted:false,reason:'Broken survivors cannot treat themselves.'};
 const roll=resolveSkillCheck(medic,{skill:'medical_aid',context:'first_aid',
  modifier:(self?-2:0)+(medicalGear?1:0),seed});
 const target=enrichInjuries(patient,time,seed),now=copy(target),events=[];
 if(roll.success){
  for(const w of pendingLethal(now)){w.stabilized=true;w.nextDeathAt=null;}
  if(now.broken){
   now.health=Math.min(now.healthMax,Math.max(1,roll.successes));
   now.broken=false;
  }
  now.stabilized=true;
  events.push('stabilized');
 }else{
  for(const w of pendingLethal(now)){
   const index=['shift','stretch','round'].indexOf(w.deadline);
   if(index>=2){now.dead=true;now.health=0;events.push('death_from_failed_treatment');break;}
   if(index>=0){
    w.deadline=['shift','stretch','round'][index+1];
    w.nextDeathAt=time+unitSeconds(w.deadline);
    events.push('lethal_interval_worsened');
   }
  }
 }
 return {accepted:true,success:roll.success,medicAfter:roll.after,patient:now,roll,events};
}
export function resolveRally(commander,patient,{seed=1993}={}){
 if(!patient||patient.dead||!patient.broken||commander.id===patient.id)
  return {accepted:false,reason:'Rally requires a living broken teammate.'};
 const roll=resolveSkillCheck(commander,{skill:'command',context:'rally',seed});
 const after=copy(patient);
 if(roll.success){after.broken=false;after.health=Math.min(after.healthMax,Math.max(1,roll.successes));}
 return {accepted:true,success:roll.success,commanderAfter:roll.after,patient:after,roll};
}
export function resolveSurgery(medic,patient,{seed=1993,medicalGear=false}={}){
 const pending=(patient?.criticalInjuries||[]).filter(w=>
   !w.healed&&!w.surgeryDone&&TRAUMA[w.code]?.surgery);
 if(!medic||!patient||medic.id===patient.id||patient.dead||!pending.length)
  return {accepted:false,reason:'No treatable surgery-requiring wound.'};
 if(!medicalGear)return {accepted:false,reason:'Surgery requires suitable medical equipment.'};
 const roll=resolveSkillCheck(medic,{skill:'medical_aid',context:'surgery',modifier:1,seed});
 const after=copy(patient);
 if(roll.success){
  for(const wound of after.criticalInjuries)
   if(!wound.healed&&TRAUMA[wound.code]?.surgery)wound.surgeryDone=true;
 }
 return {accepted:true,success:roll.success,medicAfter:roll.after,patient:after,roll};
}
/** A death check is a no-stress, unpushable STAMINA roll. */
export function deathRoll(actor,{seed=1993,injuryCode=null}={}){
 const pending=pendingLethal(actor);
 const injury=pending.find(x=>injuryCode===null||x.code===injuryCode);
 if(!injury)return {accepted:false,reason:'No untreated lethal wound.'};
 const character={...actor,stress:0,stressResponses:[]};
 const roll=resolveSkillCheck(character,{skill:'stamina',modifier:woundModifiers(actor,'stamina').modifier,
  seed,passive:true,push:0});
 const next=copy(actor),w=next.criticalInjuries.find(x=>x.code===injury.code&&!x.stabilized&&!x.healed);
 if(roll.success){
  w.deathSuccesses=(w.deathSuccesses||0)+1;
  if(w.deathSuccesses>=3){w.stabilized=true;w.nextDeathAt=null;}
 }else{
  next.dead=true;next.health=0;next.broken=true;
 }
 return {accepted:true,success:roll.success,roll,next,injuryCode:injury.code,
  threeSaves:roll.success&&w.deathSuccesses>=3};
}
export function tickMedicalClock(actor,{from,to,seed=1993,safeRest=false,nurse=false}={}){
 if(!acceptedN(from)||!acceptedN(to)||to<from)
  throw new RangeError('Medical time must progress forward.');
 let next=enrichInjuries(actor,from,seed);
 const events=[];
 const rng=createDiceStream(seed);
 for(const wound of next.criticalInjuries||[]){
  if(next.dead)break;
  const rule=TRAUMA[wound.code];
  if(!rule||wound.healed)continue;
  if(rule.lethal&&!wound.stabilized&&rule.lethal!=='instant'){
   if(!acceptedN(wound.nextDeathAt))wound.nextDeathAt=from+unitSeconds(wound.deadline);
   let checks=0;
   while(!next.dead&&!wound.stabilized&&wound.nextDeathAt<=to&&checks++<250){
    const rolled=deathRoll(next,{seed:(rng.rollD6()*0x00101101+wound.nextDeathAt)>>>0,injuryCode:wound.code});
    next=rolled.next;
    const updated=next.criticalInjuries.find(x=>x.code===wound.code);
    events.push({kind:rolled.success?'death_save_pass':'death_save_fail',code:wound.code,time:wound.nextDeathAt});
    if(!next.dead&&!updated.stabilized)updated.nextDeathAt=wound.nextDeathAt+unitSeconds(wound.deadline);
    if(updated.stabilized)break;
    wound.nextDeathAt=updated.nextDeathAt;
   }
  }
 }
 const stretches=Math.floor(to/STRETCH_SECONDS)-Math.floor(from/STRETCH_SECONDS);
 if(stretches>0&&!next.dead){
  if(next.broken){next.broken=false;next.health=Math.max(1,next.health);}
  if(safeRest&&!next.fatigued){
   next.health=Math.min(next.healthMax,next.health+stretches);
   next.stress=Math.max(0,(next.stress||0)-stretches);
   next.stressResponses=(next.stressResponses||[]).slice(stretches);
  }
 }
 if(!next.dead){
  const healingDays=(to-from)/DAY_SECONDS*(nurse?2:1);
  for(const w of next.criticalInjuries||[]){
   if(w.healed||w.healingDays===null||w.healingDays===undefined)continue;
   if(TRAUMA[w.code]?.surgery&&!w.surgeryDone)continue;
   w.healingProgress=(w.healingProgress||0)+healingDays;
   if(w.healingProgress>=w.healingDays){
    w.healed=true;events.push({kind:'injury_healed',code:w.code,time:to});
   }
  }
 }
 return {after:next,events,elapsedSeconds:to-from};
}
