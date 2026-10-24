import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newPartyIncident,partyView,partyStep,isPartySave} from '../src/party-engine.mjs';
import {sceneForActor,SCENE_THEMES} from '../src/cinematic-scenes.mjs';

const fresh=()=>newPartyIncident({seed:1993});
test('first playable scene frames blackout without spending time, dice or state',()=>{
 const s=fresh(),before=JSON.stringify(s),seed=s.rng;
 const a=sceneForActor(s,s.actors[0]);
 const v=partyView(s,{actorId:s.actors[0].id});
 assert.equal(a.id,'blackout');
 assert.equal(a.title,'Dead Air');
 assert.equal(v.cinematicScene.title,a.title);
 assert.equal(s.rng,seed);
 assert.equal(JSON.stringify(s),before);
 assert.equal(isPartySave(s),true);
});
test('each current island location has a concrete, original scene and open opportunity',()=>{
 const s=fresh(),seen=new Set();
 for(const loc of Object.keys(s.rooms)){
  const actor={...s.actors[0],location:loc};
  const cue=sceneForActor(s,actor);
  assert.equal(typeof cue.title,'string');
  assert(cue.focus.length>18);
  assert(cue.choices.length>10);
  assert(SCENE_THEMES.includes(cue.theme));
  seen.add(cue.id);
 }
 assert.equal(seen.size,Object.keys(s.rooms).length);
});
test('the museum remains wondrous whether or not someone takes its keycard',()=>{
 const s=fresh(),actor={...s.actors[0],location:'lobby'};
 const before=sceneForActor(s,actor);
 assert.equal(before.theme,'wonder');
 s.rooms.lobby.items=[];
 const after=sceneForActor(s,actor);
 assert.equal(after.theme,'wonder');
 assert.notEqual(before.focus,after.focus);
 assert.equal(after.title,before.title);
});
test('completed public objective flags change local scene framing only',()=>{
 const s=fresh();
 const before=JSON.stringify(s),actor=s.actors[0];
 const black=sceneForActor(s,actor);
 const helipadActor={...actor,location:'helipad'};
 const signal=sceneForActor(s,helipadActor);
 assert.equal(signal.id,'helipad');
 assert.equal(JSON.stringify(s),before);
 s.flags.power=true;
 const powered=sceneForActor(s,actor);
 assert.notEqual(black.title,powered.title);
 assert(powered.focus.includes('radio'));
 const ready=sceneForActor(s,helipadActor);
 assert(ready.focus.includes('beacon'));
 s.flags.distress=true;
 const call=sceneForActor(s,actor);
 assert(call.focus.includes('distress call'));
 const beaconReady=sceneForActor(s,helipadActor);
 assert(beaconReady.focus.includes('activated'));
 s.flags.beacon=true;s.outcome='rescued';
 assert(sceneForActor(s,helipadActor).focus.includes('rescue outcome'));
});
test('an approaching dinosaur never causes an omniscient or forced scene claim',()=>{
 const s=fresh(),actor={...s.actors[0],location:'jungle'};
 const before=sceneForActor(s,actor);
 s.dinosaurs[0].location='jungle';
 s.dinosaurs[0].alert=6;
 s.dinosaurs[0].behavior='engage';
 s.dinosaurs[0].lastHeard='jungle';
 assert.deepEqual(sceneForActor(s,actor),before);
 assert(!before.focus.toLowerCase().includes('raptor'));
 assert(!before.choices.toLowerCase().includes('attack'));
});
test('scene framing respects camera selection and never mutates other actor memories',()=>{
 const s=fresh();
 s.actors[1].location='lobby';
 const before=JSON.stringify(s);
 const a=partyView(s,{actorId:s.actors[0].id});
 const b=partyView(s,{actorId:s.actors[1].id});
 assert.equal(a.cinematicScene.id,'blackout');
 assert.equal(b.cinematicScene.id,'visitor-center');
 assert.equal(JSON.stringify(s),before);
});
test('the scene overlay survives save/restore and does not add schema properties',()=>{
 const s=fresh();const serialized=JSON.stringify(s);
 const v=partyView(JSON.parse(serialized));
 assert.equal(v.cinematicScene.id,'blackout');
 assert.equal(JSON.stringify(s),serialized);
 assert(!Object.hasOwn(s,'cinematicScene'));
});
test('player actions still follow one authoritative engine, not cinematic prompts',()=>{
 const s=fresh();
 const result=partyStep(s,'use radio',{actorId:s.actors[0].id});
 assert.equal(result.accepted,false);
 assert.equal(JSON.stringify(result.state),JSON.stringify(s));
 assert.equal(s.rng,result.state.rng);
});
test('browser actually renders character-local scene without new activity or worker',async()=>{
 const html=await readFile(new URL('../party.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8');
 const engine=await readFile(new URL('../src/party-engine.mjs',import.meta.url),'utf8');
 assert(html.includes('src/party-app.mjs?v=008b2'));
 assert(app.includes("scene.push('SCENE"));
 assert(app.includes('v.cinematicScene.focus'));
 assert(engine.includes('cinematicScene:sceneForActor(s,actor)'));
 assert(!app.includes("from './worker/index.mjs"));
});
