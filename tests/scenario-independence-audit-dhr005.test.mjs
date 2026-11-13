// DHR-005 audit guard: locks *existing* generic seams, not a claim of universal runtime parity.
// These tests make no changes to legacy saves, Evolved dice, scenario mechanics or UI.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {compileAdventure} from '../src/adventure-definition.mjs';
import {createAdventureWorld} from '../src/adventure-world.mjs';
import {newPartyIncident,isPartySave} from '../src/party-engine.mjs';
import {setControlMode} from '../src/party-director.mjs';
import {makeParty} from '../src/characters.mjs';
import {RIDGE_SURVEY_REV1} from '../adventures/ridge-survey-rev1.mjs';
import {TIDAL_NURSERY as TIDAL_NURSERY_REV1} from '../adventures/tidal-nursery-rev1.mjs';

const genericModules=[
 'src/adventure-definition.mjs',
 'src/adventure-world.mjs',
 'src/adventure-objectives.mjs',
 'src/adventure-creatures.mjs',
 'src/adventure-situations.mjs',
 'src/adventure-scenario-material.mjs',
 'src/adventure-perils.mjs'
];

test('DHR-005: already-generic core does not import a scenario singleton or authored adventures',()=>{
 for(const path of genericModules){
  const code=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  assert.doesNotMatch(code,/\bfrom\s*['"][^'"]*(?:\/adventures\/|\/scenario\.mjs)|\bimport\s*\(\s*['"][^'"]*(?:\/adventures\/|\/scenario\.mjs)/,
   path+' must receive compiled content, not import named setting data');
 }
});

test('DHR-005: two distinct selected adventure maps remain isolated, not the Nublar layout',()=>{
 const research=createAdventureWorld(compileSelectedAdventure('ridge-survey',21));
 const tidal=createAdventureWorld(compileSelectedAdventure('tidal-nursery',21));
 assert.equal(research.start,'field-camp');
 assert.equal(tidal.start,'supply-shelter');
 assert.equal(research.hasRoom('nesting-pool'),false);
 assert.equal(tidal.hasRoom('survey-ridge'),false);
 assert.equal(research.resolveExit('field-camp','rocky-ascent'),'rocky-ascent');
 assert.equal(tidal.resolveExit('supply-shelter','reed-walk'),'reed-walk');
 assert.equal(research.itemLabel('field-notes'),'Survey notebooks');
 assert.equal(tidal.itemLabel('sample-case'),'Waterproof sample case');
 const altered=research.room('field-camp');
 altered.exits.push('teleport');
 assert.equal(research.room('field-camp').exits.includes('teleport'),false);
});

test('DHR-005: frozen historical source revisions remain distinct from current compilation',()=>{
 const ridgeOld=compileAdventure(RIDGE_SURVEY_REV1,{seed:7});
 const ridgeNew=compileSelectedAdventure('ridge-survey',7);
 const tidalOld=compileAdventure(TIDAL_NURSERY_REV1,{seed:7});
 const tidalNew=compileSelectedAdventure('tidal-nursery',7);
 assert.equal(ridgeOld.definition.revision,1);
 assert.equal(tidalOld.definition.revision,1);
 assert.equal(ridgeNew.definition.revision,13);
 assert.equal(tidalNew.definition.revision,2);
 assert.notEqual(ridgeOld.fingerprint,ridgeNew.fingerprint);
 assert.notEqual(tidalOld.fingerprint,tidalNew.fingerprint);
});

test('DHR-005: three control ownership modes preserve selected-adventure RNG and clock on switch',()=>{
 for(const adventureId of ['ridge-survey','tidal-nursery']){
  const roster=makeParty({seed:71,size:2});
  const initial=newPartyIncident({seed:71,roster,adventureId});
  assert.equal(isPartySave(initial),true);
  const focus=setControlMode(initial,{mode:'focus',focusedActorId:roster[1].id});
  assert.equal(focus.accepted,true);
  assert.equal(isPartySave(focus.state),true);
  const spectator=setControlMode(focus.state,{mode:'spectator'});
  assert.equal(spectator.accepted,true);
  assert.equal(isPartySave(spectator.state),true);
  assert.equal(initial.control.mode,'party');
  assert.equal(focus.state.control.mode,'focus');
  assert.equal(spectator.state.control.mode,'spectator');
  assert.equal(spectator.state.rng,initial.rng);
  assert.deepEqual(spectator.state.clock,initial.clock);
  assert.deepEqual(spectator.state.actions,initial.actions);
 }
});
