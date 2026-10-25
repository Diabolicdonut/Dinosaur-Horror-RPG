import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newPartyIncident,partyStep,partyView,isPartySave,upgradePartySave} from '../src/party-engine.mjs';
import {weatherAt,serviceShutterClosed,shutterBlocks,sightContext,outdoorWeather} from '../src/dinosaur-environment.mjs';
import {visualLine} from '../src/dinosaur-visibility.mjs';
import {exitsForCreature,creatureRoute,hearNoise,visibleLampZone} from '../src/dinosaur-pursuit.mjs';
import {huntDecision} from '../src/dinosaur-hunt.mjs';
import {beginCombat} from '../src/combat-turns.mjs';
import {raptorAttackPlan} from '../src/dinosaur-encounter.mjs';
import {actorObservation,setControlMode,setCamera} from '../src/party-director.mjs';

const game=()=>newPartyIncident({seed:1993});
const act=(s,cmd)=>partyStep(s,cmd,{actorId:s.actors[s.cursor].id,source:'human'});
test('scripted storm band is pure, finite and measured in exploration stretches',()=>{
 const s=game(),before=JSON.stringify(s),rng=s.rng;
 assert.equal(weatherAt(s),'rain');
 s.clock.explorationStretches=2;
 assert.equal(weatherAt(s),'squall');
 s.clock.explorationStretches=3;assert.equal(weatherAt(s),'squall');
 s.clock.explorationStretches=4;assert.equal(weatherAt(s),'rain');
 assert.equal(s.rng,rng);
 assert.equal(s.actions.length,0);
 assert.notEqual(before,JSON.stringify(s)); // fixture clock only
});
test('rain squall blocks one-zone outdoor silhouettes but not same-zone sight or indoor corridors',()=>{
 assert.equal(visualLine('jungle','helipad'),true);
 assert.equal(visualLine('jungle','helipad',{squall:true}),false);
 assert.equal(visualLine('helipad','jungle',{squall:true}),false);
 assert.equal(visualLine('shed','jungle',{squall:true}),false);
 assert.equal(visualLine('jungle','jungle',{squall:true}),true);
 assert.equal(visualLine('control','lobby',{squall:true}),true);
 assert.equal(visualLine('utility','shed',{squall:true}),false);
});
test('storm sight reduction does not block traversable roads, reset clocks or damp sound',()=>{
 const s=game(),d=s.dinosaurs[0];s.clock.explorationStretches=2;
 const ctx=sightContext(s);
 assert.equal(ctx.squall,true);
 assert(exitsForCreature('jungle',ctx).includes('helipad'));
 assert.deepEqual(creatureRoute('jungle','helipad',ctx),['jungle','helipad']);
 assert.equal(hearNoise('jungle','helipad',1,ctx).heard,true);
 assert.equal(visualLine('jungle','helipad',ctx),false);
 assert.equal(d.location,'paddock');
});
test('storm is visible only from the current outdoor scene, not an omniscient remote forecast',()=>{
 const s=game();s.clock.explorationStretches=2;
 const interior=partyView(s);
 assert.equal(interior.weather,null);
 s.actors[0].location='jungle';
 assert.equal(partyView(s).weather,'squall');
 assert.equal(outdoorWeather(s,'control'),null);
 assert.equal(outdoorWeather(s,'helipad'),'squall');
 s.clock.explorationStretches=4;assert.equal(partyView(s).weather,'rain');
});
test('distant dinosaur glimpses disappear in a squall and return after rain clears',()=>{
 const s=game();s.actors[0].location='jungle';s.actors[0].light.on=true;
 s.dinosaurs[0].location='helipad';
 const clear=partyView(s);
 assert.deepEqual(clear.distantSightings,[{kind:'Velociraptor'}]);
 s.clock.explorationStretches=2;
 assert.deepEqual(partyView(s).distantSightings,[]);
 s.clock.explorationStretches=4;
 assert.deepEqual(partyView(s).distantSightings,[{kind:'Velociraptor'}]);
});
test('a real local shutter closes and opens from the two authored operating handles',()=>{
 let s=game();s.actors[0].location='shed';
 let r=act(s,'use shutter');assert(r.accepted,r.reason);s=r.state;
 assert.equal(s.flags.serviceShutterClosed,true);
 assert.equal(s.actions.at(-1).target,'shutter');
 assert.equal(s.actions.at(-1).closed,true);
 assert(isPartySave(s));
 const prior=s.beat;
 s.cursor=0;s.actors[0].location='jungle';
 r=act(s,'use shutter');assert(r.accepted,r.reason);s=r.state;
 assert.equal(s.flags.serviceShutterClosed,false);
 assert.equal(s.beat,prior+1);
 assert(isPartySave(s));
});
test('closed shutter prevents both-direction survivor travel without RNG or time charge',()=>{
 for(const [from,to] of [['shed','jungle'],['jungle','shed']]){
  const s=game();s.actors[0].location=from;s.flags.serviceShutterClosed=true;
  const before=JSON.stringify(s);
  const out=act(s,'move '+to);
  assert.equal(out.accepted,false);
  assert.strictEqual(out.state,s);
  assert.equal(JSON.stringify(s),before);
  assert.equal(shutterBlocks(s,from,to),true);
  assert.equal(shutterBlocks(s,'jungle','helipad'),false);
 }
});
test('closed shutter removes creature passage but intact door and unrelated routes retain authority',()=>{
 const s=game(),d=s.dinosaurs[0];s.flags.serviceShutterClosed=true;
 assert.deepEqual(exitsForCreature('jungle',sightContext(s)),['paddock','helipad']);
 assert.equal(creatureRoute('shed','jungle',sightContext(s)),null);
 assert.equal(creatureRoute('utility','shed',sightContext(s)),null);
 assert.deepEqual(creatureRoute('jungle','helipad',sightContext(s)),['jungle','helipad']);
 assert.equal(d.location,'paddock');
});
test('shutter blocks vision while sound can still penetrate at higher intensity',()=>{
 const s=game();s.flags.serviceShutterClosed=true;
 const ctx=sightContext(s);
 assert.equal(visualLine('shed','jungle',ctx),false);
 assert.equal(visualLine('jungle','shed',ctx),false);
 assert.equal(hearNoise('shed','jungle',1,ctx).heard,false);
 assert.equal(hearNoise('shed','jungle',3,ctx).heard,true);
 assert.equal(visualLine('shed','shed',ctx),true);
});
test('stalking respects the closed shutter and may move after it opens',()=>{
 const s=game(),d=s.dinosaurs[0];
 d.location='shed';d.alert=5;d.lastHeard='jungle';d.facing='jungle';
 s.flags.serviceShutterClosed=true;
 const stopped=huntDecision(d,{beat:1,...sightContext(s)});
 assert.equal(stopped.blocked,true);assert.equal(stopped.location,'shed');
 s.flags.serviceShutterClosed=false;
 const moved=huntDecision(d,{beat:1,...sightContext(s)});
 assert.equal(moved.location,'jungle');assert.equal(moved.moved,true);
});
test('an approach through a shut shutter cannot give a pounce bonus even on round one',()=>{
 const s=game(),d=s.dinosaurs[0];s.actors[0].location='jungle';
 d.location='jungle';d.lastHunt={beat:0,from:'shed',to:'jungle',behavior:'stalk',blocked:false};
 assert(beginCombat(s,1337));
 assert.equal(raptorAttackPlan(s,s.actors[0]).id,'pounce');
 s.flags.serviceShutterClosed=true;
 assert.equal(raptorAttackPlan(s,s.actors[0]).id,'bite');
 assert(isPartySave(s));
});
test('shutter closing cannot teleport raptor or erase a persistent hunt record',()=>{
 const s=game();s.actors[0].location='shed';s.dinosaurs[0].location='jungle';
 const original=JSON.stringify(s.dinosaurs[0]);
 const r=act(s,'use shutter');
 assert(r.accepted,r.reason);
 assert.equal(r.state.dinosaurs[0].location,'jungle');
 assert.equal(r.state.flags.serviceShutterClosed,true);
 assert.notEqual(r.state.dinosaurs[0],null);
 assert.equal(s.flags.serviceShutterClosed,false);
 assert(original.includes('paddock')===false);
});
test('save v3 optional environmental flag is backward compatible but rejects forged values',()=>{
 const s=game(),before=JSON.stringify(s);
 assert(isPartySave(s));
 delete s.flags.serviceShutterClosed;
 assert(isPartySave(s));
 assert(isPartySave(upgradePartySave(s)));
 s.flags.serviceShutterClosed='false';assert.equal(isPartySave(s),false);
 s.flags.serviceShutterClosed={closed:true};assert.equal(isPartySave(s),false);
 assert.notEqual(before,JSON.stringify(s));
});
test('actor view and AI receive local passage information, never remote shutter state',()=>{
 let s=game();s.flags.serviceShutterClosed=true;
 s.actors[0].location='shed';s.actors[1].location='control';
 const local=partyView(s,{actorId:s.actors[0].id});
 const remote=partyView(s,{actorId:s.actors[1].id});
 assert(local.exits.find(x=>x.id==='jungle').blocked);
 assert.equal(local.serviceShutterClosed,true);
 assert.equal(remote.serviceShutterClosed,false);
 assert(!('serviceShutterClosed' in remote.flags));
 assert(!('serviceShutterClosed' in local.flags));
 const observation=actorObservation(s,s.actors[0].id);
 assert(!observation.exits.includes('jungle'));
 assert(!('serviceShutterClosed' in observation.mission));
});
test('mode and camera switches preserve authored storm/shutter flags without consuming dice',()=>{
 let s=game();s.flags.serviceShutterClosed=true;s.clock.explorationStretches=2;
 const rng=s.rng,actions=JSON.stringify(s.actions);
 s=setControlMode(s,{mode:'spectator'}).state;
 s=setCamera(s,{mode:'actor',actorId:s.actors[1].id}).state;
 assert.equal(s.flags.serviceShutterClosed,true);
 assert.equal(weatherAt(s),'squall');
 assert.equal(s.rng,rng);
 assert.equal(JSON.stringify(s.actions),actions);
 assert(isPartySave(s));
});
test('browser exposes real shutter commands and obscured routes, with updated imports',async()=>{
 const [html,app,engine]=await Promise.all([
  readFile(new URL('../party.html',import.meta.url),'utf8'),
  readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8'),
  readFile(new URL('../src/party-engine.mjs',import.meta.url),'utf8')
 ]);
 assert(html.includes('party-app.mjs?v=009b2b1'));
 assert(app.includes('party-engine.mjs?v=009b2b1'));
 assert(app.includes('shutter closed'));
 assert(app.includes('Open storm shutter'));
 assert(engine.includes('shutterBlocks(s,a.location,room)'));
 assert(engine.includes('serviceShutterClosed'));
 assert(!engine.includes("from '../worker/"));
});
