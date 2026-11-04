import test from 'node:test';
import assert from 'node:assert/strict';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,partyStep,isPartySave} from '../src/party-engine.mjs';
import {setControlMode} from '../src/party-director.mjs';
import {resolveStoryPointAward,replayStoryPointAwards}
 from '../src/story-point-earning.mjs';

const source=seed=>compileSelectedAdventure('ridge-survey',seed);
const risk={kind:'peril',id:'herd-close-pass'};
const request=(actorId)=>({actorId,agendaId:'observe-first',
 cardId:'the-living-valley',risk});
const step=(state,command)=>{
 const result=partyStep(state,command);
 assert.equal(result.accepted,true,command+': '+result.reason);
 assert.equal(isPartySave(result.state),true);
 return result.state;
};
function build({exposureFirst=true,exposure=true,closeAct=true,openingPoints=0,reverseWait=true}={}){
 // The quiet seed never spawns a compelled predator contact. The nervous
 // wildlife variant offers a real, voluntary risk at the ridge.
 const roster=makeParty({seed:91,size:1,careers:['scientist']});
 roster[0].storyPoints=openingPoints;
 let state,seed;
 for(let candidate=0;candidate<256;candidate++){
  const c=source(candidate);
  if(c.hiddenFacts.predatorPresence.id!=='quiet-range'||
     c.hiddenFacts.wildlifeBehavior.id!=='nervous')continue;
  let sample=newPartyIncident({seed:candidate,roster,adventureId:'ridge-survey'});
  sample=step(step(sample,'move rocky-ascent'),'move survey-ridge');
  if(exposure){
   const trial=partyStep(sample,'danger herd-close-pass');
   if(!trial.accepted||trial.state.actors[0].broken||trial.state.actors[0].dead)continue;
  }
  state=sample;seed=candidate;break;
 }
 assert.ok(state,'Expected quiet and physically risk-eligible seed.');
 const completedScene=()=>{state=step(state,'scene living-valley');};
 const completedRisk=()=>{if(exposure)state=step(state,'danger herd-close-pass');};
 if(exposureFirst){completedRisk();completedScene();}
 else {completedScene();if(reverseWait)state=step(state,'wait');completedRisk();}
 const beforeClose=structuredClone(state);
 if(closeAct){
  state=step(state,'move forest-blind');
  for(let attempts=0;attempts<50&&!state.flags.dataRecovered;attempts++)
   state=step(state,'use survey records');
  assert.equal(state.flags.dataRecovered,true,'A real engine-committed objective closes Act I.');
 }
 assert.equal(isPartySave(state),true);
 return {state,compiled:source(seed),actorId:state.actors[0].id,beforeClose,seed};
}
const award=f=>resolveStoryPointAward(f.compiled,f.state,request(f.actorId));

test('DHR-025: real local exposure plus an authored seat/act Story Card earns one point after the act',()=>{
 const fixture=build(),original=structuredClone(fixture.state),compiled=structuredClone(fixture.compiled);
 const result=award(fixture);
 assert.equal(result.accepted,true,result.reason);
 assert.equal(result.credited,1);
 assert.equal(result.balanceAfter,1);
 assert.equal(result.entry.act,1);
 assert.deepEqual(result.entry.evidence,{kind:'scene',id:'living-valley',
  beat:fixture.state.cinematicRecords[0].beat,room:'survey-ridge'});
 assert.deepEqual(result.entry.risk,{kind:'peril',id:'herd-close-pass',
  beat:fixture.state.perilRecords[0].beat,room:'survey-ridge'});
 assert.equal(result.journal.schemaVersion,1);
 assert.equal(result.journal.source.fingerprint,fixture.compiled.fingerprint);
 assert.equal(replayStoryPointAwards(fixture.compiled,fixture.state,result.journal).valid,true);
 assert.deepEqual(fixture.state,original,'No committed actor/save state changes.');
 assert.deepEqual(fixture.compiled,compiled,'No source or random stream changes.');
});

test('DHR-025: award is impossible before an act actually closes',()=>{
 const f=build({closeAct:false});
 const prior=structuredClone(f.beforeClose);
 const denied=resolveStoryPointAward(f.compiled,f.beforeClose,request(f.actorId));
 assert.equal(denied.accepted,false);
 assert.equal(replayStoryPointAwards(f.compiled,f.beforeClose).valid,true);
 assert.deepEqual(f.beforeClose,prior);
});

test('DHR-025: a witnessed Story Card alone does not prove personal risk or sacrifice',()=>{
 const f=build({exposure:false});
 assert.equal(f.state.cinematicRecords.length,1);
 assert.equal(f.state.perilRecords.length,0);
 assert.equal(award(f).accepted,false);
});

test('DHR-025: after-the-fact risk cannot retroactively justify an earlier agenda event',()=>{
 const f=build({exposureFirst:false});
 assert.ok(f.state.perilRecords[0].beat>f.state.cinematicRecords[0].beat);
 assert.equal(award(f).accepted,false);
 const sameBeat=build({exposureFirst:false,reverseWait:false});
 assert.equal(sameBeat.state.perilRecords[0].beat,sameBeat.state.cinematicRecords[0].beat);
 assert.equal(award(sameBeat).accepted,false,'Free scenes cannot be backdated by later same-beat hazards.');
});

