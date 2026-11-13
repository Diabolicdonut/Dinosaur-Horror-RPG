import test from 'node:test';
import assert from 'node:assert/strict';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,partyStep,isPartySave} from '../src/party-engine.mjs';
import {setControlMode} from '../src/party-director.mjs';
import {resolveSkillCheck} from '../src/evolved-checks.mjs';
import {resolveStoryPointAward,replayStoryPointAwards}
 from '../src/story-point-earning.mjs';
import {resolveStoryPointSpend,replayStoryPointSpends}
 from '../src/story-point-spending.mjs';

const source=seed=>compileSelectedAdventure('ridge-survey',seed);
const storyRequest=actorId=>({actorId,agendaId:'observe-first',
 cardId:'the-living-valley',risk:{kind:'peril',id:'herd-close-pass'}});
function step(state,command){
 const result=partyStep(state,command);
 assert.equal(result.accepted,true,command+': '+result.reason);
 assert.equal(isPartySave(result.state),true);
 return result.state;
}
function createFixture({openingPoints=0}={}){
 const roster=makeParty({seed:91,size:1,careers:['scientist']});
 roster[0].storyPoints=openingPoints;
 let state,seed;
 for(let candidate=0;candidate<256;candidate++){
  const c=source(candidate);
  if(c.hiddenFacts.predatorPresence.id!=='quiet-range'||
     c.hiddenFacts.wildlifeBehavior.id!=='nervous')continue;
  let sample=newPartyIncident({seed:candidate,roster,adventureId:'ridge-survey'});
  sample=step(step(sample,'move rocky-ascent'),'move survey-ridge');
  const attempt=partyStep(sample,'danger herd-close-pass');
  if(!attempt.accepted||attempt.state.actors[0].dead||
     attempt.state.actors[0].broken)continue;
  state=attempt.state;seed=candidate;break;
 }
 assert.ok(state,'Need a deterministic, voluntary peril without a forced predator.');
 state=step(state,'scene living-valley');
 state=step(state,'move forest-blind');
 for(let i=0;i<50&&!state.flags.dataRecovered;i++)
  state=step(state,'use survey records');
 assert.equal(state.flags.dataRecovered,true);
 assert.equal(isPartySave(state),true);
 const compiled=source(seed);
 const actorId=state.actors[0].id;
 const award=resolveStoryPointAward(compiled,state,storyRequest(actorId));
 assert.equal(award.accepted,true,award.reason);
 assert.equal(replayStoryPointAwards(compiled,state,award.journal).valid,true);
 return {compiled,state,actorId,awardJournal:award.journal,award};
}
let savedFixture;
function fixture(){
 savedFixture??=createFixture();
 return structuredClone(savedFixture);
}
const sourceRef=compiled=>({adventureId:compiled.adventureId,
 revision:compiled.revision,fingerprint:compiled.fingerprint,seed:compiled.seed});
const availableSeed=(actor,push=0)=>{
 for(let seed=1;seed<1000;seed++){
  const roll=resolveSkillCheck(actor,{skill:'observation',seed,push});
  const latest=roll.pushes.at(-1)?.base??roll.initial.base;
  if(roll.initial.base[0]!==6&&latest.some(face=>face!==6)&&
     (push===0||roll.pushes.length===push))return seed;
 }
 throw new Error('No eligible Evolved check seed.');
};
function receipt(f,{id='open-check',ownerId='human-seat-1',push=0,seed=null,
 status='open',beat=f.state.beat}={}){
 const actor=structuredClone(f.state.actors[0]);
 const options={skill:'observation',seed:seed??availableSeed(actor,push),push};
 return {id,actorId:f.actorId,ownerId,source:sourceRef(f.compiled),
  beat,status,character:actor,options,roll:resolveSkillCheck(actor,options),
  appliedSpend:null};
}
function checkRegistry(f,checks=[receipt(f)]){
 return {schemaVersion:1,source:sourceRef(f.compiled),entries:checks};
}
function request(c,timing='after',dieIndex=null){
 const base=c.roll.pushes.at(-1)?.base??c.roll.initial.base;
 return {checkId:c.id,actorId:c.actorId,ownerId:c.ownerId,timing,
  dieIndex:dieIndex??base.findIndex(face=>face!==6)};
}
const spend=(f,checks,req,journal=null)=>resolveStoryPointSpend(f.compiled,
 f.state,f.awardJournal,checks,req,journal);
