import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {compileAdventure,adventureBinding} from '../src/adventure-definition.mjs';
import {RIDGE_SURVEY_REV6} from '../adventures/ridge-survey-rev6.mjs';
import {newPartyIncident,partyStep,partyView,isPartySave} from '../src/party-engine.mjs';
import {currentOwner,runAutonomousTurn} from '../src/party-director.mjs';

const roster=makeParty({seed:99,size:1,careers:['scientist']});
const compiled=seed=>compileSelectedAdventure('ridge-survey',seed);
const fresh=seed=>newPartyIncident({adventureId:'ridge-survey',seed,roster});
function progress(s){
 for(const to of ['rocky-ascent','survey-ridge','forest-blind']){
  const r=partyStep(s,'move '+to);
  assert.equal(r.accepted,true,r.reason);
  s=r.state;
  if(s.pendingPredatorResponse)break;
 }
 return s;
}
const candidateSeeds=Array.from({length:300},(_,i)=>i)
 .filter(i=>compiled(i).hiddenFacts.predatorPresence.id==='raptor-territory');
const dangerSeed=candidateSeeds.find(i=>Boolean(progress(fresh(i)).pendingPredatorResponse));
const quietSeed=Array.from({length:300},(_,i)=>i)
 .find(i=>compiled(i).hiddenFacts.predatorPresence.id==='quiet-range');
const pending=()=>progress(fresh(dangerSeed));

