import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,partyStep,isPartySave,partyView} from '../src/party-engine.mjs';
import {activeCombatSlot,beginCombat} from '../src/combat-turns.mjs';
import {actorObservation,chooseCompanionAction} from '../src/party-director.mjs';
import {TRAUMA,worldSeconds,woundModifiers,enrichInjuries,pendingLethal,
 resolveClinicalAid,resolveRally,resolveSurgery,deathRoll,tickMedicalClock,healingDays,
 ROUND_SECONDS,STRETCH_SECONDS,SHIFT_SECONDS,DAY_SECONDS} from '../src/evolved-injuries.mjs';
const chars=makeParty({seed:2025,size:3,careers:['ranger','medic','maintenance']});
const base=()=>newPartyIncident({seed:1337,roster:chars});
function injured(code,{broken=true}={}){
 const s=base(),p=s.actors[0];
 p.health=broken?0:2;p.broken=broken;
 p.criticalInjuries=[{code,...{severity:'critical',lethal:Boolean(TRAUMA[code]?.lethal),
  deadline:TRAUMA[code]?.lethal||null,impairment:2}}];
 s.actors[0]=enrichInjuries(p,worldSeconds(s),633);
 return s;
}
function byId(s,id){return s.actors.find(a=>a.id===id);}
test('all 36 D66 results are accounted for with source-correct lethality and deadline categories',()=>{
 assert.equal(Object.keys(TRAUMA).length,36);
 for(let tens=1;tens<=6;tens++)for(let ones=1;ones<=6;ones++)
  assert(TRAUMA[tens*10+ones]);
 for(const code of [44,45,46,51,52])assert.equal(TRAUMA[code].lethal,'shift');
 for(const code of [53,54,55,56])assert.equal(TRAUMA[code].lethal,'stretch');
 for(const code of [61,62,63])assert.equal(TRAUMA[code].lethal,'round');
 for(const code of [64,65,66])assert.equal(TRAUMA[code].lethal,'instant');
 for(const code of [13,14,21,32,43])assert.equal(TRAUMA[code].lethal,null);
});
test('injuries impose the exact affected-skill penalties and alternate combat movement cost',()=>{
 const s=injured(32),p=s.actors[0];
 assert.equal(woundModifiers(p,'mobility').modifier,-2);
 assert.equal(woundModifiers(p,'close_combat').modifier,-2);
 assert.equal(woundModifiers(p,'stamina').modifier,0);
 const leg=injured(54).actors[0];
 assert.equal(woundModifiers(leg,'mobility').moveFull,true);
 const spine=injured(52).actors[0];
 assert.equal(woundModifiers(spine,'mobility').immobile,true);
 const severe=injured(63).actors[0];
 assert.equal(woundModifiers(severe,'stamina').modifier,-3);
});
test('multiple active wounds stack only their applicable penalties; healed wounds stop applying them',()=>{
 const s=injured(31),p=s.actors[0];
 p.criticalInjuries.push({...enrichInjuries({...p,criticalInjuries:[{code:16}]},0,25)
  .criticalInjuries[0]});
 assert.equal(woundModifiers(p,'observation').modifier,-2);
 p.criticalInjuries[0].healed=true;
 assert.equal(woundModifiers(p,'observation').modifier,-1);
});
test('D6, 2D6, 3D6 and 4D6 healing durations are bounded and seeded',()=>{
 for(const [code,min,max] of [[16,1,6],[32,2,12],[35,3,18],[52,4,24]]){
  const value=healingDays(TRAUMA[code],131);
  assert(value>=min&&value<=max);
  assert.equal(value,healingDays(TRAUMA[code],131));
 }
 assert.equal(healingDays(TRAUMA[14],99),0.25);
});
test('enriching old D66 records is deterministic and does not modify the original save',()=>{
 const s=injured(61);
 const old={...s.actors[0],criticalInjuries:[{code:61,lethal:true,deadline:'round'}]};
 const before=structuredClone(old);
 const a=enrichInjuries(old,0,41),b=enrichInjuries(old,0,41);
 assert.deepEqual(a,b);
 assert.deepEqual(old,before);
 assert.equal(a.criticalInjuries[0].nextDeathAt,10);
 assert.equal(a.criticalInjuries[0].medicalVersion,'007-G');
});
test('death rolls use STAMINA without stress dice or pushes and are seeded',()=>{
 const p=injured(61).actors[0];
 const one=deathRoll(p,{seed:19}),two=deathRoll(p,{seed:19});
 assert.deepEqual(one,two);
 assert.equal(one.accepted,true);
 assert.equal(one.roll.skill,'stamina');
 assert.equal(one.roll.initial.stress.length,0);
 assert.equal(one.roll.pushes.length,0);
 assert.equal(one.roll.modifier,-1);
});
test('three successful death rolls stop further checks without necessarily healing the wound',()=>{
 let p=injured(53).actors[0],successes=0;
 for(let i=1;i<250&&successes<3;i++){
  const attempt=deathRoll(p,{seed:i});
  if(attempt.success){p=attempt.next;successes++;}
 }
 assert.equal(successes,3);
 assert.equal(p.criticalInjuries[0].stabilized,true);
 assert.equal(p.criticalInjuries[0].healed,false);
 assert.equal(pendingLethal(p).length,0);
});
test('a failed death roll results in death rather than automatic healing',()=>{
 const p=injured(61).actors[0];
 let failed=false;
 for(let seed=1;seed<120;seed++){
  const result=deathRoll(p,{seed});
  if(!result.success){failed=true;assert.equal(result.next.dead,true);assert.equal(result.next.health,0);break;}
 }
 assert(failed);
});
test('round, stretch and shift lethal timers only trigger after their own elapsed deadlines',()=>{
 for(const [code,seconds] of [[61,10],[53,600],[44,21600]]){
  const p=injured(code).actors[0];
  const before=tickMedicalClock(p,{from:0,to:seconds-1,seed:17});
  assert.equal(before.events.filter(e=>e.kind.startsWith('death_save')).length,0,code);
  const due=tickMedicalClock(p,{from:0,to:seconds,seed:17});
  assert.equal(due.events.filter(e=>e.kind.startsWith('death_save')).length,1,code);
 }
});
test('first aid restores a broken survivor and stabilizes lethal wounds only on success',()=>{
 const s=injured(53),medic=byId(s,'pc-2'),patient=byId(s,'pc-1');
 let positive=null;
 for(let seed=1;seed<200;seed++){
  const attempt=resolveClinicalAid(medic,patient,{seed,medicalGear:true});
  if(attempt.success){positive=attempt;break;}
 }
 assert(positive);
 assert.equal(positive.patient.broken,false);
 assert(positive.patient.health>=1);
 assert(positive.patient.criticalInjuries[0].stabilized,true);
 assert.equal(positive.patient.criticalInjuries[0].healed,false);
 assert.equal(pendingLethal(positive.patient).length,0);
});
test('first aid can stabilize an ambulatory patient with untreated lethal injuries',()=>{
 const s=injured(53,{broken:false});
 const medic=byId(s,'pc-2'),patient=byId(s,'pc-1');
 assert.equal(patient.broken,false);
 let helped=false;
 for(let seed=1;seed<200;seed++){
  const r=resolveClinicalAid(medic,patient,{seed,medicalGear:true});
  if(r.success){helped=true;assert.equal(r.patient.criticalInjuries[0].stabilized,true);break;}
 }
 assert(helped);
});
test('failed treatment worsens a shift lethal deadline to stretch, then to round, then fatal',()=>{
 const s=injured(44),medic=byId(s,'pc-2');
 let patient=byId(s,'pc-1');
 let failureSeed=null;
 for(let seed=1;seed<250;seed++){
  const r=resolveClinicalAid(medic,patient,{seed,medicalGear:false});
  if(!r.success){failureSeed=seed;break;}
 }
 assert(failureSeed);
 let r=resolveClinicalAid(medic,patient,{seed:failureSeed});
 assert.equal(r.patient.criticalInjuries[0].deadline,'stretch');
 r=resolveClinicalAid(medic,r.patient,{seed:failureSeed});
 assert.equal(r.patient.criticalInjuries[0].deadline,'round');
 r=resolveClinicalAid(medic,r.patient,{seed:failureSeed});
 assert.equal(r.patient.dead,true);
});
test('rally with COMMAND can restore Health but does not stop untreated lethal bleeding',()=>{
 const s=injured(61),commander=byId(s,'pc-3'),patient=byId(s,'pc-1');
 let helped=false;
 for(let seed=1;seed<240;seed++){
  const r=resolveRally(commander,patient,{seed});
  if(r.success){
   assert.equal(r.patient.broken,false);
   assert(r.patient.health>=1);
   assert.equal(pendingLethal(r.patient).length,1);
   helped=true;break;
  }
 }
 assert(helped);
});
test('surgery cannot begin without medical supplies and succeeds only with actual MEDICAL AID',()=>{
 const s=injured(52),patient=byId(s,'pc-1'),medic=byId(s,'pc-2');
 assert.equal(resolveSurgery(medic,patient,{seed:1,medicalGear:false}).accepted,false);
 let success=false;
 for(let seed=1;seed<220;seed++){
  const op=resolveSurgery(medic,patient,{seed,medicalGear:true});
  assert(op.accepted);
  if(op.success){
   assert.equal(op.patient.criticalInjuries[0].surgeryDone,true);
   assert.equal(op.patient.criticalInjuries[0].healed,false);
   success=true;break;
  }
 }
 assert(success);
});
test('surgery-required wounds do not heal before operation; afterwards healing days advance',()=>{
 const s=injured(33),p=byId(s,'pc-1'),w=p.criticalInjuries[0];
 const without=tickMedicalClock(p,{from:0,to:20*DAY_SECONDS,seed:1});
 assert.equal(without.after.criticalInjuries[0].healed,false);
 p.criticalInjuries[0].surgeryDone=true;
 const healed=tickMedicalClock(p,{from:0,to:20*DAY_SECONDS,seed:1});
 assert.equal(healed.after.criticalInjuries[0].healed,true);
});
test('nursing doubles recovery progress but does not immediately erase injuries',()=>{
 const p=injured(32).actors[0],original=p.criticalInjuries[0].healingDays;
 const standard=tickMedicalClock(p,{from:0,to:DAY_SECONDS,seed:8,nurse:false});
 const nursed=tickMedicalClock(p,{from:0,to:DAY_SECONDS,seed:8,nurse:true});
 assert.equal(standard.after.criticalInjuries[0].healingProgress,1);
 assert.equal(nursed.after.criticalInjuries[0].healingProgress,2);
 assert.equal(p.criticalInjuries[0].healingDays,original);
});
test('safe rest restores Health and reduces stress while ongoing critical penalty remains',()=>{
 const s=injured(32,{broken:false}),p=byId(s,'pc-1');
 p.health=1;p.stress=4;p.stressResponses=['jumpy','tunnel_vision'];
 const restored=tickMedicalClock(p,{from:0,to:600,seed:6,safeRest:true});
 assert.equal(restored.after.health,2);
 assert.equal(restored.after.stress,3);
 assert(restored.after.criticalInjuries.length>0);
 assert.equal(p.health,1);
});
test('party rally and first aid require colocated living real patient and share persistent state',()=>{
 let s=injured(53);
 s.cursor=1;
 const r=partyStep(s,'aid pc-1',{actorId:'pc-2',source:'human'});
 assert.equal(r.accepted,true,r.reason);
 assert(isPartySave(r.state));
 assert.equal(r.state.actions.at(-1).kind,'aid');
 assert.equal(s.actors[0].health,0);
 const remote=base();
 remote.actors[0].location='lobby';remote.actors[0].broken=true;remote.actors[0].health=0;
 remote.cursor=1;
 assert.equal(partyStep(remote,'aid pc-1',{actorId:'pc-2',source:'human'}).accepted,false);
});
test('safe rest and surgery reject danger zones instead of skipping narrative time freely',()=>{
 const s=base();
 const rest=partyStep(s,'rest',{actorId:'pc-1',source:'human'});
 assert.equal(rest.accepted,true,rest.reason);
 assert.equal(rest.state.clock.explorationStretches,1);
 assert.equal(worldSeconds(rest.state),600);
 const threatened=base();
 threatened.dinosaurs[0].location='utility';
 assert.equal(partyStep(threatened,'rest',{actorId:'pc-1',source:'human'}).accepted,false);
 assert.equal(threatened.beat,0);
});
test('old valid party save without medical state remains accepted and gains it lazily without retcon',()=>{
 const s=base();delete s.clock;delete s.combat;
 s.actors[0].criticalInjuries=[{code:16,severity:'wound',lethal:false,deadline:null}];
 assert(isPartySave(s));
 const snapshot=structuredClone(s);
 const r=partyStep(s,'wait',{actorId:'pc-1',source:'human'});
 assert(r.accepted,true);
 assert.equal(r.state.actors[0].criticalInjuries[0].medicalVersion,undefined);
 assert.deepEqual(s,snapshot);
});