const replay=(f,checks,journal)=>replayStoryPointSpends(f.compiled,
 f.state,f.awardJournal,checks,journal);

test('DHR-026: only a source-earned, risk-replayed point can turn a real base die to six',()=>{
 const f=fixture(),checks=checkRegistry(f),c=checks.entries[0];
 const world=structuredClone(f.state),sourceSnapshot=structuredClone(f.compiled);
 const selected=request(c);
 assert.ok(selected.dieIndex>=0);
 const result=spend(f,checks,selected);
 assert.equal(result.accepted,true,result.reason);
 assert.equal(result.entry.actorId,f.actorId);
 assert.equal(result.entry.ownerId,'human-seat-1');
 assert.equal(result.entry.awardIndex,0);
 assert.equal(result.balanceAfter,0);
 assert.equal(result.preview.base[selected.dieIndex],6);
 assert.equal(result.preview.dieAfter,6);
 assert.equal(result.preview.successes,c.roll.successes+1);
 assert.equal(result.preview.extraSuccesses,Math.max(0,result.preview.successes-1));
 assert.deepEqual(replay(f,checks,result.journal),
  {valid:true,balances:{[f.actorId]:0},spentCount:1});
 assert.deepEqual(f.state,world,'Never writes to an existing Party save.');
 assert.deepEqual(f.compiled,sourceSnapshot,'Never changes seeded adventure.');
 assert.equal(Object.hasOwn(f.state,'storyPointSpendingJournal'),false);
});

test('DHR-026: before-push spending delegates to existing seeded Evolved engine, including reroll draws',()=>{
 const f=fixture(),c=receipt(f,{push:1}),checks=checkRegistry(f,[c]);
 const out=spend(f,checks,request(c,'before',0));
 assert.equal(out.accepted,true,out.reason);
 const expected=resolveSkillCheck({...c.character,storyPoints:1},
  {...c.options,spendStoryPoint:true,storyPointTiming:'before'});
 const final=expected.pushes.at(-1)??expected.initial;
 assert.deepEqual(out.preview.base,final.base);
 assert.deepEqual(out.preview.stress,final.stress);
 assert.equal(out.preview.draws,expected.draws);
 assert.equal(out.preview.pushesApplied,expected.pushes.length);
 assert.equal(out.preview.successes,expected.successes);
 assert.equal(out.preview.success,expected.success);
 assert.equal(replay(f,checks,out.journal).valid,true);
});

test('DHR-026: before-push cannot silently modify unsupported base index or a six',()=>{
 const f=fixture(),c=receipt(f,{push:1}),checks=checkRegistry(f,[c]);
 assert.equal(spend(f,checks,request(c,'before',1)).accepted,false);
 const alreadySix=structuredClone(c);
 let found=false;
 for(let seed=1;seed<200;seed++){
  const options={...alreadySix.options,seed};
  const roll=resolveSkillCheck(alreadySix.character,options);
  if(roll.initial.base[0]===6){
   alreadySix.options=options;alreadySix.roll=roll;found=true;break;
  }
 }
 assert.equal(found,true);
 assert.equal(spend(f,checkRegistry(f,[alreadySix]),
  request(alreadySix,'before',0)).accepted,false);
});

test('DHR-026: current actor, human owner and named check must match trusted register',()=>{
 const f=fixture(),checks=checkRegistry(f),c=checks.entries[0];
 for(const bad of [
  {...request(c),actorId:'pc-999'},
  {...request(c),ownerId:'other-human'},
  {...request(c),checkId:'fictional'},
  {...request(c),extra:true},null,{},[],
  {...request(c),timing:'after_commit'},
  {...request(c),dieIndex:-1},
  {...request(c),dieIndex:999}
 ])assert.equal(spend(f,checks,bad).accepted,false,JSON.stringify(bad));
});

test('DHR-026: unearned opening character balances, cap-zero awards and campaign claims never mint spendable points',()=>{
 const f=fixture(),checks=checkRegistry(f),c=checks.entries[0];
 assert.equal(spend({...f,awardJournal:null},checks,request(c)).accepted,false);
 const zero=createFixture({openingPoints:3});
 assert.equal(zero.award.credited,0);
 const zeroChecks=checkRegistry(zero);
 assert.equal(spend(zero,zeroChecks,request(zeroChecks.entries[0])).accepted,false);
 const campaign=structuredClone(f.awardJournal);
 campaign.entries[0].credited=3;
 assert.equal(replayStoryPointAwards(f.compiled,f.state,campaign).valid,false);
 assert.equal(spend({...f,awardJournal:campaign},checks,request(c)).accepted,false);
});

