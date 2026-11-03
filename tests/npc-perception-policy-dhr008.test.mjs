import test from 'node:test';
import assert from 'node:assert/strict';
import {npcPerceivedOptions} from '../src/npc-perception-policy.mjs';
import {makeParty} from '../src/characters.mjs';
import {compileAdventure,adventureBinding} from '../src/adventure-definition.mjs';
import {RIDGE_SURVEY_REV10} from '../adventures/ridge-survey-rev10.mjs';
import {initialSupportingCast} from '../src/adventure-supporting-cast.mjs';
import {newPartyIncident,isPartySave} from '../src/party-engine.mjs';

const fact=(id,kind,source='observed',local=true)=>({id,kind,source,local});
const input=(knownFacts=[],motiveFlags={},legalExits=[])=>({knownFacts,motiveFlags,legalExits});

test('DHR-008: quiet knowledge and all-negative motives never compel an encounter',()=>{
 assert.deepEqual(npcPerceivedOptions(input()),[{kind:'hold'}]);
 assert.deepEqual(npcPerceivedOptions(input([fact('river-shadows','clue')],{},['camp'])),[{kind:'hold'}]);
});
test('DHR-008: witnessed local predator plus self preservation offers only real one-edge exits',()=>{
 const options=npcPerceivedOptions(input([fact('raptor-shape','danger')],
  {selfPreservation:true},['rocky-ascent','field-camp']));
 assert.deepEqual(options,[{kind:'hold'},{kind:'withdraw',to:'field-camp'},
  {kind:'withdraw',to:'rocky-ascent'}]);
 assert.ok(options.every(o=>!('creatureId' in o)&&!('attack' in o)));
});
test('DHR-008: a reported or nonlocal predator cannot become a witnessed danger reaction',()=>{
 for(const source of ['reported','observed']){
  const local=source==='reported';
  assert.deepEqual(npcPerceivedOptions(input([fact('distant-raptor','danger',source,local)],
   {selfPreservation:true},['field-camp'])),[{kind:'hold'}]);
 }
});
test('DHR-008: no legal exit means no manufactured teleport or escape',()=>{
 assert.deepEqual(npcPerceivedOptions(input([fact('raptor-shape','danger')],
  {selfPreservation:true},[])),[{kind:'hold'}]);
});
test('DHR-008: danger without a source-defined self-preservation motive does not impose flight',()=>{
 assert.deepEqual(npcPerceivedOptions(input([fact('raptor-shape','danger')],
  {aidOthers:true},['field-camp'])),[{kind:'hold'}]);
});
test('DHR-008: witnessed distress and clues yield candidates, never free heals or discoveries',()=>{
 assert.deepEqual(npcPerceivedOptions(input([
  fact('injured-guide','distress'),fact('unusual-track','clue')],
  {aidOthers:true,curiosity:true},['camp'])),[
  {kind:'hold'},{kind:'consider_help',factId:'injured-guide'},
  {kind:'consider_inspection',factId:'unusual-track'}]);
});
test('DHR-008: overheard distress, rumored clues and remote help do not authorize local effects',()=>{
 assert.deepEqual(npcPerceivedOptions(input([
  fact('radio-cry','distress','reported',true),
  fact('reported-mark','clue','reported',true),
  fact('other-shore','distress','observed',false)],
  {aidOthers:true,curiosity:true},['camp'])),[{kind:'hold'}]);
});
test('DHR-008: multiple facts and exits have deterministic canonical replay ordering',()=>{
 const facts=[fact('z-clue','clue'),fact('b-help','distress'),
  fact('a-help','distress'),fact('a-clue','clue'),fact('predator','danger')];
 const motives={curiosity:true,selfPreservation:true,aidOthers:true};
 const first=npcPerceivedOptions(input(facts,motives,['ridge','camp']));
 const second=npcPerceivedOptions(input([...facts].reverse(),motives,['camp','ridge']));
 assert.deepEqual(first,second);
 assert.deepEqual(first,[{kind:'hold'},{kind:'withdraw',to:'camp'},
  {kind:'withdraw',to:'ridge'},{kind:'consider_help',factId:'a-help'},
  {kind:'consider_help',factId:'b-help'},
  {kind:'consider_inspection',factId:'a-clue'},
  {kind:'consider_inspection',factId:'z-clue'}]);
});
test('DHR-008: pure computation neither mutates actor inputs nor consumes RNG',()=>{
 const args=input([fact('raptor','danger'),fact('track','clue')],
  {selfPreservation:true,curiosity:true},['camp']);
 const original=structuredClone(args);
 const a=npcPerceivedOptions(args);
 const b=npcPerceivedOptions(args);
 assert.deepEqual(args,original);
 assert.deepEqual(a,b);
 assert.equal(Object.isFrozen(a),true);
 assert.equal(Object.isFrozen(a[0]),true);
 assert.equal('rng' in args,false);
});
test('DHR-008: rejects fabricated perceptual provenance and unknown world effects',()=>{
 for(const bad of [
  input([{...fact('raptor','danger'),source:'omniscient'}],{selfPreservation:true},['camp']),
  input([{...fact('raptor','danger'),local:'yes'}],{},[]),
  input([{...fact('raptor','danger'),forceAttack:true}],{},[]),
  input([fact('raptor','attack')],{},[]),
  input([{id:'raptor',kind:'danger',source:'observed'}],{},[])
 ])assert.throws(()=>npcPerceivedOptions(bad),RangeError);
});
test('DHR-008: rejects invalid motives, extra authority fields and nonboolean permissions',()=>{
 for(const bad of [input([],{selfPreservation:'true'},['camp']),
  input([],{forceFight:true},[]),
  {...input(),hiddenWorld:{raptor:true}},
  input([],{aidOthers:1},[]),
  input([],{curiosity:null},[])])
  assert.throws(()=>npcPerceivedOptions(bad),RangeError);
});
test('DHR-008: rejects duplicate facts, exits and unvalidated exit destinations',()=>{
 for(const bad of [input([fact('raptor','danger'),fact('raptor','clue')]),
  input([],{selfPreservation:true},['camp','camp']),
  input([],{selfPreservation:true},['../hidden']),
  input([],{selfPreservation:true},[null]),
  input([],{selfPreservation:true},[{to:'camp'}])])
  assert.throws(()=>npcPerceivedOptions(bad),RangeError);
});
test('DHR-008: fails closed for missing inputs and excessive collections',()=>{
 for(const bad of [undefined,null,{},[],input(Array(65).fill(fact('x','clue'))),
  input([],{curiosity:true},Array.from({length:33},(_,i)=>'room-'+i))])
  assert.throws(()=>npcPerceivedOptions(bad),RangeError);
});
test('DHR-008: rejects prototypes and callback objects as GM authority',()=>{
 const malicious=Object.assign(Object.create({force:true}),fact('seen','danger'));
 assert.throws(()=>npcPerceivedOptions(input([malicious],{},[])),RangeError);
 assert.throws(()=>npcPerceivedOptions(input([],{curiosity:()=>true},[])),RangeError);
});
test('DHR-008: frozen rev10 old save remains valid and untouched by a standalone policy query',()=>{
 const roster=makeParty({seed:61,size:1,careers:['scientist']});
 const compiled=compileAdventure(RIDGE_SURVEY_REV10,{seed:0});
 const save=newPartyIncident({seed:0,roster,adventureId:'ridge-survey'});
 save.adventureBinding=adventureBinding(compiled);
 save.supportingCast=initialSupportingCast(compiled);
 delete save.npcAutonomyRecords;
 delete save.npcDangerRecords;
 assert.equal(isPartySave(save),true);
 const before=structuredClone(save);
 npcPerceivedOptions(input([fact('visible-mark','clue')],{curiosity:true},['field-camp']));
 assert.deepEqual(save,before);
 assert.equal(isPartySave(save),true);
 assert.equal(save.npcDangerRecords,undefined);
});
