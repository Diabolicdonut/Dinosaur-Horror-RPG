import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {compileAdventure,adventureBinding} from '../src/adventure-definition.mjs';
import {RIDGE_SURVEY_REV11} from '../adventures/ridge-survey-rev11.mjs';
import {initialSupportingCast} from '../src/adventure-supporting-cast.mjs';
import {newPartyIncident,isPartySave,partyStep,partyView} from '../src/party-engine.mjs';
import {setControlMode} from '../src/party-director.mjs';

const roster=makeParty({seed:61,size:1,careers:['scientist']});
const fresh=seed=>newPartyIncident({seed,roster,adventureId:'ridge-survey'});
const find=choice=>Array.from({length:500},(_,i)=>i).filter(i=>
 compileSelectedAdventure('ridge-survey',i).hiddenFacts.predatorPresence.id===choice);
function wait(s){const r=partyStep(s,'wait');assert.equal(r.accepted,true,r.reason);return r.state;}
const predatorSeeds=find('raptor-territory');
const safeSeeds=find('quiet-range');
const observed=predatorSeeds.find(seed=>wait(fresh(seed)).npcDangerRecords[0]?.action==='withdraw');
const unnoticed=predatorSeeds.find(seed=>wait(fresh(seed)).npcDangerRecords[0]?.action==='hold');