test('a wounded survivor actually rolls fewer Observation dice in the live party engine',()=>{
 const clean=base(),wounded=base();
 wounded.actors[0].criticalInjuries=[{code:16}];
 const first=partyStep(clean,'investigate consoles',{actorId:'pc-1',source:'human'});
 const second=partyStep(wounded,'investigate consoles',{actorId:'pc-1',source:'human'});
 assert(first.accepted&&second.accepted);
 assert.equal(second.result.base.length,first.result.base.length-1);
});
test('leg trauma converts a real combat move from quick to full cost',()=>{
 const s=base();
 s.actors[0].criticalInjuries=[{code:14}];
 s.dinosaurs[0].location='control';
 assert(beginCombat(s,3));
 s.combat.index=s.combat.order.findIndex(x=>x.kind==='human'&&x.actorId==='pc-1');
 s.cursor=0;
 const r=partyStep(s,'move lobby',{actorId:'pc-1',source:'human'});
 assert(r.accepted,r.reason);
 assert.equal(r.state.combat.budgets['pc-1'].fullSpent,1);
});
test('computer medics recognize lethal injuries even when the patient can still stand',()=>{
 const s=injured(53,{broken:false});
 const observation=actorObservation(s,'pc-2');
 const decision=chooseCompanionAction(observation);
 assert.equal(decision.kind,'aid');
 assert.equal(decision.target,'pc-1');
});
test('a failed treatment at later world time restarts the shortened medical deadline from treatment',()=>{
 const s=injured(44),p=byId(s,'pc-1'),medic=byId(s,'pc-2');
 let failure=null;
 for(let seed=1;seed<200;seed++){
  const r=resolveClinicalAid(medic,p,{seed,time:1200});
  if(!r.success){failure=r;break;}
 }
 assert(failure);
 assert.equal(failure.patient.criticalInjuries[0].deadline,'stretch');
 assert.equal(failure.patient.criticalInjuries[0].nextDeathAt,1800);
});

test('bleeding abdominal injury can break a survivor during a Mobility check and causes another D66 wound',()=>{
 const s=injured(45,{broken:false});
 s.actors[0].health=1;
 const initial=s.actors[0].criticalInjuries.length;
 const r=partyStep(s,'hide',{actorId:'pc-1',source:'human'});
 assert.equal(r.accepted,true,r.reason);
 assert.equal(r.state.actors[0].health,0);
 assert.equal(r.state.actors[0].broken,true);
 assert.equal(r.state.actors[0].criticalInjuries.length,initial+1);
 assert.equal(s.actors[0].criticalInjuries.length,initial);
});