test('DHR-026: two check attempts cannot reuse one credited point or the same check receipt',()=>{
 const f=fixture(),c1=receipt(f,{id:'one'}),c2=receipt(f,{id:'two',seed:31});
 const checks=checkRegistry(f,[c1,c2]);
 const first=spend(f,checks,request(c1));
 assert.equal(first.accepted,true,first.reason);
 assert.equal(spend(f,checks,request(c1),first.journal).accepted,false);
 assert.equal(spend(f,checks,request(c2),first.journal).accepted,false);
 assert.equal(replay(f,checks,first.journal).valid,true);
 assert.equal(first.journal.entries.length,1);
});

test('DHR-026: replay rejects edited, appended, duplicated and reassigned spending receipts',()=>{
 const f=fixture(),checks=checkRegistry(f),c=checks.entries[0];
 const spent=spend(f,checks,request(c));
 assert.equal(spent.accepted,true,spent.reason);
 const tamper=edit=>{
  const bad=structuredClone(spent.journal);edit(bad);
  assert.equal(replay(f,checks,bad).valid,false);
  assert.equal(spend(f,checks,request(c),bad).accepted,false);
 };
 tamper(j=>{j.entries[0].actorId='pc-999';});
 tamper(j=>{j.entries[0].ownerId='fake-human';});
 tamper(j=>{j.entries[0].checkId='unknown-check';});
 tamper(j=>{j.entries[0].beat-=1;});
 tamper(j=>{j.entries[0].awardIndex+=1;});
 tamper(j=>{j.entries[0].balanceAfter+=1;});
 tamper(j=>{j.entries[0].preview.successes+=1;});
 tamper(j=>{j.entries[0].preview.base[0]=2;});
 tamper(j=>{j.entries[0].timing='before';});
 tamper(j=>{j.entries.push(structuredClone(j.entries[0]));});
 tamper(j=>{j.entries[0].forged=true;});
 tamper(j=>{j.source.fingerprint='forged';});
 tamper(j=>{j.schemaVersion=99;});
});

test('DHR-026: forged source, seed, actor snapshot, rolls and extra check options fail closed',()=>{
 const f=fixture(),c=receipt(f),checks=checkRegistry(f,[c]);
 const tamper=edit=>{
  const bad=structuredClone(checks);edit(bad);
  assert.equal(replay(f,bad).valid,false);
  assert.equal(spend(f,bad,request(c)).accepted,false);
 };
 tamper(j=>{j.source.seed+=1;});
 tamper(j=>{j.entries[0].source.fingerprint='fake';});
 tamper(j=>{j.entries[0].options.seed+=1;});
 tamper(j=>{j.entries[0].options.spendStoryPoint=true;});
 tamper(j=>{j.entries[0].options.passive=true;});
 tamper(j=>{j.entries[0].options.stress=30;});
 tamper(j=>{j.entries[0].roll.successes+=1;});
 tamper(j=>{j.entries[0].character.skills.observation+=1;});
 tamper(j=>{j.entries[0].character.id='pc-999';});
 tamper(j=>{j.entries[0].source.seed+=1;});
 tamper(j=>{j.entries.push(structuredClone(j.entries[0]));});
 tamper(j=>{j.entries[0].beat=f.state.beat+1;});
});

test('DHR-026: committed checks cannot be spent retroactively, but authorized committed receipts replay',()=>{
 const f=fixture(),c=receipt(f),checks=checkRegistry(f,[c]);
 const prior=spend(f,checks,request(c));
 assert.equal(prior.accepted,true,prior.reason);
 const closed=structuredClone(checks);
 closed.entries[0].status='committed';
 closed.entries[0].appliedSpend=structuredClone(prior.entry);
 assert.equal(replay(f,closed,prior.journal).valid,true);
 assert.equal(spend(f,closed,request(c),prior.journal).accepted,false);
 const erased=structuredClone(closed);
 erased.entries[0].appliedSpend=null;
 assert.equal(replay(f,erased,prior.journal).valid,false);
 assert.equal(replay(f,closed).valid,false,'A committed expenditure cannot disappear.');
 assert.equal(spend(f,closed,request(c)).accepted,false);
});

