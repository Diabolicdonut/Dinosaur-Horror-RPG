import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {compileAdventure,adventureBinding} from '../src/adventure-definition.mjs';
import {RIDGE_SURVEY_REV10} from '../adventures/ridge-survey-rev10.mjs';
import {initialSupportingCast} from '../src/adventure-supporting-cast.mjs';
import {newPartyIncident,isPartySave,partyStep,partyView} from '../src/party-engine.mjs';
import {advanceSupportingCast} from '../src/adventure-supporting-cast.mjs';
import {setControlMode} from '../src/party-director.mjs';

const roster=makeParty({seed:44,size:1,careers:['scientist']});
const quiet=Array.from({length:250},(_,i)=>i).find(seed=>
 compileSelectedAdventure('ridge-survey',seed).hiddenFacts.predatorPresence.id==='quiet-range');
const fresh=seed=>newPartyIncident({adventureId:'ridge-survey',seed,roster});
function commit(s,command){
 const r=partyStep(s,command);
 assert.equal(r.accepted,true,r.reason);
 return r.state;
}
function researchUntilReport(){
 let s=fresh(quiet);
 for(const room of ['rocky-ascent','survey-ridge','forest-blind'])s=commit(s,'move '+room);
 for(let attempt=0;attempt<50&&!s.flags.dataRecovered;attempt++)
  s=commit(s,'use survey records');
 assert.equal(s.flags.dataRecovered,true,'a real Evolved observation success is required');
 s=commit(s,'move survey-ridge');
 for(let attempt=0;attempt<50&&!s.flags.reportSent;attempt++)
  s=commit(s,'use field transmitter');
 assert.equal(s.flags.reportSent,true,'a real Evolved comtech success is required');
 return s;
}

test('009-C3: source-authored NPC return requires an objective and uses a connected route',()=>{
 const manifest=compileSelectedAdventure('ridge-survey',quiet);
 assert.equal(manifest.revision,13);
 assert.equal(manifest.definition.supportingCast[2].autonomy.kind,'return_route');
 assert.deepEqual(manifest.definition.supportingCast[2].autonomy.path,
  ['survey-ridge','rocky-ascent','field-camp']);
 const s=fresh(quiet);
 assert.equal(s.npcAutonomyRecords.length,0);
 assert.equal(s.supportingCast[2].location,'survey-ridge');
 assert.equal(isPartySave(s),true);
});
test('009-C3: unearned objective never causes a scripted NPC move, even after several rounds',()=>{
 let s=fresh(quiet);
 for(let i=0;i<6;i++)s=commit(s,'wait');
 assert.equal(s.supportingCast[2].location,'survey-ridge');
 assert.deepEqual(s.npcAutonomyRecords,[]);
 assert.equal(isPartySave(s),true);
});
test('009-C3: NPC independently completes each physical step after an actual field report',()=>{
 let s=researchUntilReport();
 const movement=s.npcAutonomyRecords;
 assert.deepEqual(movement.length,1);
 assert.deepEqual(movement[0],{id:'tomas-wren',beat:s.beat,
  from:'survey-ridge',to:'rocky-ascent'});
 assert.equal(s.supportingCast[2].location,'rocky-ascent');
 assert.equal(partyView(s).supportingCast.length,0,
  'a distant NPC is removed from the current survivor view');
 assert.equal(isPartySave(s),true);
 const rng=s.rng;
 s=commit(s,'wait');
 assert.equal(s.rng,rng,'walking NPCs must not consume Evolved random rolls');
 assert.deepEqual(s.npcAutonomyRecords.map(x=>x.to),['rocky-ascent','field-camp']);
 assert.equal(s.supportingCast[2].location,'field-camp');
 assert.equal(isPartySave(s),true);
 const frozen=structuredClone(s);
 const next=advanceSupportingCast(compileSelectedAdventure('ridge-survey',quiet),s);
 assert.deepEqual(next,frozen,'an NPC at the destination cannot walk again');
});
test('009-C3: private NPC movement cannot appear as remote narration',()=>{
 let s=researchUntilReport();
 // The survivor is at the ridge when Tomas heads down the adjoining path.
 const observed=partyView(s).events.map(e=>e.message).join(' ');
 assert.match(observed,/Tomas Wren heads along the adjoining trail/);
 s=commit(s,'wait');
 const remote=partyView(s).events.map(e=>e.message).join(' ');
 assert.doesNotMatch(remote,/Tomas Wren arrives from the adjoining trail/,
  'arrival at camp must not leak through the distant ridge camera');
});
test('009-C3: tampered itinerary or inserted/missing autonomous decisions reject as saves',()=>{
 const good=researchUntilReport();
 for(const edit of [
  s=>{s.supportingCast[2].location='field-camp';},
  s=>{s.npcAutonomyRecords=[];},
  s=>{s.npcAutonomyRecords[0].to='field-camp';},
  s=>{s.npcAutonomyRecords[0].beat+=2;},
  s=>{s.npcAutonomyRecords.push({...s.npcAutonomyRecords[0]});},
  s=>{s.supportingCast[0].location='rocky-ascent';}
 ]){
  const forged=structuredClone(good);edit(forged);
  assert.equal(isPartySave(forged),false);
 }
});
test('009-C3: historic rev10 NPCs cannot inherit autonomous movement retroactively',()=>{
 const original=compileAdventure(RIDGE_SURVEY_REV10,{seed:quiet});
 let s=fresh(quiet);
 s.adventureBinding=adventureBinding(original);
 s.supportingCast=initialSupportingCast(original);
 delete s.npcAutonomyRecords;delete s.npcDangerRecords;
 assert.equal(isPartySave(s),true);
 for(let i=0;i<4;i++)s=commit(s,'wait');
 assert.equal(s.supportingCast[1].location,'survey-ridge');
 assert.equal(s.npcAutonomyRecords,undefined);
 assert.equal(isPartySave(s),true);
});
test('009-C3: publisher-authorized route schema rejects teleportation and invented effects',()=>{
 const base=compileSelectedAdventure('ridge-survey',quiet).definition;
 for(const edit of [
  s=>{s.supportingCast[2].autonomy.path=['survey-ridge','field-camp'];},
  s=>{s.supportingCast[2].autonomy.path=['survey-ridge','rocky-ascent','survey-ridge'];},
  s=>{s.supportingCast[2].autonomy.cadence=0;},
  s=>{s.supportingCast[2].autonomy.trigger={kind:'objective',id:'phantom'};},
  s=>{s.supportingCast[2].autonomy.kind='teleport';},
  s=>{s.supportingCast[2].autonomy.forceAttack=true;},
  s=>{s.supportingCast[2].autonomy.trigger={kind:'scene',id:'living-valley'};}
 ]){
  const bad=structuredClone(base);edit(bad);
  assert.throws(()=>compileAdventure(bad,{seed:quiet}),RangeError);
 }
});
test('009-C3: spectator and focus switches do not reroll or accelerate autonomous NPCs',()=>{
 let s=fresh(quiet);
 const base=structuredClone(s);
 s=setControlMode(s,{mode:'spectator'}).state;
 assert.equal(s.beat,base.beat);assert.equal(s.rng,base.rng);
 assert.deepEqual(s.npcAutonomyRecords,base.npcAutonomyRecords);
 s=setControlMode(s,{mode:'focus',focusedActorId:s.actors[0].id}).state;
 assert.equal(isPartySave(s),true);
 assert.equal(s.npcAutonomyRecords.length,0);
});
