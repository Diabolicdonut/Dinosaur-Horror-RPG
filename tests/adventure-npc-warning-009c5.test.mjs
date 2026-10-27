import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {compileAdventure,adventureBinding} from '../src/adventure-definition.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {RIDGE_SURVEY_REV12} from '../adventures/ridge-survey-rev12.mjs';
import {newPartyIncident,isPartySave,partyStep,partyView} from '../src/party-engine.mjs';
import {initialSupportingCast} from '../src/adventure-supporting-cast.mjs';
import {setControlMode} from '../src/party-director.mjs';

const roster=makeParty({seed:61,size:1,careers:['scientist']});
const fresh=seed=>newPartyIncident({seed,roster,adventureId:'ridge-survey'});
const choose=condition=>Array.from({length:700},(_,i)=>i).find(seed=>condition(seed));
const variant=(seed,name)=>compileSelectedAdventure('ridge-survey',seed).hiddenFacts.predatorPresence.id===name;
const round=s=>{const x=partyStep(s,'wait');assert.equal(x.accepted,true,x.reason);return x.state;};
const seen=choose(seed=>variant(seed,'raptor-territory')&&
 round(fresh(seed)).npcDangerRecords[0]?.action==='withdraw');
const held=choose(seed=>variant(seed,'raptor-territory')&&
 round(fresh(seed)).npcDangerRecords[0]?.action==='hold');
const quiet=choose(seed=>variant(seed,'quiet-range'));

test('009-C5: revision13 accepts a strictly sighting-conditioned NPC topic',()=>{
 const def=compileSelectedAdventure('ridge-survey',seen);
 assert.equal(def.revision,13);
 const jules=def.definition.supportingCast.find(x=>x.id==='jules-marsh');
 assert.deepEqual(jules.topics.find(x=>x.id==='raptor-warning').requires,
   {kind:'npc_sighting',id:'jules-marsh'});
 assert.equal(isPartySave(fresh(seen)),true);
});
test('009-C5: a possible predator is not NPC-earned sighting or player-visible dialogue',()=>{
 const before=fresh(seen);
 assert.equal(partyView(before).supportingCast.some(x=>x.id==='jules-marsh'),false);
 assert.equal(partyStep(before,'npc jules-marsh raptor-warning').accepted,false);
 const noContact=round(fresh(quiet));
 assert.equal(noContact.npcDangerRecords.length,0);
 assert.equal(partyStep(noContact,'npc jules-marsh raptor-warning').accepted,false);
 assert.equal(isPartySave(noContact),true);
});
test('009-C5: physically arrived NPC only warns after their own real detected predator',()=>{
 const pre=fresh(seen);
 const s=round(pre);
 const jules=s.supportingCast.find(x=>x.id==='jules-marsh');
 assert.equal(jules.location,'field-camp');
 assert.equal(s.npcDangerRecords[0].action,'withdraw');
 assert.ok(partyView(s).supportingCast.find(x=>x.id==='jules-marsh').topics.some(t=>t.id==='raptor-warning'));
 const result=partyStep(s,'npc jules-marsh raptor-warning');
 assert.equal(result.accepted,true,result.reason);
 assert.equal(result.state.beat,s.beat);
 assert.equal(result.state.rng,s.rng);
 assert.equal(result.state.conversationRecords.at(-1).topicId,'raptor-warning');
 assert.ok(result.state.events.at(-1).message.includes('I saw a predatory animal'));
 assert.equal(isPartySave(result.state),true);
 assert.equal(partyStep(result.state,'npc jules-marsh raptor-warning').accepted,false);
});
test('009-C5: failed or tied Evolved NPC awareness never unlocks eyewitness testimony',()=>{
 const s=round(fresh(held));
 assert.equal(s.npcDangerRecords[0].action,'hold');
 const fake=structuredClone(s);
 fake.supportingCast.find(x=>x.id==='jules-marsh').location='field-camp';
 assert.equal(isPartySave(fake),false);
 assert.equal(partyStep(s,'npc jules-marsh raptor-warning').accepted,false);
 assert.ok(!s.conversationRecords.length);
});
test('009-C5: a forged old sighting or testimony timing cannot pass save validation',()=>{
 const s=round(fresh(seen));
 const valid=partyStep(s,'npc jules-marsh raptor-warning');
 assert.equal(valid.accepted,true);
 const good=valid.state;
 for(const mutate of [
  x=>{x.conversationRecords.at(-1).beat=0;},
  x=>{x.conversationRecords.at(-1).location='river-crossing';},
  x=>{x.npcDangerRecords[0].awareness='simultaneous';},
  x=>{x.npcDangerRecords[0].action='hold';},
  x=>{x.conversationRecords.at(-1).npcId='tomas-wren';}
 ]){const bad=structuredClone(good);mutate(bad);assert.equal(isPartySave(bad),false);}
});
test('009-C5: only first-party danger eyewitness is a valid authoring condition',()=>{
 const source=compileSelectedAdventure('ridge-survey',seen).definition;
 for(const mutate of [
  x=>x.supportingCast[1].topics.find(t=>t.id==='raptor-warning').requires.id='tomas-wren',
  x=>x.supportingCast[1].topics.find(t=>t.id==='raptor-warning').requires.kind='invented',
  x=>x.supportingCast[0].topics.push({id:'secret',prompt:'secret',reply:'fake',requires:{kind:'npc_sighting',id:'leena-harrow'}}),
  x=>x.supportingCast[1].topics.find(t=>t.id==='raptor-warning').requires={kind:'npc_sighting',id:'jules-marsh',teleport:true}
 ]){const bad=structuredClone(source);mutate(bad);assert.throws(()=>compileAdventure(bad,{seed:seen}),RangeError);}
});
test('009-C5: rev12 save and source fingerprint remain exactly as previously accepted',()=>{
 const old=compileAdventure(RIDGE_SURVEY_REV12,{seed:seen});
 let s=fresh(seen);
 s.adventureBinding=adventureBinding(old);
 assert.equal(isPartySave(s),true);
 s=round(s);
 assert.equal(isPartySave(s),true);
 assert.equal(s.adventureBinding.revision,12);
 const jules=s.supportingCast.find(x=>x.id==='jules-marsh');
 assert.equal(jules.location,'field-camp');
 assert.equal(partyView(s).supportingCast.find(x=>x.id==='jules-marsh').topics.some(t=>t.id==='raptor-warning'),false);
 assert.equal(partyStep(s,'npc jules-marsh raptor-warning').accepted,false);
});
test('009-C5: control mode changes do not invent NPC knowledge or spend time',()=>{
 let s=fresh(seen);
 const start=s.rng;
 s=setControlMode(s,{mode:'spectator'}).state;
 s=setControlMode(s,{mode:'focus',focusedActorId:s.actors[0].id}).state;
 assert.equal(s.beat,0);assert.equal(s.rng,start);
 assert.equal(partyStep(s,'npc jules-marsh raptor-warning').accepted,false);
 assert.equal(isPartySave(s),true);
});
