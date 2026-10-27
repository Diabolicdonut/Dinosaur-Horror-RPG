import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {compileAdventure,adventureBinding,validateAdventureDefinition} from '../src/adventure-definition.mjs';
import {RIDGE_SURVEY_REV4} from '../adventures/ridge-survey-rev4.mjs';
import {RIDGE_SURVEY_REV5} from '../adventures/ridge-survey-rev5.mjs';
import {initialAdventureCreatures,validateCreatureContinuity,
 advanceAutonomousCreatures} from '../src/adventure-creatures.mjs';
import {newPartyIncident,isPartySave,partyStep,partyView} from '../src/party-engine.mjs';
import {actorObservation,chooseCompanionAction} from '../src/party-director.mjs';
const roster=makeParty({seed:63,size:1,careers:['scientist']});
const samples=Array.from({length:180},(_,i)=>i);
const hasHunter=i=>compileSelectedAdventure('ridge-survey',i).hiddenFacts.predatorPresence.id==='raptor-territory';
const hunterSeed=samples.find(hasHunter),quietSeed=samples.find(i=>!hasHunter(i));
const fresh=(seed=hunterSeed,party=roster)=>newPartyIncident({adventureId:'ridge-survey',seed,roster:party});
const perform=(s,cmd)=>{let r=partyStep(s,cmd);assert.equal(r.accepted,true,r.reason);return r.state;};
test('009-B2b2c2a: authored predator presence is seeded and non-universal',()=>{
 assert.notEqual(hunterSeed,quietSeed);
 const a=fresh(hunterSeed),b=fresh(quietSeed);
 assert.equal(a.adventureBinding.revision,12);
 assert.equal(a.dinosaurs.length,2);
 assert.equal(b.dinosaurs.length,1);
 assert.equal(a.dinosaurs[1].kind,'velociraptor');
 assert.equal(a.dinosaurs[1].location,'forest-blind');
 assert.equal(isPartySave(a),true);
 assert.equal(isPartySave(b),true);
 const compiled=compileSelectedAdventure('ridge-survey',hunterSeed);
 assert.deepEqual(initialAdventureCreatures(compiled),a.dinosaurs);
});
test('009-B2b2c2a: historical fourth-revision expeditions cannot inherit a new hunter',()=>{
 let s=fresh(hunterSeed);
 s.adventureBinding=adventureBinding(compileAdventure(RIDGE_SURVEY_REV4,{seed:hunterSeed}));
 s.supportingCast=undefined;s.conversationRecords=undefined; s.npcAutonomyRecords=undefined;s.npcDangerRecords=undefined;
 s.dinosaurs=s.dinosaurs.filter(d=>d.id!=='hunter-1');
 delete s.creatureRecords;
 assert.equal(isPartySave(s),true);
 const moved=perform(s,'move river-crossing');
 assert.equal(moved.dinosaurs.length,1);
 assert.equal(moved.creatureRecords,undefined);
 assert.equal(isPartySave(moved),true);
});
test('009-B2b2c2a: schema refuses teleporting paths and non-existent variant gates',()=>{
 const source=compileSelectedAdventure('ridge-survey',hunterSeed).definition;
 for(const change of [
  d=>d.initialCreatures[1].location='field-camp',
  d=>d.initialCreatures[1].patrol.path=['forest-blind','field-camp'],
  d=>d.initialCreatures[1].patrol.path=['forest-blind','river-crossing','rocky-ascent'],
  d=>d.initialCreatures[1].patrol.cadence=0,
  d=>d.initialCreatures[1].when.choice='summoned-by-director',
  d=>d.initialCreatures[1].when.slot='invented-variant',
  d=>d.initialCreatures[1].hiddenCoordinates='cheat'
 ]){
  const def=structuredClone(source);change(def);
  assert.throws(()=>validateAdventureDefinition(def),RangeError);
 }
});
test('009-B2b2c2a: one real animal patrol step follows a connected room on a completed round',()=>{
 let s=fresh();
 // This historical test verifies patrol behavior of immutable revision 5,
 // before optional opening-contact Evolved detection/initiative was introduced.
 s.adventureBinding=adventureBinding(compileAdventure(RIDGE_SURVEY_REV5,{seed:s.initialSeed}));
 s.supportingCast=undefined;s.conversationRecords=undefined; s.npcAutonomyRecords=undefined;s.npcDangerRecords=undefined;
 delete s.predatorContacts;
 const rng=s.rng,health=s.actors[0].health,from=s.dinosaurs[1].location;
 s=perform(s,'move river-crossing');
 assert.equal(from,'forest-blind');
 assert.equal(s.dinosaurs[1].location,'river-crossing');
 assert.deepEqual(s.creatureRecords,[{id:'hunter-1',from:'forest-blind',to:'river-crossing',beat:1}]);
 assert.equal(s.actors[0].health,health,'physical presence alone is not an invisible attack');
 assert.equal(s.rng,rng,'route following consumes no Evolved dice');
 assert.equal(isPartySave(s),true);
});
test('009-B2b2c2a: patrol cadence leaves the hunter in place on intervening rounds',()=>{
 let s=fresh();
 s=perform(s,'wait');
 s=perform(s,'wait');
 assert.equal(s.creatureRecords.length,1);
 assert.equal(s.dinosaurs[1].location,'river-crossing');
 s=perform(s,'wait');
 assert.equal(s.creatureRecords.length,2);
 assert.equal(s.dinosaurs[1].location,'forest-blind');
 assert.equal(isPartySave(s),true);
});
test('009-B2b2c2a: no hunter spawn, movement, or hidden danger leak in quiet seed',()=>{
 let s=fresh(quietSeed);
 assert.deepEqual(partyView(s).visibleDinosaurs,[]);
 s=perform(s,'move river-crossing');
 assert.equal(s.dinosaurs.length,1);
 assert.deepEqual(s.creatureRecords,[]);
 assert.deepEqual(partyView(s).visibleDinosaurs,[]);
 assert.equal(JSON.stringify(partyView(s)).includes('raptor-territory'),false);
 assert.equal(JSON.stringify(partyView(s)).includes('forest-blind'),true,'physical exits may still be known');
});
test('009-B2b2c2a: visible predator must share actor room; remote presence stays hidden',()=>{
 let s=fresh();
 assert.deepEqual(partyView(s).visibleDinosaurs,[]);
 s=perform(s,'move river-crossing');
 const found=partyView(s).visibleDinosaurs;
 assert.deepEqual(found.map(d=>d.id),['hunter-1']);
 assert.equal(found[0].location,'river-crossing');
 assert.equal(partyView(s).wildlifeEncounter,null,'a raptor is not a peaceful grazer encounter');
 const noticed=actorObservation(s,s.actors[0].id);
 assert.deepEqual(noticed.dinosaurs.map(d=>d.id),['hunter-1']);
});
test('009-B2b2c2a: companion AI responds to a local hunter by choosing a real connected retreat',()=>{
 let s=perform(fresh(),'move river-crossing');
 const observation=actorObservation(s,s.actors[0].id);
 const next=chooseCompanionAction(observation);
 assert.equal(next.kind,'move');
 assert.ok(observation.exits.includes(next.target));
 assert.equal(next.goal,'withdraw_from_predator');
});
test('009-B2b2c2a: multi-actor turns advance wildlife only after the full group cycle',()=>{
 const duo=makeParty({seed:74,size:2,careers:['scientist','ranger']});
 let s=fresh(hunterSeed,duo);
 s=perform(s,'wait');
 assert.deepEqual(s.creatureRecords,[]);
 s=perform(s,'wait');
 assert.equal(s.creatureRecords.length,1);
 assert.equal(s.creatureRecords[0].beat,2);
 assert.equal(s.dinosaurs[1].location,'river-crossing');
 assert.equal(isPartySave(s),true);
});
test('009-B2b2c2a: current save validation rejects physically impossible creature movement and forged turns',()=>{
 let s=perform(fresh(),'wait');
 const manifest=compileSelectedAdventure('ridge-survey',s.initialSeed);
 for(const change of [
  t=>t.dinosaurs[1].location='field-camp',
  t=>t.creatureRecords[0].from='field-camp',
  t=>t.creatureRecords[0].to='rocky-ascent',
  t=>t.creatureRecords[0].beat=0,
  t=>t.creatureRecords.push({...t.creatureRecords[0]}),
  t=>t.dinosaurs.push({...t.dinosaurs[1],id:'forged-raptor'})
 ]){
  const forged=structuredClone(s);change(forged);
  assert.equal(validateCreatureContinuity(manifest,forged),false);
  assert.equal(isPartySave(forged),false);
 }
 const wrongRevision=structuredClone(s);
 wrongRevision.adventureBinding.revision=4;
 assert.equal(isPartySave(wrongRevision),false,
  'revision fingerprint and presence cannot be substituted');
});
test('009-B2b2c2a: animal autonomy never awards scenario objectives or a rescue outcome',()=>{
 let s=fresh();
 for(let i=0;i<7;i++)s=perform(s,'wait');
 assert.deepEqual(s.flags,{dataRecovered:false,reportSent:false,teamWithdrawn:false});
 assert.equal(s.outcome,'playing');
 assert.equal(s.objectiveRecords.length,0);
 assert.equal(s.actors[0].criticalInjuries.length,0);
});
test('009-B2b2c2a: creature simulation is safely repeatable without mutation',()=>{
 const s=perform(fresh(),'wait');
 const source=structuredClone(s);
 const result=advanceAutonomousCreatures(compileSelectedAdventure('ridge-survey',s.initialSeed),s);
 assert.deepEqual(s,source);
 // No stealthy extra turn on the same physical state: the tick service is
 // called only by the Party engine after a newly resolved full actor round.
 assert.equal(Array.isArray(result.creatureRecords),true);
});
test('009-B2b2c2a: original After the Storm raptor and rescue state remain unaffected',()=>{
 const s=newPartyIncident({seed:1993,roster});
 assert.equal(s.scenario,'nublar-incident-1993');
 assert.equal(isPartySave(s),true);
 assert.equal(s.creatureRecords,undefined);
});
