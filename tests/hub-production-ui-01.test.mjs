import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {hubArtPath,hubSelection,hubCardsForView} from '../src/hub-app.mjs';
import {listHubScenarios,resolveHubLaunchScenario} from '../src/adventure-hub-catalog.mjs';
import {listAdventureDefinitions} from '../src/adventure-catalog.mjs';

const read=path=>readFile(new URL(path,import.meta.url),'utf8');

test('UI-01: production browser shell exists with all navigation and safely independent old entrypoints',async()=>{
  const html=await read('../hub.html');
  for(const tab of ['home','adventures','campaigns','saves','characters','settings'])
    assert.match(html,new RegExp('data-nav="'+tab+'"'));
  for(const anchor of ['id="hub-carousel"','id="featured-art"','id="feature-availability"',
    'id="enter-engine"','id="reduce-motion"','id="save-detection"'])
    assert(html.includes(anchor));
  assert.match(html,/src="\.\/src\/hub-app\.mjs"/);
  assert.match(html,/id="hub-mode"/);
  assert.match(html,/id="hub-seed"/);
  assert.match(html,/id="hub-length"/);
  assert.match(html,/id="hub-weather"/);
  assert.match(html,/id="hub-tone"/);
  assert.match(html,/Existing incident saves are still loaded and validated in the Party Engine/);
  for(const path of ['../index.html','../party.html','../characters.html'])
    assert((await stat(new URL(path,import.meta.url))).isFile());
  assert(!/<meta[^>]+http-equiv=["']refresh/i.test(html),'No forced legacy redirect');
});

test('UI-01: seven approved cinematic stills are actual reuse-ready JPEG files',async()=>{
  for(const key of ['storm','count','tidal','research','breach','convoy','custom']){
    const path=new URL('../'+hubArtPath(key).replace(/^\.\//,''),import.meta.url);
    const bytes=await readFile(path);
    assert(bytes.length>40000,key+' should contain the real supplied still');
    assert.equal(bytes[0],0xff);
    assert.equal(bytes[1],0xd8);
    assert.equal(bytes[2],0xff);
  }
  for(const bad of ['../../secrets','anything','',null,{},'storm/../../x'])
    assert.equal(hubArtPath(bad),'./assets/hub/custom.jpg');
});

test('UI-01: production Hub shows only authentic adventures as runnable and preview cards as unlaunchable',()=>{
  const cards=hubCardsForView('home');
  const actual=listAdventureDefinitions();
  assert.deepEqual(cards.map(x=>x.id),listHubScenarios().map(x=>x.id));
  assert.deepEqual(cards.filter(x=>x.launchable).map(x=>x.id),actual.map(x=>x.id));
  for(const card of cards){
    const visible=hubSelection(card.id);
    assert.equal(visible?.id,card.id);
    if(card.launchable){
      assert.deepEqual(visible.target,resolveHubLaunchScenario(card.id));
    }else{
      assert.equal(visible.target,null);
      assert.match(visible.teaser,/not a playable adventure/);
      assert.throws(()=>resolveHubLaunchScenario(card.id),RangeError);
    }
  }
  assert.equal(hubSelection('storm'),null,'Prototype identity cannot silently become a real scenario');
  assert.equal(hubSelection('__proto__'),null);
  assert.deepEqual(hubCardsForView('campaigns'),[]);
});

test('UI-01: Hub logic cannot mutate Party save state or expose hidden adventure data',async()=>{
  const client=await read('../src/hub-app.mjs');
  assert(!client.includes('localStorage.setItem('));
  assert(!client.includes('localStorage.removeItem('));
  assert(!client.includes('JSON.parse('));
  assert(!client.includes('newPartyIncident('));
  assert(!client.includes('upgradePartySave('));
  assert(!client.includes('dhrpg_hub_demo_v1_'));
  const html=await read('../hub.html');
  assert(!html.includes('GAME_TOKEN'));
  assert(!html.includes('OPENAI_API_KEY'));
  assert(!html.includes('https://api.openai.com'));
  for(const card of hubCardsForView('home')){
    assert(!Object.hasOwn(card,'initialCreatures'));
    assert(!Object.hasOwn(card,'hiddenFacts'));
    assert(!Object.hasOwn(card,'privateAgenda'));
  }
});
