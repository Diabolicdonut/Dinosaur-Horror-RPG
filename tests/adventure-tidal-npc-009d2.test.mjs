import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {listAdventureDefinitions,compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {compileAdventure,adventureBinding} from '../src/adventure-definition.mjs';
import {TIDAL_NURSERY as HISTORICAL_TIDAL_NURSERY} from '../adventures/tidal-nursery-rev1.mjs';
import {newPartyIncident,isPartySave,partyView,partyStep} from '../src/party-engine.mjs';
import {setControlMode,runAutonomousTurn} from '../src/party-director.mjs';

const roster=makeParty({seed:710,size:1,careers:['scientist']});
const start=seed=>newPartyIncident({adventureId:'tidal-nursery',seed,roster});
function move(s,target){
 const r=partyStep(s,'move '+target);
 assert.equal(r.accepted,true,r.reason);
 return r.state;
}
function atPool(seed){
 return move(move(start(seed),'signal-knoll'),'nesting-pool');
}
function collect(s){
 for(let i=0;i<80;i++){
  const r=partyStep(s,'use migration readings');
  assert.equal(r.accepted,true,r.reason);
  s=r.state;
  if(s.flags.samplesSecured)return s;
 }
 assert.fail('A source Evolved Observation success must eventually allow collection.');
}
test('009-D2: estuary rev2 contains only source-local NPCs, with an independent authored route',()=>{
 const c=compileSelectedAdventure('tidal-nursery',21);
 assert.equal(c.revision,2);
 assert.equal(listAdventureDefinitions().find(x=>x.id==='tidal-nursery').revision,2);
 assert.deepEqual(c.definition.supportingCast.map(n=>n.id),['mara-venn','ivo-pell']);
 assert.deepEqual(c.definition.supportingCast[1].autonomy.path,
  ['nesting-pool','reed-walk','supply-shelter']);
 assert.notEqual(c.fingerprint,compileAdventure(HISTORICAL_TIDAL_NURSERY,{seed:21}).fingerprint);
});
test('009-D2: nearby NPC dialogue is committed with no invented roll, teleport or exploration time',()=>{
 const initial=start(9);
 assert.equal(isPartySave(initial),true);
 assert.deepEqual(partyView(initial).supportingCast.map(n=>n.id),['mara-venn']);
 const talk=partyStep(initial,'talk to mara-venn about routes');
 assert.equal(talk.accepted,true,talk.reason);
 const s=talk.state;
 assert.equal(s.beat,initial.beat);
 assert.equal(s.clock.explorationActions,0);
 assert.equal(s.conversationRecords.length,1);
 assert.equal(s.conversationRecords[0].location,'supply-shelter');
 assert.ok(!partyView(s).supportingCast[0].topics.some(t=>t.id==='routes'));
 assert.equal(isPartySave(s),true);
 assert.equal(partyStep(s,'talk to mara-venn about routes').accepted,false);
});
test('009-D2: distant NPCs cannot provide knowledge or be spoken with remotely',()=>{
 const source=start(10);
 assert.equal(partyStep(source,'talk to ivo-pell about herd').accepted,false);
 assert.equal(partyView(source).supportingCast.some(n=>n.id==='ivo-pell'),false);
 const at=atPool(10);
 assert.deepEqual(partyView(at).supportingCast.map(n=>n.id),['ivo-pell']);
 assert.equal(partyView(at).supportingCast[0].topics.some(t=>t.id==='observations'),false);
 const response=partyStep(at,'talk to ivo-pell about herd');
 assert.equal(response.accepted,true,response.reason);
 assert.equal(isPartySave(response.state),true);
});
test('009-D2: objective-dependent statements remain unavailable before their evidence is earned',()=>{
 const initial=start(12);
 assert.equal(partyView(initial).supportingCast[0].topics.some(t=>t.id==='safe-return'),false);
 assert.equal(partyStep(initial,'talk to mara-venn about safe-return').accepted,false);
 const at=atPool(12);
 assert.equal(partyStep(at,'talk to ivo-pell about observations').accepted,false);
 const result=collect(at);
 assert.equal(result.flags.samplesSecured,true);
 assert.ok(result.objectiveRecords.some(r=>r.id==='recover-samples'));
 assert.equal(isPartySave(result),true);
});
test('009-D2: NPC returns through physical adjacent rooms only after a completed objective',()=>{
 let s=atPool(19);
 assert.equal(s.supportingCast.find(n=>n.id==='ivo-pell').location,'nesting-pool');
 s=partyStep(s,'wait').state;
 assert.deepEqual(s.npcAutonomyRecords,[]);
 s=collect(s);
 const history=s.npcAutonomyRecords;
 assert.ok(history.some(r=>r.from==='nesting-pool'&&r.to==='reed-walk'));
 assert.equal(s.supportingCast.find(n=>n.id==='ivo-pell').location,'reed-walk');
 assert.equal(isPartySave(s),true);
 s=move(s,'reed-walk');
 assert.deepEqual(s.npcAutonomyRecords.map(r=>r.to),['reed-walk','supply-shelter']);
 assert.equal(s.supportingCast.find(n=>n.id==='ivo-pell').location,'supply-shelter');
 assert.equal(isPartySave(s),true);
 s=move(s,'supply-shelter');
 assert.ok(partyView(s).supportingCast.some(n=>n.id==='ivo-pell'));
});
test('009-D2: fabricated dialogues, source routes and missing replay records invalidate saves',()=>{
 const baseline=start(17);
 const forged=structuredClone(baseline);
 forged.conversationRecords.push({npcId:'mara-venn',topicId:'safe-return',
  actorId:forged.actors[0].id,location:'supply-shelter',beat:0});
 assert.equal(isPartySave(forged),false);
 const remote=structuredClone(baseline);
 remote.supportingCast[1].location='supply-shelter';
 assert.equal(isPartySave(remote),false);
 const reached=collect(atPool(17));
 assert.ok(reached.npcAutonomyRecords.length);
 const wrongMove=structuredClone(reached);
 wrongMove.npcAutonomyRecords[0].to='signal-knoll';
 assert.equal(isPartySave(wrongMove),false);
 const missing=structuredClone(reached);
 missing.npcAutonomyRecords=[];
 assert.equal(isPartySave(missing),false);
 assert.equal(isPartySave(reached),true);
});
test('009-D2: frozen estuary rev1 fingerprint, stock, quiet play and old save identity survive',()=>{
 const seed=23,now=start(seed),old=structuredClone(now);
 old.adventureBinding=adventureBinding(compileAdventure(HISTORICAL_TIDAL_NURSERY,{seed}));
 delete old.supportingCast;
 delete old.conversationRecords;
 delete old.npcAutonomyRecords;
 assert.equal(old.adventureBinding.revision,1);
 assert.equal(isPartySave(old),true,'rev1 uses its exact frozen source');
 assert.deepEqual(partyView(old).supportingCast,[]);
 assert.equal(isPartySave(move(old,'signal-knoll')),true);
 assert.equal(isPartySave(now),true);
 assert.equal(isPartySave({...old,adventureBinding:now.adventureBinding}),false);
});
test('009-D2: independent-source NPC fields coexist with Party, Focus and Spectator modes',()=>{
 let s=start(13);
 s=setControlMode(s,{mode:'focus',focusedActorId:s.actors[0].id}).state;
 assert.equal(isPartySave(s),true);
 s=setControlMode(s,{mode:'spectator'}).state;
 assert.equal(isPartySave(s),true);
 const r=runAutonomousTurn(s,{singleStep:true});
 assert.equal(r.accepted,true,r.reason);
 assert.equal(isPartySave(r.state),true);
 assert.equal(r.state.adventureBinding.revision,2);
});