test('DHR-026: a check from before the agenda award cannot consume future credits',()=>{
 const f=fixture(),early=receipt(f,{beat:0,status:'committed'});
 const checks=checkRegistry(f,[early]);
 // An attacker cannot backdate a spending journal to a prior act even when
 // its award receipt exists in the current completed-world snapshot.
 const normal=spend(f,checkRegistry(f),request(receipt(f)));
 assert.equal(normal.accepted,true);
 const forged=structuredClone(normal.journal);
 forged.entries[0].beat=0;
 assert.equal(replay(f,checks,forged).valid,false);
 assert.equal(spend(f,checks,request(early)).accepted,false);
});

test('DHR-026: only current player-controlled seat can request a new spend; historical replay ignores later mode changes',()=>{
 const f=fixture(),checks=checkRegistry(f),c=checks.entries[0];
 const prior=spend(f,checks,request(c));
 for(const mode of ['party','focus','spectator']){
  const change=setControlMode(f.state,mode==='focus'?
   {mode,focusedActorId:f.actorId}:{mode});
  assert.equal(change.accepted,true,change.reason);
  const changed={...f,state:change.state};
  assert.equal(replay(changed,checks,prior.journal).valid,true,mode);
  const granted=spend(changed,checks,request(c));
  assert.equal(granted.accepted,mode!=='spectator',mode);
 }
});

test('DHR-026: stress-response defeats still defeat the modified check',()=>{
 const f=fixture(),actor=structuredClone(f.state.actors[0]);
 // Find a real seeded check where the Evolved stress response is mess_up.
 actor.stress=20;
 let chosen=null;
 for(let seed=1;seed<2000;seed++){
  const options={skill:'observation',seed,push:0};
  const roll=resolveSkillCheck(actor,options);
  if(roll.responseEvents.some(e=>e.kind==='mess_up')&&
     roll.initial.base.some(face=>face!==6)){chosen={options,roll};break;}
 }
 assert.ok(chosen,'Expected a real stress response at a high stress level.');
 // A historical trusted GM check can carry its actual earlier actor snapshot;
 // it is not a new request against a forged current character state.
 const c={...receipt(f),id:'stress-check',status:'committed',
  character:actor,options:chosen.options,roll:chosen.roll};
 const checks=checkRegistry(f,[c]);
 const unauthorized=spend(f,checks,request(c));
 assert.equal(unauthorized.accepted,false,'A resolved check is never reopened.');
 // Replaying a fabricated receipt fails because the committed check has no spend attestation.
 const forged={schemaVersion:1,source:sourceRef(f.compiled),entries:[
  {checkId:c.id,actorId:c.actorId,ownerId:c.ownerId,beat:c.beat,
   timing:'after',dieIndex:c.roll.initial.base.findIndex(face=>face!==6),
   awardIndex:0,balanceAfter:0,preview:{success:true}}
 ]};
 assert.equal(replay(f,checks,forged).valid,false);
});

test('DHR-026: past Nublar saves and source bindings are not rewritten or upgraded',()=>{
 const roster=makeParty({seed:77,size:1,careers:['scientist']});
 const legacy=newPartyIncident({seed:77,roster});
 const old=structuredClone(legacy),f=fixture();
 assert.equal(isPartySave(legacy),true);
 assert.equal(replayStoryPointSpends(f.compiled,legacy,f.awardJournal,
  checkRegistry(f)).valid,false);
 assert.equal(resolveStoryPointSpend(f.compiled,legacy,f.awardJournal,
  checkRegistry(f),request(receipt(f))).accepted,false);
 assert.deepEqual(legacy,old);
 assert.equal(Object.hasOwn(legacy,'storyPointsSpent'),false);
});

import {spawnSync} from 'node:child_process';
test('DHR-026: dedicated resolver and regression file pass Node syntax validation',()=>{
 for(const file of ['../src/story-point-spending.mjs','./story-point-spending-dhr026.test.mjs']){
  const result=spawnSync(process.execPath,['--check',new URL(file,import.meta.url).pathname],{encoding:'utf8'});
  assert.equal(result.status,0,file+': '+result.stderr);
 }
});
