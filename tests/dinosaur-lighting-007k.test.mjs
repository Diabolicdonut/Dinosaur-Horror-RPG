import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,partyStep,partyView,parsePartyAction,isPartySave} from '../src/party-engine.mjs';
import {actorOwnsLight,actorHasLight,visibleLampZone,LIGHT_CAPACITY_STRETCHES} from '../src/dinosaur-pursuit.mjs';
import {detectGroupCreature} from '../src/evolved-encounters.mjs';
import {setControlMode,setCamera,runAutonomousTurn,actorObservation} from '../src/party-director.mjs';
import {COMBAT_COST} from '../src/combat-turns.mjs';

const roster=makeParty({seed:840,size:3,careers:['ranger','maintenance','medic']});
const game=(seed=1993)=>newPartyIncident({seed,roster});
const act=(s,command)=>partyStep(s,command,{actorId:s.actors[s.cursor].id,source:'human'});
test('007-K parser recognizes natural language light, formation and loud motion',()=>{
 assert.equal(parsePartyAction('turn flashlight on').target,'on');
 assert.equal(parsePartyAction('switch off my headlamp').kind,'light');
 assert.equal(parsePartyAction('light off').target,'off');
 assert.deepEqual(parsePartyAction('lead group quietly to utility'),{kind:'group',target:'quiet|utility',push:0});
 assert.equal(parsePartyAction('everyone rush to utility').target,'noisy|utility');
 assert.equal(parsePartyAction('run to utility').kind,'rush');
 assert.equal(COMBAT_COST.light,'quick');
 assert.equal(COMBAT_COST.rush,'quick');
});
test('new worlds begin with switched-off carried lighting, but old save sheets retain their previous semantics',()=>{
 const s=game(),a=s.actors[0];
 assert(actorOwnsLight(a));assert(!actorHasLight(a));
 assert.equal(a.light.charge,LIGHT_CAPACITY_STRETCHES);
 assert.equal(partyView(s,{actorId:a.id}).personalLight.on,false);
 const previous=structuredClone(s);delete previous.actors[0].light;
 assert(isPartySave(previous));assert(actorHasLight(previous.actors[0]));
});
test('personal light on/off action persists without overwriting another survivor',()=>{
 let s=game(6),first=act(s,'turn flashlight on');
 assert(first.accepted,first.reason);s=first.state;
 assert(actorHasLight(s.actors[0]));assert(!actorHasLight(s.actors[1]));
 assert.equal(s.actions[0].kind,'light');
 assert.equal(partyView(s,{actorId:'pc-1'}).personalLight.on,true);
 assert.equal(partyView(s,{actorId:'pc-2'}).personalLight.on,false);
 act(s,'wait');s=act(s,'wait').state; // action ownership cannot be skipped by viewing
 assert(!actorHasLight(s.actors[1]));
});
test('unowned, duplicate, and depleted light toggles reject with no world RNG change',()=>{
 const s=game(),unowned=partyStep(s,'light on',{actorId:'pc-3'});
 assert(!unowned.accepted);
 assert.strictEqual(unowned.state,s);
 let t=act(s,'light on').state;
 t=act(t,'wait').state;t=act(t,'wait').state;
 const originalRng=t.rng,again=act(t,'light on');
 assert(!again.accepted);assert.equal(again.state.rng,originalRng);
 const empty=game();empty.actors[0].light.charge=0;
 const no=act(empty,'light on');
 assert(!no.accepted);assert.strictEqual(no.state,empty);
});
test('darkness modifiers use active personal illumination, never a teammate’s lamp',()=>{
 const s=game(55),a=[s.actors[0],s.actors[1]];
 const dark=detectGroupCreature(a,{seed:55,darkness:true});
 const bright=structuredClone(a);bright[0].light.on=true;bright[1].light.on=false;
 const lit=detectGroupCreature(bright,{seed:55,darkness:true});
 assert.equal(lit.humans[0].baseCount,dark.humans[0].baseCount+2);
 assert.equal(lit.humans[1].baseCount,dark.humans[1].baseCount);
 assert.deepEqual(lit.creature,dark.creature);
});
test('finite battery loses one charge per completed stretch only when switched on',()=>{
 let s=game(7);s.dinosaurs[0].defeated=true;
 s=act(s,'light on').state;
 for(let i=0;i<3;i++)s=act(s,'wait').state;
 assert.equal(s.clock.explorationStretches,1);
 assert.equal(s.actors[0].light.charge,LIGHT_CAPACITY_STRETCHES-1);
 s=act(s,'wait').state;s=act(s,'wait').state;
 s=act(s,'light off').state;
 const held=s.actors[0].light.charge;
 for(let i=0;i<6;i++)s=act(s,'wait').state;
 assert.equal(s.actors[0].light.charge,held);
});
test('battery exhaustion extinguishes illumination and makes subsequent activation illegal',()=>{
 let s=game(10);s.dinosaurs[0].defeated=true;
 s=act(s,'light on').state;
 for(let i=0;i<3*LIGHT_CAPACITY_STRETCHES;i++)s=act(s,'wait').state;
 assert.equal(s.actors[0].light.charge,0);
 assert.equal(s.actors[0].light.on,false);
 assert(s.events.some(e=>e.actorId==='pc-1'&&e.message.includes('battery')));
});
test('exposed lamps remain limited to direct legal sight lines',()=>{
 const a={location:'shed',inventory:['flashlight'],light:{on:true,charge:3}};
 assert.equal(visibleLampZone('jungle',[a]),'shed');
 assert.equal(visibleLampZone('utility',[a]),null);
 assert.equal(visibleLampZone('paddock',[a]),null);
 a.light.on=false;assert.equal(visibleLampZone('jungle',[a]),null);
});
test('lit dark-zone survivor can attract the predator without being told its hidden coordinates',()=>{
 const s=game(19);s.actors[0].location='shed';s.dinosaurs[0].location='jungle';
 const r=act(s,'light on');
 assert(r.accepted,r.reason);
 assert.equal(r.state.dinosaurs[0].lastHeard,'shed');
 assert.equal(r.state.dinosaurs[0].lastClue,'light');
 assert(!('lastHeard' in partyView(r.state,{actorId:'pc-1'})));
 assert(!('lastClue' in actorObservation(r.state,'pc-2')));
});
test('dark-zone encounter does not grant remote predator coordinates to a separated observer',()=>{
 const s=game();s.dinosaurs[0].location='paddock';
 s.dinosaurs[0].search={zone:'paddock',startedAtStretch:0,dueStretch:1};
 const camera=setCamera(s,{mode:'actor',actorId:'pc-2'});
 assert(camera.accepted);assert.equal(camera.state.rng,s.rng);
 const view=partyView(camera.state,{actorId:'pc-2'});
 assert.equal(view.visibleDinosaurs.length,0);
 assert(!('search' in view));
});
test('active predator search waits a whole stretch and rolls even in an empty zone',()=>{
 let s=game(31);s.dinosaurs[0].location='paddock';
 s.dinosaurs[0].lastHeard='paddock';s.dinosaurs[0].alert=5;
 s=act(s,'wait').state;
 assert.equal(s.dinosaurs[0].search.dueStretch,1);
 assert.equal(s.dinosaurs[0].searchHistory,undefined);
 s=act(s,'wait').state;
 assert.equal(s.dinosaurs[0].searchHistory,undefined);
 s=act(s,'wait').state;
 assert.equal(s.clock.explorationStretches,1);
 assert.equal(s.dinosaurs[0].search,null);
 assert.equal(s.dinosaurs[0].searchHistory.length,1);
 assert.deepEqual(s.dinosaurs[0].searchHistory[0].revealed,[]);
});
test('a hidden occupant remains hidden until the scheduled search resolves',()=>{
 let s=game(33);s.dinosaurs[0].location='paddock';
 s.dinosaurs[0].lastHeard='paddock';s.dinosaurs[0].alert=5;
 s.actors[0].location='paddock';s.actors[0].hidden=true;
 s=act(s,'wait').state;
 assert(s.actors[0].hidden);
 s=act(s,'wait').state;assert(s.actors[0].hidden);
 s=act(s,'wait').state;
 assert.equal(s.dinosaurs[0].searchHistory.length,1);
 const found=s.dinosaurs[0].searchHistory[0].revealed.includes('pc-1');
 assert.equal(s.actors[0].hidden,!found);
});
test('new audible source may interrupt an unfinished search without teleportation',()=>{
 const s=game(45);s.dinosaurs[0].location='control';
 s.dinosaurs[0].search={zone:'control',startedAtStretch:0,dueStretch:1};
 s.dinosaurs[0].alert=4;s.dinosaurs[0].lastHeard='control';
 const r=act(s,'rush lobby');
 assert(r.accepted,r.reason);
 assert.equal(r.state.dinosaurs[0].lastHeard,'lobby');
 assert.equal(r.state.dinosaurs[0].search,null);
 assert.equal(r.state.dinosaurs[0].location,'control');
});
test('group leader moves once, with each survivor still at their original zone and pending own turn',()=>{
 const s=game(46),r=act(s,'lead group quietly to utility');
 assert(r.accepted,r.reason);
 assert.equal(r.state.actors[0].location,'utility');
 assert.equal(r.state.actors[1].location,'control');
 assert.equal(r.state.actors[2].location,'control');
 assert.deepEqual(r.state.groupTravel.awaiting,['pc-2','pc-3']);
 assert.equal(r.state.actions.length,1);
 assert.equal(r.state.actions[0].groupApproach,'quiet');
});
test('group movement uses individual seeded mobility and can split the team',()=>{
 let s=act(game(47),'group quietly to utility').state;
 assert(s.groupTravel);
 const before=s.rng;
 const next=act(s,'sneak utility');
 assert(next.accepted,next.reason);
 assert.equal(next.state.actors[1].location,'utility');
 assert.notEqual(next.state.rng,before);
 assert.deepEqual(next.state.groupTravel.awaiting,['pc-3']);
 s=next.state;
 s=act(s,'wait').state;
 assert.equal(s.actors[2].location,'control');
 assert.equal(s.groupTravel.awaiting.includes('pc-3'),true);
});
test('invalid group destination and nonexistent team do not advance the world',()=>{
 const s=game(48);
 const bad=act(s,'group quietly to helipad');
 assert(!bad.accepted);assert.equal(bad.state.rng,s.rng);
 const alone=game(48);alone.actors[1].location='utility';alone.actors[2].location='utility';
 const rejected=act(alone,'group quietly to lobby');
 assert(!rejected.accepted);assert.strictEqual(rejected.state,alone);
});
test('a noisy approach is louder than normal travel and remains physically routed',()=>{
 const standard=act(game(55),'move utility');
 const rush=act(game(55),'rush utility');
 assert(standard.accepted&&rush.accepted);
 assert.equal(standard.state.actions.at(-1).noise,1); // prior normal action retained
 assert.equal(rush.state.actions.at(-1).noise,3);
 assert.equal(rush.state.actors[0].location,'utility');
 assert.equal(rush.state.dinosaurs[0].location,standard.state.dinosaurs[0].location);
});
test('spectator companion follows nearby group plan with own action and no world reset',()=>{
 let s=act(game(50),'group quietly to utility').state;
 const before=s.rng,beat=s.beat;
 s=setControlMode(s,{mode:'spectator'}).state;
 assert.equal(s.rng,before);assert.equal(s.beat,beat);
 const out=runAutonomousTurn(s,{singleStep:true});
 assert(out.accepted,out.reason);
 assert.equal(out.state.actors[1].location,'utility');
 assert.equal(out.state.actions.length,2);
});
test('active search, grouping, and lights roundtrip through the unchanged v3 save format',()=>{
 let s=game(51);
 s=act(s,'lead group quietly to utility').state;
 s.actors[0].light.on=true;
 s.dinosaurs[0].search={zone:'jungle',startedAtStretch:0,dueStretch:2};
 assert(isPartySave(s));
 const saved=JSON.parse(JSON.stringify(s));
 assert(isPartySave(saved));
 assert.deepEqual(partyView(saved,{actorId:'pc-2'}).groupTravel,{to:'utility',approach:'quiet'});
 const a=act(s,'wait'),b=act(saved,'wait');
 assert.deepEqual(a,b);
});
test('new interaction controls are present and older solo/Worker files remain untouched',async()=>{
 const html=await readFile(new URL('../party.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8');
 assert(html.includes('007-L2a'));assert(html.includes('party-app.mjs?v=009b2b2c2b'));
 assert(app.includes('Switch light ON'));
 assert(app.includes('Lead group quietly'));
 assert(app.includes('Rush to'));
});

test('pocket and small flashlight gear are recognized as independently powered supplies',()=>{
 for(const item of ['flashlight','pocket flashlight','small flashlight','headlamp']){
  const a={gear:[item],inventory:[],light:{on:true,charge:2}};
  assert(actorOwnsLight(a));assert(actorHasLight(a));
 }
});
test('alert expires on patrol ticks after searching an empty zone; deterministic replay persists',()=>{
 let s=game(102);s.dinosaurs[0].location='paddock';
 s.dinosaurs[0].alert=3;s.dinosaurs[0].lastHeard=null;
 let first=JSON.parse(JSON.stringify(s));
 for(let i=0;i<12;i++)s=act(s,'wait').state;
 for(let i=0;i<12;i++)first=act(first,'wait').state;
 assert.equal(s.dinosaurs[0].alert,0);
 assert.deepEqual(s,first);
});
test('prior knowledge of a dinosaur does not become new physical vision in darkness',()=>{
 const s=game(103),a=s.actors[0],d=s.dinosaurs[0];
 a.location='jungle';d.location='jungle';a.seenThreats=[d.id];a.light.on=false;
 assert.deepEqual(partyView(s,{actorId:a.id}).visibleDinosaurs,[]);
 a.light.on=true;
 assert.equal(partyView(s,{actorId:a.id}).visibleDinosaurs.length,1);
});
