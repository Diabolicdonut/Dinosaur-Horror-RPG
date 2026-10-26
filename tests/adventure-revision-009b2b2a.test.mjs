import test from 'node:test';
import assert from 'node:assert/strict';
import {RIDGE_SURVEY_REV1} from '../adventures/ridge-survey-rev1.mjs';
import {compileAdventure,adventureBinding,adventureFingerprint} from '../src/adventure-definition.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,isPartySave,partyView,partyStep} from '../src/party-engine.mjs';

const roster=makeParty({seed:911,size:1,careers:['scientist']});
const chosen=Array.from({length:120},(_,i)=>i)
 .find(seed=>compileSelectedAdventure('ridge-survey',seed).hiddenFacts.researchObstacle.fact==='flood');
const fresh=()=>newPartyIncident({adventureId:'ridge-survey',seed:chosen,roster});

test('009-B2b2a: seeded mechanics remain available on immutable newer authored revisions',()=>{
 const current=fresh();
 assert.equal(current.adventureBinding.revision,10);
 assert.equal(isPartySave(current),true);
 const original=compileAdventure(RIDGE_SURVEY_REV1,{seed:chosen});
 assert.equal(original.revision,1);
 assert.equal(original.fingerprint,adventureFingerprint(RIDGE_SURVEY_REV1));
 assert.notEqual(current.adventureBinding.fingerprint,original.fingerprint);
});
test('009-B2b2a: genuine historical revision 1 Party saves retain original fingerprint and encounter behavior',()=>{
 const old=fresh();
 old.adventureBinding=adventureBinding(compileAdventure(RIDGE_SURVEY_REV1,{seed:chosen}));
 assert.equal(isPartySave(old),true);
 const copy=JSON.parse(JSON.stringify(old));
 assert.equal(partyView(copy).sceneConsequences.length,0);
 let s=partyStep(copy,'move river-crossing').state;
 assert.equal(isPartySave(s),true);
 const rngBefore=s.rng;
 const move=partyStep(s,'move forest-blind');
 assert.equal(move.accepted,true);
 assert.equal(move.state.actors[0].location,'forest-blind');
 assert.equal(move.state.rng,rngBefore,'historical harmless ford cannot suddenly require a new skill roll');
 assert.equal(isPartySave(move.state),true);
});
test('009-B2b2a: historical actor gets only original peaceful wildlife option',()=>{
 let old=fresh();
 old.adventureBinding=adventureBinding(compileAdventure(RIDGE_SURVEY_REV1,{seed:chosen}));
 old=partyStep(old,'move rocky-ascent').state;
 old=partyStep(old,'move survey-ridge').state;
 assert.deepEqual(partyView(old).wildlifeEncounter.choices.map(x=>x.id),['watch']);
 const denied=partyStep(old,'wildlife approach');
 assert.equal(denied.accepted,false);
 assert.strictEqual(denied.state,old);
});
test('009-B2b2a: mismatched revision and bound content cannot be substituted',()=>{
 const current=fresh();
 const legacy=structuredClone(current);
 legacy.adventureBinding=adventureBinding(compileAdventure(RIDGE_SURVEY_REV1,{seed:chosen}));
 assert.equal(isPartySave(legacy),true);
 const forged=structuredClone(legacy);forged.adventureBinding.fingerprint=current.adventureBinding.fingerprint;
 assert.equal(isPartySave(forged),false);
 const forged2=structuredClone(current);forged2.adventureBinding.revision=1;
 assert.equal(isPartySave(forged2),false);
});
