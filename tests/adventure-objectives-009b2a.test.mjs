import test from 'node:test';
import assert from 'node:assert/strict';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {commitAuthorizedObjective,objectiveStatus,validObjectiveRecords} from '../src/adventure-objectives.mjs';
import {newPartyIncident,partyStep,isPartySave} from '../src/party-engine.mjs';
const compile=id=>compileSelectedAdventure(id,1234);
const auth={kind:'engine-committed-rule',success:true};
function fixture(id='ridge-survey'){
 const compiled=compile(id);
 const state={beat:0,outcome:'playing',flags:structuredClone(compiled.definition.flags),
  actors:[{id:'pc-1',location:compiled.definition.start,dead:false,broken:false}],objectiveRecords:[]};
 return {compiled,state};
}
const move=(s,room)=>(s.actors[0].location=room,s);
const apply=(compiled,s,id,authorization=auth)=>commitAuthorizedObjective(compiled,s,{
 objectiveId:id,actorId:'pc-1',authorization});
test('009-B2a: validated objective graphs differ across both authored scenarios',()=>{
 const a=fixture('nublar-after-the-storm'),b=fixture();
 assert.deepEqual(objectiveStatus(a.compiled,a.state).remainingIds,
  ['restore-power','call-for-help','light-beacon']);
 assert.deepEqual(objectiveStatus(b.compiled,b.state).remainingIds,
  ['recover-transect','send-field-report','walk-out']);
});
test('009-B2a: no generic completion without successful engine authorization',()=>{
 const {compiled,state}=fixture();move(state,'forest-blind');
 const before=structuredClone(state);
 for(const authorization of [null,{kind:'ai-suggestion',success:true},
  {kind:'engine-committed-rule',success:false}]){
  assert.equal(apply(compiled,state,'recover-transect',authorization).accepted,false);
  assert.deepEqual(state,before);
 }
});
test('009-B2a: remote objective cannot complete or move an actor',()=>{
 const {compiled,state}=fixture();
 assert.equal(apply(compiled,state,'recover-transect').accepted,false);
 assert.deepEqual(state.flags,{dataRecovered:false,reportSent:false,teamWithdrawn:false});
 assert.equal(state.objectiveRecords.length,0);
});
test('009-B2a: prerequisite gate blocks a walk-out shortcut',()=>{
 const {compiled,state}=fixture();
 const before=structuredClone(state);
 assert.equal(apply(compiled,state,'walk-out').accepted,false);
 assert.deepEqual(state,before);
});
test('009-B2a: authorized flag commits are transactional and do not consume RNG',()=>{
 const {compiled,state}=fixture();move(state,'forest-blind');
 const applied=apply(compiled,state,'recover-transect');
 assert.equal(applied.accepted,true);
 assert.equal(applied.state.flags.dataRecovered,true);
 assert.equal(state.flags.dataRecovered,false);
 assert.equal(applied.state.objectiveRecords[0].room,'forest-blind');
 assert.equal(validObjectiveRecords(compiled,applied.state),true);
 assert.deepEqual(objectiveStatus(compiled,applied.state).completedIds,['recover-transect']);
});
test('009-B2a: duplicate objective attempts cannot mint more effects',()=>{
 const {compiled,state}=fixture();move(state,'forest-blind');
 const first=apply(compiled,state,'recover-transect');
 const repeat=apply(compiled,first.state,'recover-transect');
 assert.equal(repeat.accepted,false);assert.deepEqual(repeat.state,first.state);
});
test('009-B2a: distinct ridge-survey ending is a completed walk-out',()=>{
 const {compiled,state}=fixture();
 let s=apply(compiled,move(state,'forest-blind'),'recover-transect').state;
 s=apply(compiled,move(s,'survey-ridge'),'send-field-report').state;
 const ending=apply(compiled,move(s,'field-camp'),'walk-out');
 assert.equal(ending.accepted,true);
 assert.deepEqual(ending.state.flags,{dataRecovered:true,reportSent:true,teamWithdrawn:true});
 assert.equal(ending.state.adventureOutcome,'completed');
 assert.equal(ending.state.outcome,'playing'); // generic domain leaves Party-v3 UI translation to the host
 assert.equal(ending.state.objectiveRecords.length,3);
 assert.equal(apply(compiled,ending.state,'walk-out').accepted,false);
});
test('009-B2a: After the Storm applies generator, radio, beacon in authored order',()=>{
 const {compiled,state}=fixture('nublar-after-the-storm');
 let s=apply(compiled,move(state,'shed'),'restore-power').state;
 assert.equal(s.flags.power,true);
 s=apply(compiled,move(s,'control'),'call-for-help').state;
 assert.equal(s.flags.distress,true);
 s=apply(compiled,move(s,'helipad'),'light-beacon').state;
 assert.equal(s.flags.beacon,true);
 assert.equal(s.adventureOutcome,'completed');
});
test('009-B2a: older Party saves without objective records retain flag-derived prerequisites',()=>{
 const {compiled,state}=fixture('nublar-after-the-storm');
 delete state.objectiveRecords;state.flags.power=true;move(state,'control');
 const r=apply(compiled,state,'call-for-help');
 assert.equal(r.accepted,true);
 assert.equal(r.state.flags.distress,true);
 assert.deepEqual(r.state.objectiveRecords.map(x=>x.id),['call-for-help']);
});
test('009-B2a: objective history rejects forged actors, rooms and duplicate records',()=>{
 const {compiled,state}=fixture();move(state,'forest-blind');
 const accepted=apply(compiled,state,'recover-transect').state;
 for(const mutate of [
  x=>x.objectiveRecords[0].actorId='forged',
  x=>x.objectiveRecords[0].room='field-camp',
  x=>x.objectiveRecords[0].beat=100,
  x=>x.objectiveRecords.push(structuredClone(x.objectiveRecords[0]))
 ]){
  const bad=structuredClone(accepted);mutate(bad);
  assert.equal(validObjectiveRecords(compiled,bad),false);
 }
});
test('009-B2a: changed compiled definition cannot author a hidden new effect',()=>{
 const {compiled,state}=fixture();
 const forged=structuredClone(compiled);
 forged.definition.objectives[0].effects=[{type:'flag',name:'forged',value:true}];
 assert.throws(()=>apply(forged,move(state,'forest-blind'),'recover-transect'),RangeError);
});
test('009-B2a: generic objective text is not a source-roll bypass action in Party',()=>{
 const state=newPartyIncident({seed:17});
 const r=partyStep(state,{kind:'objective',target:'light-beacon'});
 assert.equal(r.accepted,false);assert.deepEqual(r.state,state);
 assert.equal(isPartySave(state),true);
});
test('009-B2a: new Party saves contain compatible objective records',()=>{
 const s=newPartyIncident({seed:99});
 assert.deepEqual(s.objectiveRecords,[]);
 assert.equal(validObjectiveRecords(compile('nublar-after-the-storm'),s),true);
 assert.equal(isPartySave(s),true);
});
test('009-B2a: original Evolved generator successes commit and failures do not',()=>{
 let success=null,failure=null;
 for(let seed=1;seed<=200&&(!success||!failure);seed++){
  const s=newPartyIncident({seed});
  s.actors[0].location='shed';s.actors[0].visitedRooms.push('shed');
  const result=partyStep(s,'use generator');
  if(!result.accepted)continue;
  if(result.result.success)success=result;
  else failure=result;
 }
 assert.ok(success,'at least one legal Evolved skill roll succeeded');
 assert.ok(failure,'at least one legal Evolved skill roll failed');
 assert.equal(success.state.flags.power,true);
 assert.deepEqual(success.state.objectiveRecords.map(x=>x.id),['restore-power']);
 assert.equal(failure.state.flags.power,false);
 assert.deepEqual(failure.state.objectiveRecords,[]);
 assert.equal(isPartySave(success.state),true);
 assert.equal(isPartySave(failure.state),true);
});

test('009-B2a: forged completion records cannot override unapplied flags or skip prerequisites',()=>{
 const {compiled,state}=fixture();
 const bogus={id:'walk-out',actorId:'pc-1',room:'field-camp',beat:0};
 state.objectiveRecords=[bogus];
 assert.equal(validObjectiveRecords(compiled,state),false);
 state.objectiveRecords=[{id:'recover-transect',actorId:'pc-1',room:'forest-blind',beat:0}];
 assert.equal(validObjectiveRecords(compiled,state),false); // effect not applied
});
test('009-B2a: accepted objective history rejects reversed causal time',()=>{
 const {compiled,state}=fixture();
 let s=apply(compiled,move(state,'forest-blind'),'recover-transect').state;
 s.beat=1;
 s=apply(compiled,move(s,'survey-ridge'),'send-field-report').state;
 s.objectiveRecords[0].beat=2;
 assert.equal(validObjectiveRecords(compiled,s),false);
});
