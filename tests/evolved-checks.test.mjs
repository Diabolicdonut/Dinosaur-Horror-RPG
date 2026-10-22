import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {generateCharacter,CAREERS} from '../src/characters.mjs';
import {
 createDiceStream,SKILL_ATTRIBUTE,CHECK_ENGINE_VERSION,TALENT_MECHANICS,ALL_TALENT_NAMES,
 resolveSkillCheck, resolveOpposedCheck, resolvePanic, reduceDamage, restStress, talentRule
} from '../src/evolved-checks.mjs';
const actor=(career,seed=71)=>generateCharacter({career,index:0,seed});
const run=(a,p)=>resolveSkillCheck(a,{skill:'observation',seed:1993,...p});
test('Evolved resolver module syntax and all 27 starting park talent IDs',()=>{
 const res=spawnSync(process.execPath,['--check',new URL('../src/evolved-checks.mjs',import.meta.url).pathname],{encoding:'utf8'});
 assert.equal(res.status,0,res.stderr);
 assert.equal(CHECK_ENGINE_VERSION,'007-B');
 assert.equal(ALL_TALENT_NAMES.length,27);
 assert.equal(new Set(ALL_TALENT_NAMES).size,27);
 for(const c of Object.values(CAREERS))for(const t of c.talents)assert(TALENT_MECHANICS[t],t);
 assert.equal(Object.keys(SKILL_ATTRIBUTE).length,12);
});
test('dice reproducibility: faces are individual d6 and every check is replayable',()=>{
 const first=createDiceStream(123),second=createDiceStream(123);
 for(let i=0;i<80;i++) {
  const a=first.rollD6(),b=second.rollD6();
  assert.equal(a,b);
  assert(a>=1&&a<=6);
 }
 const c=actor('scientist');
 const a=run(c,{seed:9355,stress:4}),b=run(c,{seed:9355,stress:4});
 assert.deepEqual(a,b);
 assert.equal(a.draws,a.initial.base.length+a.initial.stress.length+a.responseEvents.length);
 assert.equal(a.after.id,c.id);
 assert.equal(c.stress,0,'input character stays immutable');
 assert.equal(a.baseCount,c.attributes.wits+c.skills.observation);
});
test('skill and attribute are separate, untrained skills still receive attribute dice',()=>{
 const c=actor('scientist');
 const out=resolveSkillCheck(c,{seed:2,skill:'close_combat',attribute:'agility'});
 assert.equal(out.baseCount,c.attributes.agility+c.skills.close_combat);
 assert.equal(out.attribute,'agility');
 assert.equal(out.skill,'close_combat');
 assert.throws(()=>resolveSkillCheck(c,{skill:'made_up',seed:2}),RangeError);
});
test('modifiers and help change ONLY ordinary pool, at least one base die',()=>{
 const c=actor('ranger');
 const out=run(c,{seed:49,modifier:-15,help:0,stress:3});
 assert.equal(out.baseCount,1);
 assert.equal(out.initial.stress.length,3);
 const boost=run(c,{seed:49,modifier:2,help:3});
 assert.equal(boost.baseCount,c.attributes.wits+c.skills.observation+5);
 assert.throws(()=>run(c,{seed:49,help:4}),RangeError);
});
test('single or multiple 6s accumulate distinct total and extra success',()=>{
 const c=actor('scientist');
 for(let seed=1;seed<500;seed++){
  const r=run(c,{seed});
  const n=[...r.initial.base,...r.initial.stress].filter(v=>v===6).length;
  assert.equal(r.successes,n);
  assert.equal(r.extraSuccesses,Math.max(0,n-1));
  assert.equal(r.success,n>0);
 }
});
test('stress die 1 triggers Resolve stress response and forbids pushing that check',()=>{
 const c=actor('scientist');
 let response=null;
 for(let seed=1;seed<300;seed++){
  const r=run(c,{seed,stress:3,push:1});
  if(r.initial.stress.includes(1)){response=r;break;}
 }
 assert(response);
 assert.equal(response.responseEvents.length,1);
 assert.equal(response.pushRefused,'stress_die_one');
 assert.equal(response.pushes.length,0);
 assert.equal(response.responseEvents[0].value,response.responseEvents[0].d6+3-c.resolve);
});
test('push rolls retain sixes, reroll every non-six, and add stress dice',()=>{
 const c=actor('ranger');
 let r=null;
 for(let seed=1;seed<=1000;seed++){
  const candidate=run(c,{seed,stress:0,push:1});
  if(candidate.pushes.length===1){r=candidate;break;}
 }
 assert(r);
 const p=r.pushes[0];
 for(let i=0;i<r.initial.base.length;i++)if(r.initial.base[i]===6)
  assert.equal(p.base[i],6,'base successes stay locked');
 assert.equal(p.stress.length,1);
 assert.equal(p.stressLevel,1);
 assert.equal(r.after.stress>=1,true);
 assert.equal(r.pushRefused,null);
});
test('passive observation can benefit from stress but cannot push or trigger stress responses',()=>{
 const c=actor('ranger');
 for(let seed=1;seed<80;seed++){
  const r=run(c,{seed,stress:4,push:1,passive:true});
  assert.equal(r.pushes.length,0);
  assert.equal(r.pushRefused,'passive_check');
  assert.equal(r.responseEvents.length,0);
  assert.equal(r.initial.stress.length,4);
 }
});
test('Evolved stress penalties apply to matching attribute and do not reduce stress dice',()=>{
 const c=actor('scientist');
 const impair={...c,stressResponses:['tunnel_vision','shakes']};
 const w=run(impair,{seed:5,stress:3});
 assert.equal(w.baseCount,Math.max(1,c.attributes.wits+c.skills.observation-2));
 assert.equal(w.initial.stress.length,3);
 const a=resolveSkillCheck(impair,{skill:'mobility',seed:5});
 assert.equal(a.baseCount,Math.max(1,c.attributes.agility+c.skills.mobility-2));
});
test('deflated status blocks pushing and Jumpy increases pushed stress',()=>{
 const c=actor('scientist');
 const no=run({...c,stressResponses:['deflated']},{push:1,seed:11});
 assert.equal(no.pushRefused,'deflated');
 const edgy=run({...c,stressResponses:['jumpy']},{push:1,seed:11,stress:0});
 assert.equal(edgy.pushes.length,1);
 assert.equal(edgy.pushes[0].gain,2);
 assert.equal(edgy.pushes[0].stress.length,2);
});
test('two-push talent activates only for correct underlying attribute',()=>{
 const roles=[
  {career:'visitor',talent:'Quick Reflexes',skill:'mobility',other:'observation'},
  {career:'maintenance',talent:'Last Push',skill:'stamina',other:'mobility'},
  {career:'scientist',talent:'Persistent Inquiry',skill:'observation',other:'mobility'}
 ];
 for(const group of roles){
  const c={...actor(group.career),talent:group.talent};
  const r=resolveSkillCheck(c,{skill:group.skill,push:2,seed:42,stress:0});
  assert.equal(r.pushRequested,2);
  assert.equal(r.pushRefused,null);
  assert(r.pushes.length>=1);
  const wrong=resolveSkillCheck(c,{skill:group.other,push:2,seed:42});
  assert.equal(wrong.pushRefused,'talent_limit');
  assert.equal(wrong.pushes.length,0);
 }
});
test('Evolved combat and medical context talent bonuses are exact and conditional',()=>{
 const contexts=[
  ['ranger','Experienced Tracker','observation','active_search'],
  ['ranger','Safe Restraint','close_combat','grapple'],
  ['visitor','Hard to Catch','mobility','dodge'],
  ['medic','Emergency Treatment','medical_aid','first_aid'],
  ['medic','Trauma Specialist','medical_aid','surgery'],
  ['supervisor','Keep It Together','command','rally'],
  ['pilot','Emergency Maneuver','piloting','acceleration']
 ];
 for(const [career,talent,skill,context] of contexts) {
  const c={...actor(career),talent};
  const now=resolveSkillCheck(c,{seed:22,skill,context});
  const none=resolveSkillCheck(c,{seed:22,skill,context:'other'});
  assert.equal(now.baseCount-none.baseCount,2,career+' / '+talent);
  if(talent==='Experienced Tracker'){
   const passive=resolveSkillCheck(c,{seed:22,skill,context,passive:true});
   assert.equal(passive.baseCount,none.baseCount);
  }
 }
});
test('authority and negotiating talents select actual Evolved-legal attribute/skill combination',()=>{
 const r={...actor('ranger'),talent:'Park Authority'};
 const authority=resolveSkillCheck(r,{seed:7,skill:'manipulation',context:'authority'});
 assert.equal(authority.skill,'command');
 assert.equal(authority.attribute,'empathy');
 assert.equal(authority.baseCount,r.attributes.empathy+r.skills.command+2);
 const corp={...actor('corporate'),talent:'Negotiator'};
 const social=resolveSkillCheck(corp,{seed:7,skill:'manipulation',context:'cunning'});
 assert.equal(social.attribute,'wits');
});
test('voluntary risk and stress dice omission require the actual talent',()=>{
 const p={...actor('pilot'),talent:'Risk Taker'};
 const risky=resolveSkillCheck(p,{skill:'piloting',seed:57,voluntaryStress:true});
 assert.equal(risky.initial.stress.length,1);
 assert(risky.after.stress>=1);
 assert.throws(()=>run(actor('ranger'),{voluntaryStress:true}),RangeError);
 const worker={...actor('maintenance'),talent:'Steady Hands'};
 const quiet=resolveSkillCheck(worker,{skill:'stamina',seed:57,stress:5,omitStressDice:2});
 assert.equal(quiet.initial.stress.length,3);
 assert.equal(quiet.initial.stressLevel,5);
 assert.throws(()=>run(actor('ranger'),{omitStressDice:1}),RangeError);
});
test('Familiar Controls requires an actual preselected and matching vehicle model',()=>{
 const c={...actor('pilot'),talent:'Familiar Controls',talentFocus:{vehicleModel:'Park Jeep'}};
 const yes=resolveSkillCheck(c,{skill:'piloting',seed:12,vehicleModel:'Park Jeep'});
 const no=resolveSkillCheck(c,{skill:'piloting',seed:12,vehicleModel:'Helicopter'});
 assert.equal(yes.baseCount-no.baseCount,2);
 assert.equal(no.notes.length,0);
});
test('independent panic check is Resolve-governed and not a skill failure or stress response',()=>{
 const c=actor('scientist');
 const panic=resolvePanic(c,{seed:18});
 const after=resolvePanic(c,{seed:18});
 assert.deepEqual(panic,after);
 assert.equal(panic.value,panic.d6-c.resolve);
 const high=resolvePanic({...c,stress:18},{seed:18});
 assert.equal(high.kind,'catatonic');
 const tactical={...actor('tactical'),stress:14,talent:'Combat Focus'};
 assert.equal(resolvePanic(tactical,{seed:19,combatFocus:true}).kind,'combat_focus');
});
test('damage reduction talent uses its own seeded Strength roll, while other actors do not',()=>{
 const c={...actor('maintenance'),talent:'Resilient Worker'};
 const r=reduceDamage(c,{seed:27,damage:3});
 assert.equal(r.damage+r.prevented,3);
 assert.equal(r.roll.attribute,'strength');
 assert.equal(r.roll.skill,null);
 assert.equal(r.roll.pushes.length,0);
 assert.equal(reduceDamage(actor('ranger'),{damage:3}).damage,3);
});
test('safe stretch recovers correct stress and limited lingering stress effects',()=>{
 const c={...actor('tactical'),stress:4,stressResponses:['jumpy','shakes']};
 const first=restStress({...c,talent:'Steady Under Fire'});
 assert.equal(first.after.stress,2);
 assert.equal(first.after.stressResponses.length,0);
 const normal=restStress({...c,talent:'Careful Aim'});
 assert.equal(normal.after.stress,3);
 assert.equal(normal.after.stressResponses.length,1);
 assert.throws(()=>restStress(c,{safe:false}),RangeError);
});
test('talent effect metadata exposes action time, recovery and supply specialty',()=>{
 const boss={...actor('supervisor'),talent:'Rapid Orders'};
 assert.equal(talentRule(boss,{context:'combat_order'}).actionCost,'quick');
 assert.equal(talentRule(boss,{context:'other'}).actionCost,null);
 const medic={...actor('medic'),talent:'Recovery Care'};
 assert.equal(talentRule(medic,{context:'critical_injury_recovery'}).nursingDayMultiplier,2);
 const marksman={...actor('tactical'),talent:'Careful Aim'};
 assert.equal(talentRule(marksman,{context:'ammo_supply'}).ammoDiceReduction,2);
});
test('invalid rolls reject bad modifiers, forged stats, unknown attributes and invalid seeds',()=>{
 const c=actor('ranger');
 assert.throws(()=>run(c,{modifier:100}),RangeError);
 assert.throws(()=>run(c,{seed:-1}),RangeError);
 assert.throws(()=>run(c,{attribute:'invented'}),RangeError);
 assert.throws(()=>run({...c,resolve:100}),RangeError);
});

test('opposed checks resolve both actor sheets with separate reproducible seeded rolls',()=>{
 const a=actor('ranger'),b=actor('visitor');
 const first=resolveOpposedCheck(a,b,{seed:1987,activeSkill:'observation',opponentSkill:'mobility'});
 const second=resolveOpposedCheck(a,b,{seed:1987,activeSkill:'observation',opponentSkill:'mobility'});
 assert.deepEqual(first,second);
 assert.equal(first.active.actorId,a.id);
 assert.equal(first.opponent.skill,'mobility');
 assert.equal(first.activeSucceeds,first.active.success&&first.active.successes>first.opponent.successes);
 assert.equal(first.margin,first.active.successes-first.opponent.successes);
 assert(['active','opponent','tie'].includes(first.winner));
});
test('opposed ties never count as success for the active party',()=>{
 const a=actor('ranger'),b=actor('visitor');
 let found=false;
 for(let seed=1;seed<300;seed++){
  const r=resolveOpposedCheck(a,b,{seed,activeSkill:'observation',opponentSkill:'mobility'});
  if(r.winner==='tie'){
   assert.equal(r.activeSucceeds,false);
   found=true;break;
  }
 }
 assert(found);
});