test('009-C4: rev12 immutable source has a colocated river sampler with bounded observation ratings',()=>{
 const c=compileSelectedAdventure('ridge-survey',safeSeeds[0]);
 assert.equal(c.revision,12);
 const npc=c.definition.supportingCast.find(n=>n.id==='jules-marsh');
 assert.deepEqual(npc.dangerResponse,
  {kind:'withdraw_on_sighting',exit:'field-camp',wits:3,observation:2});
 const s=fresh(safeSeeds[0]);
 assert.equal(s.npcDangerRecords.length,0);
 assert.equal(s.supportingCast.length,3);
 assert.equal(s.supportingCast[0].location,'field-camp');
 assert.equal(isPartySave(s),true);
});
test('009-C4: no predator seeded means no human threat spotting, withdrawal or fabricated attack',()=>{
 let s=fresh(safeSeeds[0]);
 for(let i=0;i<7;i++)s=wait(s);
 assert.deepEqual(s.npcDangerRecords,[]);
 assert.equal(s.supportingCast.find(n=>n.id==='jules-marsh').location,'river-crossing');
 assert.equal(s.combat,null);
 assert.equal(s.pendingPredatorResponse,null);
 assert.ok(!s.events.some(e=>/jules.*predator/i.test(e.message)));
 assert.equal(isPartySave(s),true);
});
test('009-C4: true colocated patrol yields seeded passive Evolved awareness and real one-edge retreat',()=>{
 assert.ok(Number.isSafeInteger(observed),'an Evolved passive success seed must be available');
 let s=fresh(observed);
 const pre=structuredClone(s),r=partyStep(s,'wait');
 assert.equal(r.accepted,true,r.reason);
 assert.deepEqual(s,pre);
 s=r.state;
 assert.equal(s.rng,pre.rng,'NPC observation must not silently draw from survivor RNG');
 assert.equal(s.npcDangerRecords.length,1);
 const record=s.npcDangerRecords[0];
 assert.equal(record.id,'jules-marsh');
 assert.equal(record.beat,1);
 assert.equal(record.creatureId,'hunter-1');
 assert.equal(record.from,'river-crossing');
 assert.equal(record.to,'field-camp');
 assert.equal(record.action,'withdraw');
 assert.equal(record.awareness,'human_sees_first');
 assert.equal(s.supportingCast.find(n=>n.id==='jules-marsh').location,'field-camp');
 assert.equal(s.dinosaurs.find(d=>d.id==='hunter-1').location,'river-crossing');
 assert.equal(s.combat,null,'independent NPC withdrawal never forges human NPC initiative');
 assert.equal(isPartySave(s),true);
 assert.ok(partyView(s).supportingCast.some(n=>n.id==='jules-marsh'));
 assert.ok(partyView(s).events.some(e=>e.message.includes('Jules Marsh arrives')));
 assert.equal(partyStep(s,'npc jules-marsh river').accepted,true);
});
test('009-C4: simultaneous or predator-first detection yields a valid hold, not a free miracle escape',()=>{
 assert.ok(Number.isSafeInteger(unnoticed),'a failed/contested passive result seed must exist');
 const s=wait(fresh(unnoticed));
 assert.equal(s.npcDangerRecords.length,1);
 const r=s.npcDangerRecords[0];
 assert.equal(r.action,'hold');
 assert.equal(r.to,r.from);
 assert.notEqual(r.awareness,'human_sees_first');
 assert.equal(s.supportingCast.find(n=>n.id==='jules-marsh').location,'river-crossing');
 assert.equal(isPartySave(s),true);
 assert.equal(partyView(s).supportingCast.some(n=>n.id==='jules-marsh'),false);
 assert.equal(partyView(s).events.some(e=>e.message.includes('Jules Marsh spots')),false);
});
test('009-C4: physical locations, seed and observation record can never be client-forged into a legal save',()=>{
 const s=wait(fresh(observed));
 for(const mutate of [
  x=>{x.npcDangerRecords=[];},
  x=>{x.npcDangerRecords[0].to='survey-ridge';},
  x=>{x.npcDangerRecords[0].seed++;},
  x=>{x.npcDangerRecords[0].awareness='human_sees_first_fake';},
  x=>{x.npcDangerRecords[0].action='hold';},
  x=>{x.npcDangerRecords.push({...x.npcDangerRecords[0]});},
  x=>{x.supportingCast.find(n=>n.id==='jules-marsh').location='river-crossing';},
  x=>{x.npcDangerRecords[0].creatureId='fiction';},
  x=>{x.dinosaurs.find(d=>d.id==='hunter-1').location='field-camp';}
 ]){
  const bad=structuredClone(s);mutate(bad);
  assert.equal(isPartySave(bad),false);
 }
});
test('009-C4: private source contract rejects fake observation and nonadjacent retreats',()=>{
 const base=compileSelectedAdventure('ridge-survey',observed).definition;
 for(const mutate of [
  x=>{x.supportingCast[1].dangerResponse.exit='survey-ridge';},
  x=>{x.supportingCast[1].dangerResponse.wits=10;},
  x=>{x.supportingCast[1].dangerResponse.observation=-1;},
  x=>{x.supportingCast[1].dangerResponse.kind='teleport';},
  x=>{x.supportingCast[1].dangerResponse.forceHit=true;},
  x=>{x.supportingCast[1].dangerResponse={kind:'withdraw_on_sighting',exit:'field-camp'};},
  x=>{x.supportingCast[2].dangerResponse={kind:'withdraw_on_sighting',exit:'rocky-ascent',wits:3,observation:2};}
 ]){
  const bad=structuredClone(base);mutate(bad);
  assert.throws(()=>compileAdventure(bad,{seed:observed}),RangeError);
 }
});
test('009-C4: frozen rev11 remains valid with two fixed NPCs and no new sighting history',()=>{
 const compiled=compileAdventure(RIDGE_SURVEY_REV11,{seed:observed});
 let s=fresh(observed);
 s.adventureBinding=adventureBinding(compiled);
 s.supportingCast=initialSupportingCast(compiled);
 delete s.npcDangerRecords;
 assert.equal(isPartySave(s),true);
 s=wait(s);
 assert.equal(s.supportingCast.length,2);
 assert.equal(s.npcDangerRecords,undefined);
 assert.equal(isPartySave(s),true);
});
test('009-C4: party, focus and spectator switches cannot create sightings or alter seed',()=>{
 let s=fresh(observed),baseline=structuredClone(s);
 s=setControlMode(s,{mode:'spectator'}).state;
 assert.equal(s.rng,baseline.rng);
 assert.equal(s.beat,baseline.beat);
 assert.deepEqual(s.npcDangerRecords,[]);
 s=setControlMode(s,{mode:'focus',focusedActorId:s.actors[0].id}).state;
 assert.equal(isPartySave(s),true);
 s=wait(s);
 assert.equal(s.npcDangerRecords.length,1);
});
test('009-C4: NPC observation does not consume another survivor turn or create a remote warning',()=>{
 let s=fresh(observed);
 const first=partyStep(s,'move rocky-ascent');
 assert.equal(first.accepted,true,first.reason);
 s=first.state;
 assert.equal(s.beat,1);
 assert.equal(s.clock.explorationActions,1);
 const events=partyView(s).events.map(e=>e.message).join(' ');
 assert.doesNotMatch(events,/Jules Marsh (spots|arrives)/);
 assert.ok(s.npcDangerRecords.length===1);
});