test('009-B2b2c2c1: new authored research is rev7 and rev6 remains immutable',()=>{
 assert.equal(compiled(dangerSeed).revision,13);
 const old=fresh(dangerSeed);
 old.adventureBinding=adventureBinding(compileAdventure(RIDGE_SURVEY_REV6,{seed:dangerSeed}));
 old.supportingCast=undefined;old.conversationRecords=undefined; old.npcAutonomyRecords=undefined;old.npcDangerRecords=undefined;
 delete old.pendingPredatorResponse;
 assert.equal(isPartySave(old),true);
 assert.equal(old.adventureBinding.revision,6);
 assert.equal(pending().adventureBinding.revision,13);
});
test('009-B2b2c2c1: a quiet expedition has no defensive prompts or predator RNG',()=>{
 let s=progress(fresh(quietSeed));
 assert.equal(s.pendingPredatorResponse,null);
 assert.equal(s.predatorContacts.length,0);
 assert.equal(s.clock.combatSeconds,0);
 assert.equal(isPartySave(s),true);
});
test('009-B2b2c2c1: predator attack is staged only after source awareness and initiative',()=>{
 const s=pending();
 assert.ok(s.pendingPredatorResponse,'at least one reproducible seeded attack opportunity');
 assert.equal(s.pendingPredatorResponse.room,s.actors[0].location);
 assert.equal(s.pendingPredatorResponse.victimId,s.actors[0].id);
 assert.equal(s.pendingPredatorResponse.creatureId,'hunter-1');
 assert.equal(s.pendingPredatorResponse.predatorFirst,true);
 assert.equal(s.pendingPredatorResponse.attack,true);
 assert.ok(['creature_sees_first','simultaneous'].includes(s.pendingPredatorResponse.awareness));
 assert.equal(s.predatorContacts.length,0,'no attack roll is committed before choosing');
 assert.equal(s.clock.combatSeconds,0);
 assert.equal(isPartySave(s),true);
});
test('009-B2b2c2c1: while threatened, ordinary movement and objectives cannot bypass defense',()=>{
 const s=pending();
 for(const action of ['move survey-ridge','wait','use survey records','scene notes-among-leaves','attack dinosaur']){
  const r=partyStep(s,action);
  assert.equal(r.accepted,false,action);
  assert.strictEqual(r.state,s);
 }
});
test('009-B2b2c2c1: defend commits canonical Close Combat reaction and exactly ten seconds',()=>{
 const s=pending(),snapshot=structuredClone(s),r=partyStep(s,'react defend');
 assert.equal(r.accepted,true,r.reason);
 assert.equal(r.state.pendingPredatorResponse,null);
 assert.equal(r.state.predatorContacts.length,1);
 assert.equal(r.state.predatorContacts[0].reaction,'defend');
 assert.equal(r.state.clock.combatRounds,1);
 assert.equal(r.state.clock.combatSeconds,10);
 assert.equal(r.state.clock.explorationActions,s.clock.explorationActions);
 assert.equal(r.state.beat,s.beat);
 assert.equal(r.state.actions.at(-1).kind,'react');
 assert.equal(isPartySave(r.state),true);
 assert.deepEqual(s,snapshot);
 assert.equal(partyStep(r.state,'react defend').accepted,false);
});
test('009-B2b2c2c1: declining reaction also risks genuine Evolved creature injury',()=>{
 const s=pending(),r=partyStep(s,'react decline');
 assert.equal(r.accepted,true,r.reason);
 assert.equal(r.state.predatorContacts[0].reaction,'decline');
 assert.equal(r.state.clock.combatSeconds,10);
 assert.equal(isPartySave(r.state),true);
 assert.ok(r.result.damage>=0);
});
test('009-B2b2c2c1: both choices use deterministic seeds, not fabricated story hits',()=>{
 assert.deepEqual(partyStep(pending(),'react defend').state,
                  partyStep(pending(),'react defend').state);
 const a=partyStep(pending(),'react defend'),b=partyStep(pending(),'react decline');
 assert.equal(a.accepted,true);assert.equal(b.accepted,true);
 assert.equal(a.state.pendingPredatorResponse,null);
 assert.equal(b.state.pendingPredatorResponse,null);
});
test('009-B2b2c2c1: focus and spectator control respect defender agency',()=>{
 const s=pending();
 s.control.mode='focus';s.control.focusedActorId=s.actors[0].id;
 assert.equal(currentOwner(s),'human');
 assert.equal(partyStep(s,'react defend',{source:'ai'}).accepted,false);
 s.control.mode='spectator';
 assert.equal(currentOwner(s),'ai');
 assert.equal(partyStep(s,'react defend',{source:'human'}).accepted,false);
 const auto=runAutonomousTurn(s,{singleStep:true});
 assert.equal(auto.accepted,true,auto.reason);
 assert.equal(auto.state.pendingPredatorResponse,null);
 assert.equal(isPartySave(auto.state),true);
});
test('009-B2b2c2c1: tampering with pending creature/room/attack seeds rejects save',()=>{
 const s=pending();
 for(const modify of [
  t=>t.pendingPredatorResponse.victimId='pc-99',
  t=>t.pendingPredatorResponse.room='field-camp',
  t=>t.pendingPredatorResponse.creatureId='fictitious',
  t=>t.pendingPredatorResponse.attackSeed=-1,
  t=>t.pendingPredatorResponse.attack=false,
  t=>t.pendingPredatorResponse.predatorFirst=false,
  t=>t.pendingPredatorResponse.beat=t.beat+1
 ]){
  const bad=structuredClone(s);modify(bad);
  assert.equal(isPartySave(bad),false);
 }
});
test('009-B2b2c2c1: rev6 continues automatic source defense without new prompt',()=>{
 let s=fresh(dangerSeed);
 s.adventureBinding=adventureBinding(compileAdventure(RIDGE_SURVEY_REV6,{seed:dangerSeed}));
 s.supportingCast=undefined;s.conversationRecords=undefined; s.npcAutonomyRecords=undefined;s.npcDangerRecords=undefined;
 delete s.pendingPredatorResponse;
 s=progress(s);
 assert.equal(s.pendingPredatorResponse,undefined);
 assert.equal(isPartySave(s),true);
});
test('009-B2b2c2c1: Nublar rescue never imports research pending defense',()=>{
 const s=newPartyIncident({seed:1993,roster});
 assert.equal(s.pendingPredatorResponse,undefined);
 assert.equal(partyStep(s,'react defend').accepted,false);
 assert.equal(isPartySave(s),true);
});
