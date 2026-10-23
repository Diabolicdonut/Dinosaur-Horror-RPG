import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,partyStep,partyView,parsePartyAction,isPartySave} from '../src/party-engine.mjs';
import {detectGroupCreature} from '../src/evolved-encounters.mjs';
import {setControlMode,runAutonomousTurn} from '../src/party-director.mjs';
import {COMBAT_COST} from '../src/combat-turns.mjs';
import {ZONE_LIGHTING,exitsForCreature,creatureRoute,
 effectiveNoiseDistance,hearNoise,pursuitStep,roomIsDark,actorHasLight} from '../src/dinosaur-pursuit.mjs';

const roster=makeParty({seed:840,size:3,careers:['ranger','maintenance','medic']});
const game=(seed=1993)=>newPartyIncident({seed,roster});
test('zone lighting is deterministic, authored and does not reveal a creature position',()=>{
 assert.equal(ZONE_LIGHTING.jungle,'dark');
 assert.equal(ZONE_LIGHTING.utility,'lit');
 assert(roomIsDark('helipad'));
 assert(!roomIsDark('control'));
 const s=game(),v=partyView(s,{actorId:'pc-2'});
 assert.equal(typeof v.lighting,'string');
 assert(!v.lighting.includes('paddock'));
});
test('staff-secured maintenance door blocks animal travel in both directions',()=>{
 assert(!exitsForCreature('utility').includes('shed'));
 assert(!exitsForCreature('shed').includes('utility'));
 assert.equal(creatureRoute('paddock','control'),null);
 assert.deepEqual(creatureRoute('paddock','shed'),['paddock','jungle','shed']);
});
test('explicitly breached door permits route and restores reciprocal traversal',()=>{
 const route=creatureRoute('paddock','control',{shedDoorBreached:true});
 assert.deepEqual(route,['paddock','jungle','shed','utility','control']);
 assert(exitsForCreature('utility',{shedDoorBreached:true}).includes('shed'));
});
test('locked reinforced door muffles sound but ordinary connected paths retain attenuation',()=>{
 const closed=effectiveNoiseDistance('shed','utility');
 const open=effectiveNoiseDistance('shed','utility',{shedDoorBreached:true});
 assert.equal(closed,3);assert.equal(open,1);
 assert.equal(effectiveNoiseDistance('paddock','jungle'),1);
 assert.equal(effectiveNoiseDistance('helipad','control'),6);
});
test('only physically audible sound updates a known-source hearing calculation',()=>{
 assert.equal(hearNoise('jungle','shed',0).heard,false);
 assert.equal(hearNoise('jungle','shed',1).heard,true);
 assert.equal(hearNoise('shed','utility',2).heard,false);
 assert.equal(hearNoise('shed','utility',3).heard,true);
 assert.equal(hearNoise('shed','utility',1,{shedDoorBreached:true}).heard,true);
 assert.throws(()=>hearNoise('jungle','shed',100),RangeError);
});
test('pursuit follows one legal zone per step and does not teleport across a locked door',()=>{
 const d={location:'paddock',lastHeard:'shed',alert:4};
 const first=pursuitStep(d);
 assert.equal(first.location,'jungle');
 const next=pursuitStep({...d,location:first.location});
 assert.equal(next.location,'shed');
 assert.equal(pursuitStep({...d,location:'shed',lastHeard:'control'}).blocked,true);
 assert.equal(pursuitStep({...d,location:'shed',lastHeard:'control'}).location,'shed');
});
test('quiet travel has a bounded parser and costs more combat time than ordinary movement',()=>{
 assert.deepEqual(parsePartyAction('sneak to utility'),{kind:'sneak',target:'utility',push:0});
 assert.deepEqual(parsePartyAction('move silently to utility'),{kind:'sneak',target:'utility',push:0});
 assert.equal(parsePartyAction('go utility').kind,'move');
 assert.equal(COMBAT_COST.sneak,'full');
 assert.equal(COMBAT_COST.move,'quick');
});
test('successful stealth movement yields zero noise and never fabricates invisibility',()=>{
 let success=false,failed=false;
 for(let seed=1;seed<250;seed++){
  const s=game(seed);
  const r=partyStep(s,'sneak utility',{actorId:'pc-1',source:'human'});
  assert(r.accepted,r.reason);
  assert.equal(r.state.actors[0].location,'utility');
  const action=r.state.actions.at(-1);
  assert.equal(action.kind,'sneak');
  if(action.success){
   success=true;assert.equal(action.noise,0);
   assert.equal(r.state.actors[0].hidden,false);
  }else{
   failed=true;assert.equal(action.noise,2);
  }
  if(success&&failed)break;
 }
 assert(success&&failed);
});
test('quiet travel can preserve legitimate cover only into another cluttered room',()=>{
 let preserved=false;
 for(let seed=1;seed<250;seed++){
  const s=game(seed);
  s.actors[0].hidden=true;
  const r=partyStep(s,'sneak utility',{actorId:'pc-1',source:'human'});
  if(r.state.actions.at(-1).success){
   assert.equal(r.state.actors[0].hidden,true);
   preserved=true;break;
  }
 }
 assert(preserved);
});
test('failed stealth noises are heard at nearby locations but not across reinforced barriers',()=>{
 let heard=false;
 for(let seed=1;seed<250;seed++){
  const s=game(seed);s.dinosaurs[0].location='lobby';
  const out=partyStep(s,'sneak utility',{actorId:'pc-1',source:'human'});
  if(!out.state.actions.at(-1).success){
   assert.equal(out.state.dinosaurs[0].lastHeard,'utility');
   heard=true;break;
  }
 }
 assert(heard);
});
test('darkness subtracts two human observation dice unless personally carrying a light',()=>{
 const actors=structuredClone(roster.slice(0,2));
 actors.forEach(a=>a.inventory=[]);
 const normal=detectGroupCreature(actors,{seed:61,darkness:false});
 const dark=detectGroupCreature(actors,{seed:61,darkness:true});
 assert.equal(normal.humans[0].baseCount-dark.humans[0].baseCount,2);
 actors[0].inventory.push('flashlight');
 assert(actorHasLight(actors[0]));
 const lit=detectGroupCreature(actors,{seed:61,darkness:true});
 assert.equal(lit.humans[0].baseCount,normal.humans[0].baseCount);
 assert.equal(lit.humans[1].baseCount,dark.humans[1].baseCount);
 assert.deepEqual(lit.creature,normal.creature);
});
test('pursuit memory and source location are not included in a remote survivor view',()=>{
 const s=game();
 s.dinosaurs[0].location='paddock';
 s.dinosaurs[0].lastHeard='shed';s.dinosaurs[0].alert=5;
 const v=partyView(s,{actorId:'pc-2'});
 assert.equal(v.visibleDinosaurs.length,0);
 assert(!('lastHeard' in v));
 assert(!('alert' in v));
 assert(isPartySave(s));
});
test('legacy party save with no new tracking fields remains loadable and deterministic',()=>{
 const s=game(17);
 delete s.dinosaurs[0].lastHeardBeat;
 assert(isPartySave(s));
 const r=partyStep(s,'wait',{actorId:'pc-1',source:'human'});
 assert(r.accepted);
 assert(isPartySave(r.state));
});
test('spectator still progresses one grounded action at a time when stealth is available',()=>{
 const s=game();
 const spectator=setControlMode(s,{mode:'spectator'}).state;
 const result=runAutonomousTurn(spectator,{singleStep:true});
 assert(result.accepted,result.reason);
 assert.equal(result.state.actions.length,1);
 assert.equal(result.state.beat,s.beat+1);
});
test('new stealth controls and revised cache version are present in playable UI',async()=>{
 const html=await readFile(new URL('../party.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8');
 assert(html.includes('party-app.mjs?v=007l2a'));
 assert(app.includes('data-order="sneak '));
 assert(app.includes('v.lighting'));
});

test('moving predator creates only local audible warnings without revealing its route',()=>{
 let s=game(44);
 s.actors[1].location='shed';
 s.dinosaurs[0].location='paddock';
 s.dinosaurs[0].lastHeard='shed';
 s.dinosaurs[0].alert=4;
 let r=partyStep(s,'wait',{actorId:'pc-1',source:'human'});
 assert(r.accepted);s=r.state;
 r=partyStep(s,'wait',{actorId:'pc-2',source:'human'});
 assert(r.accepted);s=r.state;
 assert.equal(s.dinosaurs[0].location,'jungle');
 const nearby=partyView(s,{actorId:'pc-2'}).events;
 const remote=partyView(s,{actorId:'pc-1'}).events;
 assert(nearby.some(e=>e.message==='Heavy footfalls sound somewhere nearby.'));
 assert(!remote.some(e=>e.message==='Heavy footfalls sound somewhere nearby.'));
 assert(!nearby.some(e=>e.message.includes('paddock')&&e.category==='danger'));
});
