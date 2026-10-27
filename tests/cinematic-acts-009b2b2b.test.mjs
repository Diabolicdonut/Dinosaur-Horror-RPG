import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {compileAdventure,adventureBinding,validateAdventureDefinition} from '../src/adventure-definition.mjs';
import {RIDGE_SURVEY_REV1} from '../adventures/ridge-survey-rev1.mjs';
import {RIDGE_SURVEY_REV2} from '../adventures/ridge-survey-rev2.mjs';
import {cinematicAct,availableCinematicEvents,commitCinematicEvent,validCinematicRecords}
 from '../src/adventure-cinematic.mjs';
import {newPartyIncident,isPartySave,partyView,partyStep} from '../src/party-engine.mjs';

const roster=makeParty({seed:49,size:1,careers:['scientist']});
const fresh=(seed=5,team=roster)=>newPartyIncident({adventureId:'ridge-survey',seed,roster:team});
const move=(state,to)=>{
 const r=partyStep(state,'move '+to);
 assert.equal(r.accepted,true,r.reason);
 return r.state;
};
test('009-B2b2b: three acts exist as validated data, no Nublar dependency',()=>{
 const instance=compileSelectedAdventure('ridge-survey',5);
 assert.equal(instance.revision,13);
 assert.deepEqual(instance.definition.cinematic.acts.map(a=>a.number),[1,2,3]);
 assert.equal(cinematicAct(instance,fresh()).number,1);
 assert.equal(cinematicAct(compileAdventure(RIDGE_SURVEY_REV1,{seed:5}),fresh()),null);
 assert.equal(cinematicAct(compileAdventure(RIDGE_SURVEY_REV2,{seed:5}),fresh()),null);
 assert.equal(newPartyIncident({seed:5,roster}).scenario,'nublar-incident-1993');
});
test('009-B2b2b: authored Cinematic package rejects fake rooms, creatures, turns and plot bypasses',()=>{
 const base=compileSelectedAdventure('ridge-survey',3).definition;
 for(const change of [
  d=>d.cinematic.acts[0].unlocksAfter=['recover-transect'],
  d=>d.cinematic.acts[1].unlocksAfter=['invented'],
  d=>d.cinematic.acts[2].unlocksAfter=[],
  d=>d.cinematic.events[0].room='teleport-zone',
  d=>d.cinematic.events[0].creatureId='invisible-raptor',
  d=>d.cinematic.events[1].act=9,
  d=>d.cinematic.events[0].script=()=>{},
  d=>d.cinematic.events[2].variant.choice='forged-flood',
  d=>d.cinematic.events[3].requiresCompanion='yes'
 ]){
  const def=structuredClone(base);change(def);
  assert.throws(()=>validateAdventureDefinition(def),RangeError);
 }
});
test('009-B2b2b: physically absent creature prevents wonder scene without inventing an animal',()=>{
 let state=fresh();
 const instance=compileSelectedAdventure('ridge-survey',state.initialSeed);
 state=move(state,'rocky-ascent');
 state=move(state,'survey-ridge');
 assert.ok(availableCinematicEvents(instance,state,state.actors[0].id).some(x=>x.id==='living-valley'));
 state.dinosaurs[0].location='forest-blind';
 assert.equal(availableCinematicEvents(instance,state,state.actors[0].id).some(x=>x.id==='living-valley'),false);
 const denied=commitCinematicEvent(instance,state,{actorId:state.actors[0].id,eventId:'living-valley'});
 assert.equal(denied.accepted,false);
 assert.strictEqual(denied.state,state);
});
test('009-B2b2b: voluntary wonder scene costs no time, RNG, stress, resources or wildlife position',()=>{
 let s=fresh();
 s=move(move(s,'rocky-ascent'),'survey-ridge');
 const before=structuredClone(s);
 const r=partyStep(s,'scene living-valley');
 assert.equal(r.accepted,true,r.reason);
 assert.notStrictEqual(r.state,s);
 assert.equal(r.state.beat,before.beat);
 assert.equal(r.state.rng,before.rng);
 assert.equal(r.state.cursor,before.cursor);
 assert.equal(r.state.clock.explorationActions,before.clock.explorationActions);
 assert.deepEqual(r.state.actors,before.actors);
 assert.deepEqual(r.state.dinosaurs,before.dinosaurs);
 assert.deepEqual(r.state.rooms,before.rooms);
 assert.equal(r.state.cinematicRecords[0].room,'survey-ridge');
 assert.equal(r.state.cinematicRecords[0].act,1);
 assert.equal(isPartySave(r.state),true);
 assert.equal(partyStep(r.state,'scene living-valley').accepted,false);
 assert.deepEqual(s,before);
});
test('009-B2b2b: characters may ignore all scenes and continue actual task objectives',()=>{
 let s=fresh();
 s=move(s,'river-crossing');
 const r=partyStep(s,'move forest-blind');
 assert.equal(r.accepted,true);
 assert.equal(r.state.cinematicRecords.length,0);
 assert.equal(r.state.actions.some(x=>x.kind==='scene'),false);
 assert.equal(r.state.objectiveRecords.length,0);
 assert.equal(isPartySave(r.state),true);
});
test('009-B2b2b: act transitions follow committed objectives, not clocks or mandatory scenes',()=>{
 const instance=compileSelectedAdventure('ridge-survey',1);
 let s=fresh(1);
 assert.equal(cinematicAct(instance,s).number,1);
 s=move(move(move(s,'rocky-ascent'),'survey-ridge'),'forest-blind');
 for(let i=0;i<35&&!s.flags.dataRecovered;i++){
  const result=partyStep(s,'use survey records');assert.equal(result.accepted,true);
  s=result.state;
 }
 assert.equal(s.flags.dataRecovered,true);
 assert.equal(cinematicAct(instance,s).number,2);
 assert.equal(s.cinematicRecords.length,0);
 s=move(s,'survey-ridge');
 for(let i=0;i<35&&!s.flags.reportSent;i++){
  const result=partyStep(s,'use field transmitter');assert.equal(result.accepted,true);
  s=result.state;
 }
 assert.equal(s.flags.reportSent,true);
 assert.equal(cinematicAct(instance,s).number,3);
 assert.equal(partyView(s).cinematicAct.title,'The Showdown');
 assert.equal(s.cinematicRecords.length,0);
 assert.equal(isPartySave(s),true);
});
test('009-B2b2b: Act II human scene requires actual second colocated participant',()=>{
 const instance=compileSelectedAdventure('ridge-survey',5);
 let single=fresh(5);
 single=move(move(single,'river-crossing'),'forest-blind');
 for(let i=0;i<35&&!single.flags.dataRecovered;i++)single=partyStep(single,'use survey records').state;
 single=move(single,'survey-ridge');
 assert.equal(availableCinematicEvents(instance,single,single.actors[0].id).some(x=>x.id==='cross-check'),false);
 const party=makeParty({seed:77,size:2});
 let duo=fresh(5,party);
 // Shared objective completed by a real Evolved success; both explorers arrive
 // independently on their own roster turns.
 duo=partyStep(duo,'move river-crossing').state;
 duo=partyStep(duo,'move river-crossing').state;
 duo=partyStep(duo,'move forest-blind').state;
 duo=partyStep(duo,'move forest-blind').state;
 for(let i=0;i<80&&!duo.flags.dataRecovered;i++){
  const result=partyStep(duo,'use survey records');
  assert.equal(result.accepted,true);duo=result.state;
 }
 assert.equal(duo.flags.dataRecovered,true);
 duo=partyStep(duo,'move survey-ridge').state;
 duo=partyStep(duo,'move survey-ridge').state;
 assert.equal(duo.actors[0].location,'survey-ridge');
 assert.equal(duo.actors[1].location,'survey-ridge');
 const available=availableCinematicEvents(instance,duo,duo.actors[duo.cursor].id);
 assert.equal(available.some(x=>x.id==='cross-check'),true);
 const before=duo.beat;
 const scene=partyStep(duo,'scene cross-check');
 assert.equal(scene.accepted,true,scene.reason);
 assert.equal(scene.state.beat,before);
 assert.equal(isPartySave(scene.state),true);
});
test('009-B2b2b: variant-dependent dread cannot be offered unless the seeded flood is real and actor is local',()=>{
 const flood=Array.from({length:160},(_,i)=>i).find(i=>
  compileSelectedAdventure('ridge-survey',i).hiddenFacts.researchObstacle.id==='flooded-ford');
 const dry=Array.from({length:160},(_,i)=>i).find(i=>
  compileSelectedAdventure('ridge-survey',i).hiddenFacts.researchObstacle.id!=='flooded-ford');
 for(const seed of [flood,dry]){
  const ci=compileSelectedAdventure('ridge-survey',seed);
  let s=fresh(seed);
  s=move(move(move(s,'rocky-ascent'),'survey-ridge'),'forest-blind');
  for(let i=0;i<35&&!s.flags.dataRecovered;i++)s=partyStep(s,'use survey records').state;
  s=move(s,'river-crossing');
  const has=availableCinematicEvents(ci,s,s.actors[0].id).some(x=>x.id==='river-reckoning');
  assert.equal(has,seed===flood);
 }
});
test('009-B2b2b: forged scenes, future acts and wrong actor/room fail save validation',()=>{
 const s=fresh();
 const instance=compileSelectedAdventure('ridge-survey',s.initialSeed);
 for(const change of [
  t=>t.cinematicRecords.push({id:'living-valley',actorId:'pc-1',room:'field-camp',act:1,beat:0}),
  t=>t.cinematicRecords.push({id:'cross-check',actorId:'pc-1',room:'survey-ridge',act:2,beat:0}),
  t=>t.cinematicRecords.push({id:'camp-decision',actorId:'pc-1',room:'field-camp',act:3,beat:0}),
  t=>t.cinematicRecords.push({id:'not-authored',actorId:'pc-1',room:'field-camp',act:1,beat:0}),
  t=>t.cinematicRecords.push({id:'notes-among-leaves',actorId:'other',room:'forest-blind',act:1,beat:0})
 ]){
  const forged=structuredClone(s);change(forged);
  assert.equal(validCinematicRecords(instance,forged),false);
  assert.equal(isPartySave(forged),false);
 }
});
test('009-B2b2b: Rev1 and Rev2 saves keep their old bindings and show no new scripted opportunities',()=>{
 for(const [definition,rev] of [[RIDGE_SURVEY_REV1,1],[RIDGE_SURVEY_REV2,2]]){
  const old=fresh();
  old.adventureBinding=adventureBinding(compileAdventure(definition,{seed:old.initialSeed}));
 old.supportingCast=undefined;old.conversationRecords=undefined; old.npcAutonomyRecords=undefined;old.npcDangerRecords=undefined;
  delete old.cinematicRecords;
  assert.equal(old.adventureBinding.revision,rev);
  assert.equal(isPartySave(old),true);
  assert.equal(partyView(old).cinematicAct,null);
  const n=move(move(old,'rocky-ascent'),'survey-ridge');
  assert.deepEqual(partyView(n).availableSceneEvents,[]);
  assert.equal(partyStep(n,'scene living-valley').accepted,false);
 }
});
test('009-B2b2b: unrelated imported scenes do not gain access to world mutation or outcomes',()=>{
 const s=fresh();
 const ci=compileSelectedAdventure('ridge-survey',s.initialSeed);
 const wrong=commitCinematicEvent(ci,s,{actorId:s.actors[0].id,eventId:'camp-decision'});
 assert.equal(wrong.accepted,false);
 assert.strictEqual(wrong.state,s);
 assert.equal(s.flags.teamWithdrawn,false);
 assert.equal(s.outcome,'playing');
 assert.equal(s.cinematicRecords.length,0);
});
