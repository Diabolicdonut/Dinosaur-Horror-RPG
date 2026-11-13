import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ATTRIBUTES, SKILLS, CAREER_IDS, generateCharacter, makeParty,
  validateCharacter, validateParty, editCharacter, characterToSave
} from '../src/characters.mjs';
import {newPartyIncident, isPartySave} from '../src/party-engine.mjs';
import {setControlMode} from '../src/party-director.mjs';

// DHR-033: source-grounded standard allocation (Evolved Core Concepts, printed pp. 25-27).
// This tests the existing original park-role adaptation, not optional lifepath,
// random-attribute, android, or adventure-defined cinematic gear procedures.
const valid = () => generateCharacter({seed:95033, index:0, career:'ranger'});
const rejects = (character) => assert.notDeepEqual(validateCharacter(character), []);

test('DHR-033: all supported park career starters remain legal, with exact budgets', () => {
  for (const career of CAREER_IDS) {
    const c = generateCharacter({seed:95033,career});
    assert.deepEqual(validateCharacter(c), [], career);
    assert.equal(Object.values(c.attributes).reduce((a,b)=>a+b,0),14);
    assert.equal(Object.values(c.skills).reduce((a,b)=>a+b,0),10);
  }
});

test('DHR-033: attributes reject hidden extra and missing ratings, even with a legal visible budget', () => {
  const withExtra=structuredClone(valid());
  withExtra.attributes.grant=20;
  rejects(withExtra);
  const without=structuredClone(valid());
  delete without.attributes.strength;
  rejects(without);
  const disguised=structuredClone(valid());
  disguised.attributes=Object.assign([],disguised.attributes);
  rejects(disguised);
});

test('DHR-033: skills reject extra, missing, string or boolean ranks in imported drafts', () => {
  const withExtra=structuredClone(valid());
  withExtra.skills.secret_training=4;
  rejects(withExtra);
  const missing=structuredClone(valid());
  delete missing.skills.observation;
  rejects(missing);
  const numericString=structuredClone(valid());
  const k=Object.keys(SKILLS).find(k=>numericString.skills[k]>0);
  numericString.skills[k]=String(numericString.skills[k]);
  rejects(numericString);
  const booleanRank=structuredClone(valid());
  const other=Object.keys(SKILLS).find(k=>booleanRank.skills[k]===0);
  booleanRank.skills[other]=false;
  rejects(booleanRank);
});

test('DHR-033: numeric string attribute and inherited attribute allotments cannot masquerade as legal', () => {
  const stringRank=structuredClone(valid());
  stringRank.attributes.wits=String(stringRank.attributes.wits);
  rejects(stringRank);
  const inherited=structuredClone(valid());
  inherited.attributes=Object.create(inherited.attributes);
  rejects(inherited);
});

test('DHR-033: prototype-named forged careers fail gracefully without throwing', () => {
  for (const career of ['__proto__','constructor','toString','not-a-career']) {
    const c={...valid(), career};
    assert.doesNotThrow(()=>validateCharacter(c),career);
    rejects(c);
    assert.throws(()=>generateCharacter({seed:1,career}),RangeError,career);
    assert.throws(()=>makeParty({seed:1,size:1,careers:[career]}),RangeError,career);
  }
});

test('DHR-033: forged explicit roster career lists never become randomized valid characters', () => {
  assert.throws(()=>makeParty({seed:1,size:2,careers:'ranger'}),RangeError);
  assert.throws(()=>makeParty({seed:1,size:2,careers:['ranger','pilot','medic']}),RangeError);
  assert.deepEqual(validateParty(makeParty({seed:1,size:2,careers:['ranger',null]})),[]);
});

test('DHR-033: no unauthorized starting talent, gear, over-budget edits or fake locked allocation', () => {
  const base=valid();
  const forged=structuredClone(base);
  forged.talent='Made-up expertise';
  rejects(forged);
  const duplicate=structuredClone(base);
  duplicate.gear=[base.gear[0],base.gear[0]];
  rejects(duplicate);
  const tooMany=structuredClone(base);
  tooMany.gear.push('satellite phone');
  rejects(tooMany);
  const over=editCharacter(base,{skills:{observation:10}});
  rejects(over);
  const badLock=structuredClone(base);
  badLock.skills.observation='3';
  assert.throws(()=>generateCharacter({
    seed:10,index:0,career:'ranger',existing:badLock,locks:['skills.observation']
  }),RangeError);
});

test('DHR-033: manual drafts without generator metadata and hybrid replay remain legal', () => {
  const base=valid();
  const manual=structuredClone(base);
  delete manual.generation;
  manual.creationMethod='manual';
  assert.deepEqual(validateCharacter(manual),[]);
  assert.deepEqual(characterToSave(manual),manual);
  const original=generateCharacter({seed:95,index:2,career:'scientist'});
  const opts={seed:95,index:2,revision:3,career:'scientist',existing:original,
    locks:['career','attributes.wits','skills.observation','talent','gear']};
  const a=generateCharacter(opts),b=generateCharacter(opts);
  assert.deepEqual(a,b);
  assert.equal(a.talent,original.talent);
  assert.deepEqual(a.gear,original.gear);
  assert.deepEqual(validateCharacter(a),[]);
});

test('DHR-033: importing legal starter roster does not change control modes or historical Party-save contract', () => {
  const roster=makeParty({seed:95,size:3,careers:['ranger','medic','scientist']});
  for (const mode of ['party','focus','spectator']) {
    const initial=newPartyIncident({seed:95,roster});
    const transitioned=setControlMode(initial,{mode,focusedActorId:roster[1].id}).state;
    assert.equal(isPartySave(transitioned),true,mode);
    assert.deepEqual(transitioned.startingRoster,roster);
    assert.deepEqual(transitioned.actors.map(a=>a.attributes),roster.map(c=>c.attributes));
    assert.deepEqual(transitioned.actors.map(a=>a.skills),roster.map(c=>c.skills));
  }
  const forged=newPartyIncident({seed:95,roster});
  forged.startingRoster[0].skills.unearned=5;
  assert.equal(isPartySave(forged),false);
});
