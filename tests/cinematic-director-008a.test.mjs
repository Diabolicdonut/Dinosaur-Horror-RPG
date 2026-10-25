import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newPartyIncident,partyStep,partyView,isPartySave,parsePartyAction,upgradePartySave} from '../src/party-engine.mjs';
import {CINEMATIC_EVENTS,availableSceneEvents,eventAllowed,checkScenePressure,pressureForActor,validSceneRecords,validScenePressure} from '../src/cinematic-director.mjs';
import {setControlMode,setCamera} from '../src/party-director.mjs';
const game=()=>newPartyIncident({seed:1993});
const human=(s,input)=>partyStep(s,input,{actorId:s.actors[s.cursor].id,source:'human'});

test('008-A authored registry exposes only present and permitted actor-local scenes',()=>{
 const s=game(),actor=s.actors[0];
 assert.deepEqual(availableSceneEvents(s,actor).map(x=>x.id),['control-dead-air']);
 assert.equal(eventAllowed(s,actor,'helipad-valley'),false);
 assert.equal(eventAllowed(s,actor,'no-such-event'),false);
 assert.equal(Object.keys(CINEMATIC_EVENTS).length,11);
 assert.equal(isPartySave(s),true);
 assert.deepEqual(parsePartyAction('scene control-dead-air'),{kind:'scene',target:'control-dead-air',push:0});
});
test('optional scene event commits once with no time, RNG, physical event or attack',()=>{
 const s=game(),before=JSON.stringify(s),rng=s.rng,beat=s.beat;
 const r=human(s,'scene control-dead-air');
 assert(r.accepted,r.reason);
 const t=r.state;
 assert.equal(JSON.stringify(s),before);
 assert.equal(t.rng,rng);assert.equal(t.beat,beat);
 assert.deepEqual(t.dinosaurs,s.dinosaurs);
 assert.deepEqual(t.actors,s.actors);
 assert.equal(t.sceneRecords.length,1);
 assert.equal(t.sceneRecords[0].actorId,'pc-1');
 assert.equal(t.actions.at(-1).kind,'scene');
 assert.equal(t.events.at(-1).actorId,'pc-1');
 assert(isPartySave(t));
 const old=JSON.stringify(t),dup=human(t,'scene control-dead-air');
 assert.equal(dup.accepted,false);assert.equal(JSON.stringify(t),old);
});
test('a scene cannot be invoked remotely or to fake rescue facts',()=>{
 const s=game(),snapshot=JSON.stringify(s);
 for(const id of ['helipad-valley','shed-power-hum','helipad-readiness','jungle-squall','invent-tyrannosaurus']){
  const denied=human(s,'scene '+id);
  assert.equal(denied.accepted,false,id);
  assert.strictEqual(denied.state,s);
 }
 assert.equal(JSON.stringify(s),snapshot);
});
test('conditional power and signal events depend on committed mission state',()=>{
 const s=game();s.actors[0].location='shed';
 assert(!availableSceneEvents(s,s.actors[0]).some(e=>e.id==='shed-power-hum'));
 s.flags.power=true;
 assert(availableSceneEvents(s,s.actors[0]).some(e=>e.id==='shed-power-hum'));
 s.actors[0].location='helipad';
 assert(!availableSceneEvents(s,s.actors[0]).some(e=>e.id==='helipad-readiness'));
 s.flags.distress=true;
 assert(availableSceneEvents(s,s.actors[0]).some(e=>e.id==='helipad-readiness'));
 s.flags.beacon=true;
 assert(!availableSceneEvents(s,s.actors[0]).some(e=>e.id==='helipad-readiness'));
});
test('valley wonder remains available in clear rain but not during sight-obscuring squall',()=>{
 const s=game();s.actors[0].location='helipad';
 assert(availableSceneEvents(s,s.actors[0]).some(e=>e.id==='helipad-valley'));
 s.clock.explorationStretches=2;
 assert(!availableSceneEvents(s,s.actors[0]).some(e=>e.id==='helipad-valley'));
 const denied=human(s,'scene helipad-valley');assert.equal(denied.accepted,false);
 s.clock.explorationStretches=4;
 assert(availableSceneEvents(s,s.actors[0]).some(e=>e.id==='helipad-valley'));
});
test('weather-dependent quiet or suspense scene is optional, not a forced encounter',()=>{
 const s=game();s.actors[0].location='jungle';
 assert.deepEqual(availableSceneEvents(s,s.actors[0]),[]);
 s.clock.explorationStretches=2;
 const e=availableSceneEvents(s,s.actors[0]);assert.equal(e.length,1);
 assert.equal(e[0].id,'jungle-squall');
 const before=JSON.stringify(s.dinosaurs);
 const r=human(s,'scene jungle-squall');
 assert(r.accepted,r.reason);assert.equal(r.state.rng,s.rng);
 assert.equal(JSON.stringify(r.state.dinosaurs),before);
 assert.equal(r.state.combat,null);
});
test('two survivors can experience the same authored scene independently',()=>{
 let s=game();s.actors[1].location='control';
 const first=human(s,'scene control-dead-air');assert(first.accepted);
 s=first.state;
 assert.deepEqual(availableSceneEvents(s,s.actors[0]),[]);
 assert.equal(availableSceneEvents(s,s.actors[1]).length,1);
 assert(isPartySave(s));
});
test('existing Wonder journal remains independent of optional scene records',()=>{
 let s=game();s.actors[0].location='helipad';
 const e=human(s,'scene helipad-valley');assert(e.accepted,e.reason);s=e.state;
 assert.equal(s.actors[0].wonderJournal.length,0);
 assert.equal(s.sceneRecords.length,1);
 const wonder=human(s,'wonder herbivores-at-distance');assert(wonder.accepted,wonder.reason);
 assert.equal(wonder.state.actors[0].wonderJournal.length,1);
 assert.equal(wonder.state.sceneRecords.length,1);
 assert.equal(wonder.state.rng,s.rng);
});
test('scene journal rejects forgeries, nonlocal zones, duplicates, future beats and invalid actors',()=>{
 const s=game();
 s.sceneRecords=[{id:'control-dead-air',zone:'control',actorId:'pc-1',beat:0}];
 assert(validSceneRecords(s));assert(isPartySave(s));
 s.sceneRecords.push({...s.sceneRecords[0]});assert(!validSceneRecords(s));assert(!isPartySave(s));
 s.sceneRecords.pop();s.sceneRecords[0].zone='paddock';assert(!isPartySave(s));
 s.sceneRecords[0].zone='control';s.sceneRecords[0].beat=3;assert(!isPartySave(s));
 s.sceneRecords[0].beat=0;s.sceneRecords[0].actorId='ghost';assert(!isPartySave(s));
});
test('actor-local seeded d6 pressure is pure and quiet movement reduces dice pool',()=>{
 const s=game(),actor=s.actors[0];actor.location='jungle';
 const before=JSON.stringify(s),rng=s.rng;
 const normal=checkScenePressure(s,actor,'move');
 const sneaking=checkScenePressure(s,actor,'sneak');
 const rushing=checkScenePressure(s,actor,'rush');
 assert.equal(normal.pool,1);assert.equal(sneaking.pool,0);assert.equal(rushing.pool,2);
 assert.equal(sneaking.faces.length,0);
 assert.deepEqual(normal,checkScenePressure(s,actor,'move'));
 assert.equal(JSON.stringify(s),before);assert.equal(s.rng,rng);
 assert.equal(checkScenePressure(s,actor,'wonder'),null);
 actor.location='control';assert.equal(checkScenePressure(s,actor,'wait'),null);
});
test('successful physical outdoor travel advances bounded actor-local check without forced combat',()=>{
 const s=game();s.actors[0].location='shed';
 const outcome=human(s,'move jungle');assert(outcome.accepted,outcome.reason);
 const t=outcome.state,pressure=pressureForActor(t,'pc-1');
 assert.equal(pressure.checks,1);
 assert(t.actions.at(-1).scenePressure);
 assert.equal(t.combat?.active??false,false);
 assert.equal(t.scenePressure.length,1);
 assert.equal(pressureForActor(t,'pc-2').checks,0);
 assert.equal(t.actors[0].location,'jungle');
 assert(isPartySave(t));
});
test('pressure cannot summon dinosaur; a cue requires physically plausible audible proximity',()=>{
 const s=game(),actor=s.actors[0];actor.location='jungle';
 s.scenePressure=[{actorId:'pc-1',level:4,checks:2,lastBeat:0}];
 let found=null;
 for(let i=0;i<300;i++){
  s.beat=i;
  const outcome=checkScenePressure(s,actor,'rush');
  if(outcome.level===5){found=outcome;break;}
 }
 assert(found,'Found a deterministic seed/beat with escalating check');
 s.dinosaurs[0].location='paddock';
 const allowed=checkScenePressure(s,actor,'rush');
 assert.equal(allowed.level,5);
 assert.equal(allowed.audibleCue,true);
 s.dinosaurs[0].location='control';
 assert.equal(checkScenePressure(s,actor,'rush').audibleCue,false);
 s.dinosaurs[0].location='shed';s.flags.serviceShutterClosed=true;
 assert.equal(checkScenePressure(s,actor,'rush').audibleCue,false);
 assert.equal(s.dinosaurs.length,1);
 assert.equal(s.combat,null);
});
test('old v3 save without scene fields loads; forged actor pressure is rejected',()=>{
 const s=game();delete s.sceneRecords;delete s.scenePressure;
 assert(isPartySave(s));assert(isPartySave(upgradePartySave(s)));
 s.scenePressure=[{actorId:'pc-1',level:2,checks:1,lastBeat:0}];
 assert(validScenePressure(s));assert(isPartySave(s));
 s.scenePressure[0].level=7;assert(!isPartySave(s));
 s.scenePressure[0].level=2;s.scenePressure[0].actorId='ghost';assert(!isPartySave(s));
});
test('camera and agency switching do not alter event state or expose a remote journal',()=>{
 let s=game();s.actors[0].location='helipad';
 s=human(s,'scene helipad-valley').state;
 const records=JSON.stringify(s.sceneRecords),rng=s.rng;
 s=setControlMode(s,{mode:'spectator'}).state;
 s=setCamera(s,{mode:'actor',actorId:'pc-2'}).state;
 assert.equal(s.rng,rng);assert.equal(JSON.stringify(s.sceneRecords),records);
 const v=partyView(s,{actorId:'pc-2'});
 assert.equal(v.location,'control');
 assert(!v.availableSceneEvents.some(e=>e.id==='helipad-valley'));
 assert.equal(v.encounterPressure.checks,0);
 assert(!JSON.stringify(v.availableSceneEvents).includes('Giants in the Valley'));
});
test('browser includes scene choices and pressure; no new Worker or global ecology',async()=>{
 const [html,app,engine]=await Promise.all([
  readFile(new URL('../party.html',import.meta.url),'utf8'),
  readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8'),
  readFile(new URL('../src/party-engine.mjs',import.meta.url),'utf8')
 ]);
 assert(html.includes('party-app.mjs?v=008c1'));
 assert(app.includes('party-engine.mjs?v=008c1'));
 assert(app.includes('Experience scene'));
 assert(app.includes('v.encounterPressure.label'));
 assert(engine.includes('availableSceneEvents:availableSceneEvents'));
 assert(engine.includes('checkScenePressure(s,actor,kind)'));
 assert(!engine.includes('islandPopulation'));
});
