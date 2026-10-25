import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdventureWorld} from '../src/adventure-world.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {SCENARIO} from '../src/scenario.mjs';
import {newPartyIncident,isPartySave,partyView,partyStep} from '../src/party-engine.mjs';
const storm=()=>createAdventureWorld(compileSelectedAdventure('nublar-after-the-storm',0));
const ridge=()=>createAdventureWorld(compileSelectedAdventure('ridge-survey',42));

test('009-B1: Nublar map and starter equipment project exactly from the accepted scenario',()=>{
 const w=storm();
 assert.equal(w.start,SCENARIO.start);
 assert.deepEqual(w.startItems,SCENARIO.startItems);
 assert.deepEqual(w.initialRoomItems(),Object.fromEntries(Object.entries(SCENARIO.rooms).map(
  ([id,room])=>[id,{items:[...room.items]}])));
 for(const [id,room]of Object.entries(SCENARIO.rooms)){
  assert.equal(w.roomName(id),room.name);
  assert.equal(w.room(id).description,room.description);
  assert.deepEqual(w.room(id).exits,room.exits);
 }
});

test('009-B1: both map graphs use identical pathfinder without named zones',()=>{
 assert.equal(storm().distance('control','helipad'),4);
 assert.equal(storm().stepToward('control','helipad'),'utility');
 assert.equal(ridge().distance('field-camp','forest-blind'),2);
 assert.equal(ridge().stepToward('field-camp','forest-blind'),'river-crossing');
 assert.equal(ridge().distance('rocky-ascent','rocky-ascent'),0);
});

test('009-B1: exit matching respects physical adjacency and scenario-specific aliases',()=>{
 assert.equal(storm().resolveExit('control','to the service corridor'),'utility');
 assert.equal(storm().resolveExit('control','jungle'),null);
 assert.equal(ridge().resolveExit('field-camp','tents'),null);
 assert.equal(ridge().resolveExit('field-camp','the rocky ascent'),'rocky-ascent');
 assert.equal(ridge().resolveExit('forest-blind','ford'),'river-crossing');
});

test('009-B1: item display names and physical room inventories vary by manifest',()=>{
 assert.equal(storm().itemLabel('keycard'),SCENARIO.itemNames.keycard);
 assert.equal(ridge().itemLabel('field-radio'),'Portable short-range radio');
 assert.deepEqual(ridge().initialRoomItems()['survey-ridge'].items,['lens-kit']);
 assert.ok(!ridge().hasRoom('helipad'));
 assert.equal(ridge().room('helipad'),null);
});

test('009-B1: external mutation cannot change protected room state or item stock',()=>{
 const w=ridge(),rooms=w.initialRoomItems();
 rooms['field-camp'].items.push('forged-item');
 const room=w.room('field-camp');
 room.exits.push('helipad');room.aliases.push('backdoor');
 assert.deepEqual(w.initialRoomItems()['field-camp'].items,['field-notes']);
 assert.equal(w.resolveExit('field-camp','backdoor'),null);
 assert.equal(w.room('field-camp').exits.includes('helipad'),false);
 assert.equal(Object.isFrozen(w.startItems),true);
});

test('009-B1: invalid or modified compiled manifest cannot instantiate a world',()=>{
 const good=compileSelectedAdventure('ridge-survey',42);
 const forged=structuredClone(good);
 forged.definition.rooms['field-camp'].description='Changed after compilation';
 assert.throws(()=>createAdventureWorld(forged),RangeError);
 assert.throws(()=>createAdventureWorld({}),RangeError);
});

test('009-B1: generic world services do not read or alter hidden variant choices',()=>{
 const a=compileSelectedAdventure('ridge-survey',42);
 const w=createAdventureWorld(a);
 const variants=structuredClone(a.hiddenFacts);
 assert.equal(w.distance('field-camp','survey-ridge'),2);
 w.room('survey-ridge').items.push('fake');
 assert.deepEqual(a.hiddenFacts,variants);
 assert.equal(w.itemLabel('unknown-id'),'unknown-id');
});

test('009-B1: After the Storm still begins, saves, views, and moves identically',()=>{
 const incident=newPartyIncident({seed:2468});
 assert.equal(isPartySave(incident),true);
 assert.equal(incident.actors[0].location,SCENARIO.start);
 assert.deepEqual(incident.rooms,storm().initialRoomItems());
 assert.equal(partyView(incident).roomName,SCENARIO.rooms.control.name);
 const moved=partyStep(incident,'move utility');
 assert.equal(moved.accepted,true);
 assert.equal(moved.state.actors[0].location,'utility');
 assert.equal(partyView(moved.state).roomName,SCENARIO.rooms.utility.name);
 assert.equal(isPartySave(moved.state),true);
});
