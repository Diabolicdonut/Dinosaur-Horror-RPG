import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {listAdventureDefinitions} from '../src/adventure-catalog.mjs';
import {listHubScenarios,resolveHubLaunchScenario,PROTOTYPE_TO_RUNTIME} from '../src/adventure-hub-catalog.mjs';

test('UI-01: only validated authored catalog choices are launchable; no fictional preview is runnable',()=>{
  const actual=listAdventureDefinitions();
  const cards=listHubScenarios();
  const playable=cards.filter(x=>x.launchable);
  assert.deepEqual(playable.map(x=>x.id),actual.map(x=>x.id));
  assert(playable.every(x=>x.kind==='adventure'&&x.status==='playable'));
  assert(playable.every(x=>Number.isInteger(x.revision)&&x.revision>0));
  assert(playable.every(x=>x.title&&x.teaser&&x.subtitle&&x.tone));
  assert.equal(cards.length,actual.length+4);
  for(const card of cards.filter(x=>!x.launchable)){
    assert.equal(card.kind,'preview');
    assert.equal(card.status,'preview-only');
    assert.equal(card.revision,null);
    assert.match(card.teaser,/not a playable adventure/);
    assert.throws(()=>resolveHubLaunchScenario(card.id),RangeError);
  }
});

test('UI-01: prototype IDs are mapped explicitly to runtime IDs; unimplemented demos are never mapped',()=>{
  const list=listHubScenarios();
  assert.deepEqual(Object.keys(PROTOTYPE_TO_RUNTIME),['storm','count','tidal']);
  for(const [prototype,actual] of Object.entries(PROTOTYPE_TO_RUNTIME)){
    assert(list.some(x=>x.id===actual&&x.artKey===prototype&&x.launchable));
    const resolved=resolveHubLaunchScenario(actual);
    assert.equal(resolved.adventureId,actual);
    assert(Number.isInteger(resolved.revision));
  }
  for(const id of ['research','breach','convoy','custom','custom-generated','preview:research','missing','__proto__',null,{},'']){
    assert.throws(()=>resolveHubLaunchScenario(id),RangeError);
  }
});

test('UI-01: published preview projection contains no raw hidden creature/flag/room manifest state',()=>{
  for(const card of listHubScenarios()){
    assert.deepEqual(Object.keys(card).sort(),
      ['artKey','id','kind','launchable','revision','status','subtitle','teaser','title','tone'].sort());
    const serial=JSON.stringify(card);
    for(const restricted of ['hiddenFacts','initialCreatures','objectives','startingRoster','scenarioMaterial',
      'privateAgenda','secretFlags','variantPick']) assert(!serial.includes(restricted));
    assert(Object.isFrozen(card));
  }
});

test('UI-01: exact supplied standalone hub stays labeled DEMO with no real Worker/API credentials',async()=>{
  const html=await readFile(new URL('../prototypes/Dinosaur_Horror_Adventure_Hub_Cinematic.html',import.meta.url),'utf8');
  assert(html.startsWith('<!doctype html>'));
  assert.match(html,/Adventure Operations Terminal \/\/ Demo/);
  assert.match(html,/dhrpg_hub_demo_v1_/);
  assert.match(html,/dinosaur-horror-hub-demo/);
  assert.match(html,/No real game state resumed/);
  assert(!html.includes('https://api.openai.com'));
  assert(!html.includes('OPENAI_API_KEY'));
  assert(!html.includes('GAME_TOKEN'));
  assert(html.includes('SCENE_ART'));
  assert(html.length>2000000,'reference must retain the supplied embedded cinematic art');
});
