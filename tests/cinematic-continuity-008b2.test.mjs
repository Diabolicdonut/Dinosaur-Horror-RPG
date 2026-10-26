import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newPartyIncident,partyStep,partyView,isPartySave,upgradePartySave} from '../src/party-engine.mjs';
import {CINEMATIC_EVENTS,availableSceneEvents} from '../src/cinematic-director.mjs';
import {generatorPreparation,localSceneConsequences,GENERATOR_DIAGNOSIS,JUNGLE_TRACK_DISCOVERY} from '../src/cinematic-continuity.mjs';
import {sceneForActor} from '../src/cinematic-scenes.mjs';
import {setControlMode,setCamera} from '../src/party-director.mjs';
const game=(seed=1993)=>newPartyIncident({seed});
const act=(s,command)=>partyStep(s,command,{actorId:s.actors[s.cursor].id,source:'human'});
const prepared=()=>{
 const s=game();s.actors[0].location='shed';s.actors[0].observed.push(GENERATOR_DIAGNOSIS);return s;
};
function findDiagnostic(success){
 for(let seed=1;seed<300;seed++){
  const s=game(seed);
  const r=act(s,'investigate consoles');
  if(r.accepted&&Boolean(r.result?.success)===success)return {before:s,after:r.state};
 }
 throw Error('Could not obtain a seeded Observation outcome '+success);
}
test('scene continuity rules are pure actor-local projections with no new RNG',()=>{
 const s=prepared(),snapshot=JSON.stringify(s);
 const c=generatorPreparation(s,s.actors[0]);
 assert.deepEqual(c,{ready:true,skill:'heavy_machinery',modifier:1,source:GENERATOR_DIAGNOSIS});
 assert.equal(localSceneConsequences(s,s.actors[0])[0].id,'prepared-generator');
 assert.equal(JSON.stringify(s),snapshot);
 assert(isPartySave(s));
});
test('a real successful paid control-room Observation teaches generator procedure',()=>{
 const {before,after}=findDiagnostic(true);
 assert(!before.actors[0].observed.includes(GENERATOR_DIAGNOSIS));
 assert(after.actors[0].observed.includes(GENERATOR_DIAGNOSIS));
 assert.equal(after.actions.at(-1).kind,'investigate');
 assert.equal(after.actions.at(-1).target,'consoles');
 assert(after.beat>before.beat);
 assert(isPartySave(after));
});
test('a failed Observation cannot invent the later mechanical preparation advantage',()=>{
 const {after}=findDiagnostic(false);
 assert(!after.actors[0].observed.includes(GENERATOR_DIAGNOSIS));
 after.actors[0].location='shed';
 assert.equal(generatorPreparation(after,after.actors[0]).modifier,0);
 assert(!availableSceneEvents(after,after.actors[0]).some(e=>e.id==='shed-startup-protocol'));
});
test('actually documented preparation adds exactly one situational Evolved base die',()=>{
 const raw=game(57);raw.actors[0].location='shed';
 const informed=JSON.parse(JSON.stringify(raw));
 informed.actors[0].observed.push(GENERATOR_DIAGNOSIS);
 const ordinary=act(raw,'use generator'),preparedRoll=act(informed,'use generator');
 assert(ordinary.accepted&&preparedRoll.accepted);
 const unpreparedAction=ordinary.state.actions.at(-1),preparedAction=preparedRoll.state.actions.at(-1);
 assert.equal(unpreparedAction.preparationUsed,false);
 assert.equal(unpreparedAction.preparationBonus,0);
 assert.equal(preparedAction.preparationUsed,true);
 assert.equal(preparedAction.preparationSource,GENERATOR_DIAGNOSIS);
 assert.equal(preparedAction.preparationBonus,1);
 assert.equal(preparedAction.base.length,unpreparedAction.base.length+1);
 assert.equal(unpreparedAction.seed,preparedAction.seed);
 assert.equal(raw.rng,informed.rng);
 assert(isPartySave(ordinary.state)&&isPartySave(preparedRoll.state));
});
test('only the actor who actually studied consoles receives that preparation',()=>{
 const s=prepared();s.actors[1].location='shed';
 assert.equal(generatorPreparation(s,s.actors[0]).modifier,1);
 assert.equal(generatorPreparation(s,s.actors[1]).modifier,0);
 const v0=partyView(s,{actorId:s.actors[0].id}),v1=partyView(s,{actorId:s.actors[1].id});
 assert.equal(v0.preparedGenerator,true);
 assert.equal(v1.preparedGenerator,false);
 assert(!v1.sceneConsequences.some(x=>x.id==='prepared-generator'));
});
test('earned advantage carries across rooms and remains optional to ignore',()=>{
 const s=prepared();s.actors[0].location='control';
 assert.equal(generatorPreparation(s,s.actors[0]).ready,false);
 s.actors[0].location='shed';
 assert.equal(generatorPreparation(s,s.actors[0]).ready,true);
 assert(availableSceneEvents(s,s.actors[0]).some(e=>e.id==='shed-startup-protocol'));
 const prior=JSON.stringify(s),out=act(s,'scene shed-startup-protocol');
 assert(out.accepted,out.reason);
 assert.equal(out.state.rng,s.rng);
 assert.equal(out.state.beat,s.beat);
 assert.equal(JSON.stringify(s),prior);
 assert.equal(generatorPreparation(out.state,out.state.actors[0]).modifier,1);
});
test('shutting off the generator advantage after genuine restored power is automatic',()=>{
 const s=prepared();
 s.flags.power=true;
 assert.equal(generatorPreparation(s,s.actors[0]).ready,false);
 assert(!availableSceneEvents(s,s.actors[0]).some(e=>e.id==='shed-startup-protocol'));
 assert.equal(sceneForActor(s,s.actors[0]).title,'After the Generator Starts');
});
test('jungle track review becomes available only to the successful investigator',()=>{
 const s=game();s.actors[0].location='jungle';s.actors[1].location='jungle';
 assert(!availableSceneEvents(s,s.actors[0]).some(e=>e.id==='jungle-tracks-reviewed'));
 s.actors[0].observed.push(JUNGLE_TRACK_DISCOVERY);
 assert(availableSceneEvents(s,s.actors[0]).some(e=>e.id==='jungle-tracks-reviewed'));
 assert(!availableSceneEvents(s,s.actors[1]).some(e=>e.id==='jungle-tracks-reviewed'));
 assert.equal(localSceneConsequences(s,s.actors[0])[0].id,'studied-tracks');
 assert(sceneForActor(s,s.actors[0]).focus.includes('footprints are evidence'));
 assert(sceneForActor(s,s.actors[0]).focus.includes('not a guarantee'));
});
test('an actual successful gate repair unlocks a quiet recovery beat for everyone at the gate',()=>{
 const s=game();s.actors[0].location='paddock';s.actors[1].location='paddock';
 assert(!availableSceneEvents(s,s.actors[0]).some(e=>e.id==='paddock-repaired'));
 s.flags.paddockGateBraced=true;
 assert(availableSceneEvents(s,s.actors[0]).some(e=>e.id==='paddock-repaired'));
 assert(availableSceneEvents(s,s.actors[1]).some(e=>e.id==='paddock-repaired'));
 assert.equal(sceneForActor(s,s.actors[0]).title,'The Braced Perimeter');
 assert.equal(localSceneConsequences(s,s.actors[1])[0].id,'braced-gate');
});
test('repaired gate is not revealed to someone physically elsewhere',()=>{
 const s=game();s.flags.paddockGateBraced=true;
 assert.equal(localSceneConsequences(s,s.actors[0]).length,0);
 assert.equal(partyView(s).localPaddockGateBraced,false);
 assert(!partyView(s).sceneConsequences.some(e=>e.id==='braced-gate'));
 assert(!('paddockGateBraced' in partyView(s).flags));
});
test('personal failed gate repair memory does not leak into teammates’ scenes',()=>{
 const s=game();s.actors[0].location='paddock';s.actors[1].location='paddock';
 s.dangerRecords=[{id:'brace-paddock-gate',zone:'paddock',actorId:'pc-1',beat:0,success:false,successes:0}];
 assert(sceneForActor(s,s.actors[0]).focus.includes('previous attempt'));
 assert(!sceneForActor(s,s.actors[1]).focus.includes('previous attempt'));
 assert(localSceneConsequences(s,s.actors[0]).some(c=>c.id==='gate-failure'));
 assert(!localSceneConsequences(s,s.actors[1]).some(c=>c.id==='gate-failure'));
 assert(isPartySave(s));
});
test('transmitted call changes a subsequent control-room recovery scene, not mission flags',()=>{
 const s=game();
 assert(!availableSceneEvents(s,s.actors[0]).some(e=>e.id==='control-call-confirmation'));
 s.flags.power=true;s.flags.distress=true;
 assert(availableSceneEvents(s,s.actors[0]).some(e=>e.id==='control-call-confirmation'));
 assert(localSceneConsequences(s,s.actors[0]).some(e=>e.id==='call-sent'));
 const out=act(s,'scene control-call-confirmation');
 assert(out.accepted,out.reason);
 assert.equal(out.state.flags.beacon,false);
 assert.equal(out.state.sceneRecords.at(-1).id,'control-call-confirmation');
 assert.equal(out.state.dinosaurs.length,1);
 assert(isPartySave(out.state));
});
test('new linked scene opportunities do not force encounter clocks, combat or additional creatures',()=>{
 const s=prepared();
 const before=JSON.stringify(s),out=act(s,'scene shed-startup-protocol');
 assert(out.accepted);
 assert.equal(JSON.stringify(s),before);
 assert.equal(out.state.rng,s.rng);
 assert.equal(out.state.beat,s.beat);
 assert.deepEqual(out.state.dinosaurs,s.dinosaurs);
 assert.deepEqual(out.state.scenePressure,s.scenePressure);
 assert.equal(out.state.combat,null);
});
test('all eleven authored events validate and old party saves remain compatible',()=>{
 const s=game();
 assert.equal(Object.keys(CINEMATIC_EVENTS).length,11);
 delete s.sceneRecords;delete s.scenePressure;
 assert(isPartySave(s));assert(isPartySave(upgradePartySave(s)));
 assert(!('preparationUsed' in s));
});
test('mode/camera changes preserve discoveries and personal event availability',()=>{
 let s=prepared();s.actors[1].location='shed';
 const before=JSON.stringify(s.actors[0].observed),rng=s.rng;
 s=setControlMode(s,{mode:'spectator'}).state;
 s=setCamera(s,{mode:'actor',actorId:'pc-2'}).state;
 assert.equal(s.rng,rng);
 assert.equal(JSON.stringify(s.actors[0].observed),before);
 assert(partyView(s,{actorId:'pc-1'}).availableSceneEvents.some(e=>e.id==='shed-startup-protocol'));
 assert(!partyView(s,{actorId:'pc-2'}).availableSceneEvents.some(e=>e.id==='shed-startup-protocol'));
 assert(isPartySave(s));
});
test('live browser projects continuity and 008-B2 modules without Worker mutation',async()=>{
 const [html,app,engine,scenario]=await Promise.all([
  readFile(new URL('../party.html',import.meta.url),'utf8'),
  readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8'),
  readFile(new URL('../src/party-engine.mjs',import.meta.url),'utf8'),
  readFile(new URL('../src/scenario.mjs',import.meta.url),'utf8')
 ]);
 assert(html.includes('party-app.mjs?v=009b2b2c2c2b'));
 assert(app.includes('party-engine.mjs?v=009b2b2c2c2b'));
 assert(app.includes('CONTINUITY'));
 assert(engine.includes('generatorPreparation(s,a)'));
 assert(engine.includes('sceneConsequences:localSceneConsequences(s,actor)'));
 assert(scenario.includes('generator priming sequence'));
 assert(!engine.includes('islandPopulation'));
});
