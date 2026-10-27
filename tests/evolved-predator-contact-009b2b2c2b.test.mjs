import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {validateAdventureDefinition,compileAdventure,adventureBinding} from '../src/adventure-definition.mjs';
import {RIDGE_SURVEY_REV5} from '../adventures/ridge-survey-rev5.mjs';
import {RIDGE_SURVEY_REV6} from '../adventures/ridge-survey-rev6.mjs';
import {localPredator,resolvePredatorContact,validPredatorContacts}
 from '../src/adventure-predator-contact.mjs';
import {newPartyIncident,isPartySave,partyView,partyStep} from '../src/party-engine.mjs';
const roster=makeParty({seed:99,size:1,careers:['scientist']});
const series=Array.from({length:250},(_,i)=>i);
const predatorSeed=series.find(i=>compileSelectedAdventure('ridge-survey',i)
 .hiddenFacts.predatorPresence.id==='raptor-territory');
const quietSeed=series.find(i=>compileSelectedAdventure('ridge-survey',i)
 .hiddenFacts.predatorPresence.id==='quiet-range');
// Existing 009-B2b2c2b invariants apply to the immutable automatic defense
// revision. The current Rev7 tests live in a distinct focused test module.
const fresh=(seed=predatorSeed)=>{
 const s=newPartyIncident({adventureId:'ridge-survey',seed,roster});
 s.adventureBinding=adventureBinding(compileAdventure(RIDGE_SURVEY_REV6,{seed}));
 s.supportingCast=undefined;s.conversationRecords=undefined; s.npcAutonomyRecords=undefined;s.npcDangerRecords=undefined;
 delete s.pendingPredatorResponse;
 return s;
};
function move(s,to){
 const r=partyStep(s,'move '+to);
 assert.equal(r.accepted,true,r.reason);
 return r.state;
}
function toBlind(s){return move(move(move(s,'rocky-ascent'),'survey-ridge'),'forest-blind');}
test('009-B2b2c2b: old revision 5 remains immutable; new threat protocol is revision 6',()=>{
 const s=fresh(),old=structuredClone(s);
 assert.equal(s.adventureBinding.revision,6);
 old.adventureBinding=adventureBinding(compileAdventure(RIDGE_SURVEY_REV5,{seed:s.initialSeed}));
 old.supportingCast=undefined;old.conversationRecords=undefined; old.npcAutonomyRecords=undefined;old.npcDangerRecords=undefined;
 delete old.predatorContacts;
 assert.equal(isPartySave(old),true);
 assert.equal(compileSelectedAdventure('ridge-survey',s.initialSeed).revision,12);
 assert.equal(compileAdventure(RIDGE_SURVEY_REV5,{seed:s.initialSeed}).revision,5);
});
test('009-B2b2c2b: every source creature threat must name an authorized Evolved profile',()=>{
 const base=compileSelectedAdventure('ridge-survey',predatorSeed).definition;
 for(const mutate of [
  d=>d.initialCreatures[1].threat.protocol='narrative_attack',
  d=>d.initialCreatures[1].species='invented_raptor',
  d=>d.initialCreatures[1].disposition='neutral',
  d=>d.initialCreatures[1].threat.attack=999,
  d=>d.initialCreatures[0].threat={protocol:'evolved_contact'}
 ]){
  const x=structuredClone(base);mutate(x);
  assert.throws(()=>validateAdventureDefinition(x),RangeError);
 }
});
test('009-B2b2c2b: quiet expedition generates no threats or extra contact rolls',()=>{
 let s=toBlind(fresh(quietSeed));
 assert.equal(s.dinosaurs.some(d=>d.kind==='velociraptor'),false);
 assert.equal(s.predatorContacts.length,0);
 assert.equal(isPartySave(s),true);
 const before=s.actors[0].health;
 s=partyStep(s,'wait').state;
 assert.equal(s.actors[0].health,before);
 assert.equal(s.predatorContacts.length,0);
});
test('009-B2b2c2b: predator must be colocated to trigger Evolved opening contact',()=>{
 const s=fresh();
 const compiled=compileSelectedAdventure('ridge-survey',s.initialSeed);
 assert.equal(localPredator(compiled,s,s.actors[0].id),null);
 const denied=resolvePredatorContact(compiled,s,{actorId:s.actors[0].id,
  observationSeed:1,initiativeSeed:2,attackSeed:3,dodgeSeed:4});
 assert.equal(denied.accepted,false);
 assert.strictEqual(denied.state,s);
 assert.equal(s.predatorContacts.length,0);
});
test('009-B2b2c2b: physically entering a patrolled blind can trigger detection and initiative',()=>{
 const s=toBlind(fresh());
 const record=s.predatorContacts[0];
 assert.ok(record);
 assert.equal(record.room,'forest-blind');
 assert.equal(record.creatureId,'hunter-1');
 assert.equal(record.beat,s.beat);
 assert.equal(record.actorId,s.actors[0].id);
 assert.equal(typeof record.predatorFirst,'boolean');
 assert.equal(typeof record.surprised,'boolean');
 assert.equal(record.attack,(record.surprised||record.awareness==='simultaneous')&&record.predatorFirst);
 assert.equal(isPartySave(s),true);
});
test('009-B2b2c2b: seed-stable encounter replay has identical positional, defensive and injury results',()=>{
 const a=toBlind(fresh()),b=toBlind(fresh());
 assert.deepEqual(a,b);
 assert.deepEqual(a.predatorContacts,b.predatorContacts);
});
test('009-B2b2c2b: genuine Evolved detection and initiative allow both attacks and harmless discovery',()=>{
 const state=toBlind(fresh());
 const compiled=compileSelectedAdventure('ridge-survey',state.initialSeed);
 const target=state.actors[0].id;
 let strike=null,warning=null,injury=null,miss=null;
 for(let i=1;i<1800&&(!strike||!warning||!injury||!miss);i++){
  const s=structuredClone(state);
  s.beat+=1;s.actions.push({beat:s.beat-1,actorId:target,kind:'wait',target:''});
  const r=resolvePredatorContact(compiled,s,{actorId:target,
   observationSeed:i,initiativeSeed:i*41,attackSeed:i*13,dodgeSeed:i*19});
  assert.equal(r.accepted,true,r.reason);
  if(r.record.attack)strike??=r;
  else warning??=r;
  if(r.record.damage>0)injury??=r;
  if(r.record.attack&&r.record.damage===0)miss??=r;
 }
 assert.ok(strike);
 assert.ok(warning,'predator sighting need not produce an attack');
 assert.ok(injury,'a real strike can cause actual injury');
 assert.ok(miss,'Evolved attack and dodge do not guarantee damage');
 assert.ok(injury.actorAfter.health<state.actors[0].health);
 assert.equal(warning.record.damage,0);
 assert.equal(miss.record.damage,0);
});
test('009-B2b2c2b: actor can take a physical exit before the next contact instead of being locked in combat',()=>{
 let s=toBlind(fresh());
 const afterFirst=s.predatorContacts.length;
 s=move(s,'survey-ridge');
 assert.equal(s.actors[0].location,'survey-ridge');
 assert.equal(s.predatorContacts.length,afterFirst);
 assert.equal(isPartySave(s),true);
});
test('009-B2b2c2b: seeded contact journals reject forged awareness, acts and damage',()=>{
 const s=toBlind(fresh()),compiled=compileSelectedAdventure('ridge-survey',s.initialSeed);
 for(const change of [
  t=>t.predatorContacts[0].room='field-camp',
  t=>t.predatorContacts[0].actorId='pc-404',
  t=>t.predatorContacts[0].damage=1000,
  t=>t.predatorContacts[0].beat=t.beat+1,
  t=>t.predatorContacts[0].awareness='omniscient',
  t=>t.predatorContacts[0].surprised=!t.predatorContacts[0].surprised,
  t=>t.predatorContacts.push({...t.predatorContacts[0]})
 ]){
  const forged=structuredClone(s);change(forged);
  assert.equal(validPredatorContacts(compiled,forged),false);
  assert.equal(isPartySave(forged),false);
 }
});
test('009-B2b2c2b: prior revision 5 patrol shares space harmlessly without retroactive attacks',()=>{
 let old=fresh();
 old.adventureBinding=adventureBinding(compileAdventure(RIDGE_SURVEY_REV5,{seed:old.initialSeed}));
 old.supportingCast=undefined;old.conversationRecords=undefined; old.npcAutonomyRecords=undefined;old.npcDangerRecords=undefined;
 delete old.predatorContacts;
 const progressed=toBlind(old);
 assert.equal(progressed.predatorContacts,undefined);
 assert.equal(isPartySave(progressed),true);
 assert.equal(progressed.actors[0].health,progressed.actors[0].healthMax);
});
test('009-B2b2c2b: local sighting never leaks a remote predator to observers',()=>{
 const s=fresh();
 const v=partyView(s);
 assert.equal(v.visibleDinosaurs.some(d=>d.kind==='velociraptor'),false);
 assert.equal(JSON.stringify(v).includes('predatorContacts'),false);
 assert.equal(JSON.stringify(v).includes('hunter-1'),false);
});
test('009-B2b2c2b: existing Nublar rescue ignores new research contact engine',()=>{
 const s=newPartyIncident({seed:1993,roster});
 const before=structuredClone(s);
 assert.equal(isPartySave(s),true);
 assert.equal(partyStep(s,'predator_contact hunter-1').accepted,false);
 assert.deepEqual(s,before);
});
