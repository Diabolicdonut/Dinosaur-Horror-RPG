import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {compileAdventure,adventureBinding,adventureFingerprint} from '../src/adventure-definition.mjs';
import {RIDGE_SURVEY_REV9} from '../adventures/ridge-survey-rev9.mjs';
import {newPartyIncident,partyView,partyStep,isPartySave,parsePartyAction} from '../src/party-engine.mjs';
import {setControlMode,setCamera} from '../src/party-director.mjs';
const roster=makeParty({seed:44,size:1,careers:['scientist']});
const fresh=seed=>newPartyIncident({seed,roster,adventureId:'ridge-survey'});
const seedFor=name=>Array.from({length:250},(_,i)=>i).find(seed=>
 compileSelectedAdventure('ridge-survey',seed).hiddenFacts.predatorPresence.id===name);
const quiet=seedFor('quiet-range'),predator=seedFor('raptor-territory');
const doAction=(s,action)=>{const r=partyStep(s,action);assert.equal(r.accepted,true,r.reason);return r.state;};

test('009-C2: validated, seeded physical supporting cast is a separate data package',()=>{
 const compiled=compileSelectedAdventure('ridge-survey',quiet),s=fresh(quiet);
 assert.equal(compiled.revision,12);
 assert.equal(s.adventureBinding.revision,12);
 assert.deepEqual(s.supportingCast.map(x=>x.id),['leena-harrow','jules-marsh','tomas-wren']);
 assert.equal(s.supportingCast[0].location,'field-camp');
 assert.equal(isPartySave(s),true);
 assert.equal(partyView(s).supportingCast.length,1);
 assert.equal(partyView(s).supportingCast[0].name,'Leena Harrow');
 assert.equal(JSON.stringify(partyView(s)).includes('sponsors remains'),false,
  'private NPC motives never enter player view');
});
test('009-C2: original rev9 fingerprint and saves do not acquire new NPC history',()=>{
 const original=compileAdventure(RIDGE_SURVEY_REV9,{seed:quiet});
 const s=fresh(quiet);s.adventureBinding=adventureBinding(original);
 delete s.supportingCast;delete s.conversationRecords;delete s.npcAutonomyRecords;delete s.npcDangerRecords; s.npcAutonomyRecords=undefined;s.npcDangerRecords=undefined;
 assert.equal(isPartySave(s),true);
 assert.equal(partyView(s).supportingCast.length,0);
 assert.notEqual(original.fingerprint,adventureFingerprint(compileSelectedAdventure('ridge-survey',quiet).definition));
 assert.equal(partyStep(s,'npc leena-harrow route').accepted,false);
});
test('009-C2: committed local dialogue is deterministic and cannot be duplicated or teleported',()=>{
 const initial=fresh(quiet),snapshot=structuredClone(initial);
 assert.equal(parsePartyAction('talk to leena-harrow about route').kind,'npc');
 const r=partyStep(initial,'talk to leena-harrow about route');
 assert.equal(r.accepted,true,r.reason);
 assert.deepEqual(initial,snapshot);
 const s=r.state;
 assert.equal(s.beat,0,'conversation does not inject a hidden movement or Evolved roll');
 assert.equal(s.rng,initial.rng);
 assert.equal(s.conversationRecords.length,1);
 assert.equal(s.conversationRecords[0].location,'field-camp');
 assert.equal(s.actions.at(-1).kind,'npc');
 assert.equal(isPartySave(s),true);
 assert.equal(partyView(s).supportingCast[0].topics.some(x=>x.id==='route'),false);
 const retry=partyStep(s,'npc leena-harrow route');
 assert.equal(retry.accepted,false);
 assert.deepEqual(retry.state,s);
 assert.equal(partyStep(s,'npc tomas-wren herd').accepted,false);
});
test('009-C2: physically distant NPC can speak only after travel, no offscreen source knowledge leak',()=>{
 let s=fresh(quiet);
 assert.equal(partyView(s).supportingCast.some(n=>n.id==='tomas-wren'),false);
 s=doAction(s,'move rocky-ascent');
 assert.equal(partyView(s).supportingCast.length,0);
 s=doAction(s,'move survey-ridge');
 assert.equal(partyView(s).supportingCast[0].id,'tomas-wren');
 assert.equal(partyView(s).supportingCast[0].topics.some(t=>t.id==='quiet-sign'),true);
 assert.equal(partyView(s).supportingCast[0].topics.some(t=>t.id==='recent-sign'),false);
 const response=partyStep(s,'npc tomas-wren quiet-sign');
 assert.equal(response.accepted,true,response.reason);
 assert.equal(isPartySave(response.state),true);
 assert.equal(response.state.events.at(-1).actorId,roster[0].id);
});
test('009-C2: seed-conditioned NPC knowledge never fabricates a predator',()=>{
 assert.ok(Number.isInteger(predator)&&Number.isInteger(quiet));
 const s=fresh(predator);
 const atRidge=doAction(doAction(s,'move rocky-ascent'),'move survey-ridge');
 const topics=partyView(atRidge).supportingCast[0].topics.map(t=>t.id);
 assert.ok(topics.includes('recent-sign'));
 assert.ok(!topics.includes('quiet-sign'));
 assert.equal(partyStep(atRidge,'npc tomas-wren quiet-sign').accepted,false);
 assert.equal(partyStep(atRidge,'npc tomas-wren recent-sign').accepted,true);
 assert.equal(atRidge.dinosaurs.some(d=>d.id==='hunter-1'),true,'NPC text cannot create a creature');
});
test('009-C2: evidence-gated questions are inaccessible before objective completion',()=>{
 const s=fresh(quiet);
 assert.equal(partyStep(s,'npc leena-harrow report').accepted,false);
 assert.ok(!partyView(s).supportingCast[0].topics.some(t=>t.id==='report'));
 const fake=structuredClone(s);
 fake.conversationRecords.push({npcId:'leena-harrow',topicId:'report',actorId:s.actors[0].id,location:'field-camp',beat:0});
 fake.actions.push({beat:0,actorId:s.actors[0].id,kind:'npc',target:'leena-harrow:report'});
 assert.equal(isPartySave(fake),false,'forged early conversation must not pass evidence validation');
});
test('009-C2: tampered physical positions, phantom history and unknown NPCs reject as saves',()=>{
 const s=fresh(quiet);
 for(const mutator of [
  x=>x.supportingCast[0].location='survey-ridge',
  x=>x.supportingCast.push({id:'invented',location:'field-camp',status:'present'}),
  x=>x.conversationRecords.push({npcId:'invented',topicId:'route',actorId:x.actors[0].id,location:'field-camp',beat:0}),
  x=>x.conversationRecords.push({npcId:'leena-harrow',topicId:'route',actorId:x.actors[0].id,location:'field-camp',beat:0}),
  x=>x.conversationRecords=[null]
 ]){const bad=structuredClone(s);mutator(bad);assert.equal(isPartySave(bad),false);}
});
test('009-C2: unsupported cast fields, invented triggers and duplicate NPC ids reject at compile time',()=>{
 const original=compileSelectedAdventure('ridge-survey',quiet).definition;
 for(const mutator of [
  x=>x.supportingCast[0].location='fictional-lab',
  x=>x.supportingCast[1].id=x.supportingCast[0].id,
  x=>x.supportingCast[0].topics[0].requires={kind:'objective',id:'fictional'},
  x=>x.supportingCast[0].topics.push({...x.supportingCast[0].topics[0]}),
  x=>x.supportingCast[0].exec='function',
  x=>x.supportingCast[0].topics[0].variant={slot:'phantom',choice:'invented'},
  x=>x.supportingCast[0].topics[0].reply=()=>42
 ]){const bad=structuredClone(original);mutator(bad);assert.throws(()=>compileAdventure(bad,{seed:quiet}),RangeError);}
});
test('009-C2: camera ownership and focus changes do not expose remote NPCs or private motives',()=>{
 let s=fresh(quiet);
 s=setControlMode(s,{mode:'spectator'}).state;
 assert.equal(partyView(s).supportingCast.length,1);
 assert.equal(JSON.stringify(partyView(s)).includes('financial pressure'),false);
 s=setControlMode(s,{mode:'focus',focusedActorId:s.actors[0].id}).state;
 s=setCamera(s,{mode:'actor',actorId:s.actors[0].id}).state;
 assert.equal(isPartySave(s),true);
 const v=partyView(s);
 assert.ok(v.supportingCast[0].topics.some(t=>t.id==='route'));
});