test('DHR-025: duplicates, tampering and invented replay receipts fail closed',()=>{
 const f=build(),first=award(f);
 assert.equal(first.accepted,true);
 assert.equal(resolveStoryPointAward(f.compiled,f.state,request(f.actorId),first.journal).accepted,false);
 const tamper=change=>{
  const altered=structuredClone(first.journal);change(altered);
  assert.equal(replayStoryPointAwards(f.compiled,f.state,altered).valid,false);
  assert.equal(resolveStoryPointAward(f.compiled,f.state,request(f.actorId),altered).accepted,false);
 };
 tamper(j=>{j.entries[0].evidence.beat+=1;});
 tamper(j=>{j.entries[0].risk.room='forest-blind';});
 tamper(j=>{j.entries[0].risk.id='imaginary-peril';});
 tamper(j=>{j.entries[0].credited=0;});
 tamper(j=>{j.entries[0].balanceAfter=3;});
 tamper(j=>{j.entries[0].act=2;});
 tamper(j=>{j.entries[0].cardId='unsettling-footprints';});
 tamper(j=>{j.entries.push(structuredClone(j.entries[0]));});
 tamper(j=>{j.source.seed+=1;});
 tamper(j=>{j.source.fingerprint='deadbeef';});
 tamper(j=>{j.entries[0].forceEarned=true;});
});

test('DHR-025: remote actors, fabricated agenda bindings and arbitrary command fields earn nothing',()=>{
 const f=build();
 for(const bad of [
  {...request(f.actorId),actorId:'offscreen-actor'},
  {...request(f.actorId),agendaId:'bring-home-truth'},
  {...request(f.actorId),agendaId:'team-safety'},
  {...request(f.actorId),cardId:'expedition-report'},
  {...request(f.actorId),cardId:'fresh-track-note'},
  {...request(f.actorId),risk:{kind:'peril',id:'false-threat'}},
  {...request(f.actorId),risk:{kind:'predator_contact',id:'hunter-1'}},
  {...request(f.actorId),risk:{kind:'peril',id:'herd-close-pass',force:true}},
  {...request(f.actorId),mode:'campaign'},
  null,{},[]
 ])assert.equal(resolveStoryPointAward(f.compiled,f.state,bad).accepted,false,
  JSON.stringify(bad));
});

test('DHR-025: source cap of three is obeyed, even for a qualifying completed agenda',()=>{
 const f=build({openingPoints:3});
 assert.equal(f.state.actors[0].storyPoints,3);
 const result=award(f);
 assert.equal(result.accepted,true,result.reason);
 assert.equal(result.credited,0);
 assert.equal(result.balanceAfter,3);
 assert.deepEqual(replayStoryPointAwards(f.compiled,f.state,result.journal).balances,
  {[f.actorId]:3});
});

test('DHR-025: deterministic replay, same seed, and seed-different source reject stale journals',()=>{
 const first=build(),granted=award(first);
 assert.equal(granted.accepted,true);
 const replay=resolveStoryPointAward(first.compiled,first.state,
  request(first.actorId),granted.journal);
 assert.equal(replay.accepted,false,'One award per player per act.');
 const second=build();
 assert.deepEqual(award(first).journal,award(second).journal);
 const other=source(first.seed+1);
 assert.equal(replayStoryPointAwards(other,first.state,granted.journal).valid,false);
 assert.equal(replayStoryPointAwards(first.compiled,first.state,{...granted.journal,
  source:{...granted.journal.source,adventureId:'forged-place'}}).valid,false);
});

test('DHR-025: raw save forgery and remote source cannot be used to mint a reward',()=>{
 const f=build();
 for(const change of [
  s=>{s.perilRecords[0].room='forest-blind';},
  s=>{s.cinematicRecords[0].actorId='someone-else';},
  s=>{s.cinematicRecords[0].room='forest-blind';},
  s=>{s.adventureBinding.fingerprint='bad00000';},
  s=>{s.actions=s.actions.filter(a=>a.kind!=='scene');}
 ]){
  const bad=structuredClone(f.state);change(bad);
  assert.equal(isPartySave(bad),false,'Forged saves must first fail engine checks.');
  assert.equal(resolveStoryPointAward(f.compiled,bad,request(f.actorId)).accepted,false);
 }
});

test('DHR-025: Party, Focus and Spectator control cannot alter GM-only earning proof',()=>{
 const f=build(),baseline=award(f);
 assert.equal(baseline.accepted,true);
 for(const mode of ['party','focus','spectator']){
  const changed=setControlMode(f.state,mode==='focus'?
   {mode,focusedActorId:f.actorId}:{mode});
  assert.equal(changed.accepted,true,changed.reason);
  assert.equal(isPartySave(changed.state),true);
  assert.deepEqual(award({...f,state:changed.state}).journal,baseline.journal);
 }
});

test('DHR-025: legacy Nublar, campaign-like claims and historical world fields are untouched',()=>{
 const roster=makeParty({seed:77,size:1,careers:['scientist']});
 const old=newPartyIncident({seed:77,roster});
 const snapshot=structuredClone(old);
 assert.equal(isPartySave(old),true);
 const current=source(77);
 assert.equal(resolveStoryPointAward(current,old,request(old.actors[0].id)).accepted,false);
 assert.equal(replayStoryPointAwards(current,old).valid,false);
 assert.deepEqual(old,snapshot);
 assert.equal(Object.hasOwn(old,'storyPointAwardJournal'),false);
 const f=build();
 const unchanged=structuredClone(f.state);
 const result=award(f);
 assert.equal(result.accepted,true);
 assert.equal(f.state.actors[0].storyPoints,unchanged.actors[0].storyPoints);
 assert.equal(Object.hasOwn(f.state,'storyPointAwardJournal'),false);
 assert.deepEqual(f.state,unchanged);
});
