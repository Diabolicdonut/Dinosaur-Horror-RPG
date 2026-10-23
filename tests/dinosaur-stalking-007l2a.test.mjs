import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,partyStep,isPartySave,partyView} from '../src/party-engine.mjs';
import {huntDecision,validCreatureFacing,creatureFacesZone,faceClue} from '../src/dinosaur-hunt.mjs';
import {visibleLampZone,creatureRoute} from '../src/dinosaur-pursuit.mjs';
import {setControlMode,setCamera,actorObservation,runAutonomousTurn} from '../src/party-director.mjs';

const roster=makeParty({seed:840,size:3,careers:['ranger','maintenance','medic']});
const game=(seed=1993)=>newPartyIncident({seed,roster});
const act=(s,order='wait')=>partyStep(s,order,{actorId:s.actors[s.cursor].id,source:'human'});
const hunter=(location,clue,alert=3)=>({id:'raptor-1',kind:'Velociraptor',
 location,facing:location==='paddock'?'jungle':'helipad',lastHeard:clue,alert});

test('007-L2a low alert stalks by slow legal single-zone approach, never teleporting',()=>{
 const d=hunter('paddock','shed',3);
 assert.deepEqual(creatureRoute('paddock','shed'),['paddock','jungle','shed']);
 const pause=huntDecision(d,{beat:1});
 assert.equal(pause.behavior,'stalk');assert.equal(pause.location,'paddock');
 assert.equal(pause.moved,false);assert.equal(pause.facing,'jungle');
 const move=huntDecision(d,{beat:3});
 assert.equal(move.location,'jungle');assert.equal(move.moved,true);
 assert.equal(move.facing,'shed');
});
test('stronger evidence investigates on a faster physical schedule',()=>{
 const d=hunter('paddock','shed',5);
 const r=huntDecision(d,{beat:1});
 assert.equal(r.behavior,'investigate');
 assert.equal(r.location,'jungle');assert.equal(r.moved,true);
 assert.equal(r.facing,'shed');
});
test('secured maintenance door blocks stalking despite an audible clue',()=>{
 const d=hunter('utility','shed',5);d.facing='control';
 const blocked=huntDecision(d,{beat:1});
 assert.equal(blocked.blocked,true);assert.equal(blocked.location,'utility');
 assert.equal(blocked.facing,'control');
 const breached=huntDecision(d,{beat:1,shedDoorBreached:true});
 assert.equal(breached.blocked,false);assert.equal(breached.location,'shed');
});
test('predator faces first legitimate step towards heard clue, not a magical remote coordinate',()=>{
 const d=hunter('paddock','control',3);
 assert.equal(faceClue(d),'jungle');
 d.location='utility';d.facing='control';d.lastHeard='shed';
 assert.equal(faceClue(d),'control');
 assert.equal(faceClue(d,{shedDoorBreached:true}),'shed');
});
test('facing limits visual opportunity independently of passable exits and sound',()=>{
 const d=hunter('jungle',null,0);
 d.facing='helipad';
 assert.equal(creatureFacesZone(d,'shed'),false);
 assert.equal(creatureFacesZone(d,'helipad'),true);
 assert.equal(creatureFacesZone(d,'jungle'),true);
 d.facing='shed';assert.equal(creatureFacesZone(d,'shed'),true);
 assert.equal(creatureFacesZone(d,'paddock'),false); // thick foliage
});
test('lights attract the raptor only from its actual facing cone',()=>{
 const actor={location:'shed',inventory:['flashlight'],light:{on:true,charge:8}};
 assert.equal(visibleLampZone('jungle',[actor],{facing:'helipad'}),null);
 assert.equal(visibleLampZone('jungle',[actor],{facing:'shed'}),'shed');
 assert.equal(visibleLampZone('jungle',[actor],{facing:null}),'shed');
});
test('hearing can turn the predator independently of whether it can see a light',()=>{
 const s=game(208),d=s.dinosaurs[0];
 d.location='jungle';d.facing='helipad';d.alert=0;d.lastHeard=null;
 s.actors[0].location='shed';s.actors[0].light.on=true;
 const no=act(s,'wait');
 assert(no.accepted);assert.equal(no.state.dinosaurs[0].lastHeard,null);
 const look=structuredClone(s);look.dinosaurs[0].facing='shed';
 const yes=act(look,'wait');
 assert(yes.accepted);assert.equal(yes.state.dinosaurs[0].lastHeard,'shed');
 assert.equal(yes.state.dinosaurs[0].lastClue,'light');
});
test('active engine stalking delays travel, records legal moves and decays interest',()=>{
 let s=game(106);
 s.dinosaurs[0].location='paddock';s.dinosaurs[0].lastHeard='shed';
 s.dinosaurs[0].alert=3;s.dinosaurs[0].facing='jungle';
 s=act(s).state;s=act(s).state;
 assert.equal(s.dinosaurs[0].location,'paddock');
 assert.equal(s.dinosaurs[0].lastHunt.behavior,'stalk');
 assert.equal(s.dinosaurs[0].lastHunt.to,'paddock');
 s=act(s).state;s=act(s).state;
 assert.equal(s.dinosaurs[0].location,'jungle');
 assert.equal(s.dinosaurs[0].lastHunt.to,'jungle');
 assert.equal(s.dinosaurs[0].facing,'shed');
 assert(isPartySave(s));
});
test('blocked route consumes no secret movement or free action and alert expires',()=>{
 let s=game(309);s.dinosaurs[0].location='utility';
 s.dinosaurs[0].facing='control';s.dinosaurs[0].lastHeard='shed';
 s.dinosaurs[0].alert=4;
 for(let i=0;i<10;i++)s=act(s).state;
 assert.equal(s.dinosaurs[0].location,'utility');
 assert.equal(s.dinosaurs[0].alert,0);
 assert.equal(s.dinosaurs[0].lastHeard,null);
});
test('invalid facing and last hunt records cannot enter a v3 save',()=>{
 const s=game();
 assert(isPartySave(s));
 s.dinosaurs[0].facing='helipad';assert(!isPartySave(s));
 s.dinosaurs[0].facing='jungle';assert(isPartySave(s));
 s.dinosaurs[0].lastHunt={beat:0,from:'narnia',to:'paddock',blocked:false,behavior:'stalk'};
 assert(!isPartySave(s));
 delete s.dinosaurs[0].lastHunt;delete s.dinosaurs[0].facing;
 assert(isPartySave(s)); // historic v3 party saves have no facing
});
test('planner rejects invalid time and unimplemented species, without touching world',()=>{
 const s=game(),d=s.dinosaurs[0],before=structuredClone(s);
 assert.throws(()=>huntDecision(d,{beat:-1}),RangeError);
 assert.throws(()=>huntDecision({...d,kind:'Tyrannosaurus'},{beat:1}),RangeError);
 assert.deepEqual(s,before);
 assert.equal(validCreatureFacing('paddock','bogus'),false);
});
test('camera and control switching do not turn the predator or spend random draws',()=>{
 let s=game();const original=structuredClone(s.dinosaurs[0]),rng=s.rng;
 s=setControlMode(s,{mode:'spectator'}).state;
 s=setCamera(s,{mode:'actor',actorId:'pc-2'}).state;
 assert.equal(s.rng,rng);assert.deepEqual(s.dinosaurs[0],original);
 assert.equal(s.actions.length,0);assert.equal(s.clock.explorationActions,0);
});
test('private hunt decisions do not leak via local character view or autonomous observation',()=>{
 const s=game(),d=s.dinosaurs[0];
 d.lastHunt={beat:0,from:'jungle',to:'paddock',behavior:'stalk',blocked:false};
 d.lastHeard='control';d.alert=3;
 const view=partyView(s,{actorId:'pc-2'}),obs=actorObservation(s,'pc-2');
 for(const k of ['lastHunt','facing','lastHeard','lastClue']){assert(!(k in view));assert(!(k in obs));}
 assert(!JSON.stringify(obs).includes('paddock'));
});
test('save/reload during pursuit produces identical seeded decision history',()=>{
 let s=game(215);
 s.dinosaurs[0].lastHeard='shed';s.dinosaurs[0].alert=3;
 const copy=JSON.parse(JSON.stringify(s));
 let a=s,b=copy;
 for(let i=0;i<6;i++){
  const x=act(a),y=act(b);assert.deepEqual(x,y);
  a=x.state;b=y.state;
 }
 assert(isPartySave(a));assert.equal(a.rng,b.rng);
});
test('spectator actions use the same hunt planner and preserve personal wonder journal',()=>{
 let s=game(216);
 s.actors[0].wonderJournal=[{id:'rainforest-horizon',room:'control',title:'Rainforest Horizon',
   description:'Original',kind:'rainforest'}]; // legal scenario entry is validated by id
 assert(isPartySave(s));
 s.dinosaurs[0].lastHeard='shed';s.dinosaurs[0].alert=3;
 s=setControlMode(s,{mode:'spectator'}).state;
 const out=runAutonomousTurn(s,{singleStep:true});
 assert(out.accepted,out.reason);
 assert.deepEqual(out.state.actors[0].wonderJournal,s.actors[0].wonderJournal);
 assert(isPartySave(out.state));
});

test('a remembered flashlight sighting does not count as currently visible after switch-off',()=>{
 const s=game(415),d=s.dinosaurs[0];
 d.location='jungle';d.facing='shed';d.lastHeard='shed';d.lastClue='light';d.alert=4;
 // Light is off; the animal retains a finite clue but no active visual target.
 s.actors[0].location='shed';s.actors[0].light.on=false;
 const r=act(s,'wait');
 assert(r.accepted);
 assert.equal(r.state.dinosaurs[0].behavior,'investigate');
 assert.notEqual(r.state.dinosaurs[0].behavior,'engage');
});
test('save validation rejects fabricated nonlocal hunt steps and future decisions',()=>{
 const s=game(416);
 s.dinosaurs[0].lastHunt={beat:0,from:'control',to:'paddock',behavior:'stalk',blocked:false};
 assert.equal(isPartySave(s),false);
 s.dinosaurs[0].lastHunt={beat:100,from:'paddock',to:'paddock',behavior:'stalk',blocked:false};
 assert.equal(isPartySave(s),false);
 s.dinosaurs[0].lastHunt={beat:0,from:'paddock',to:'jungle',behavior:'stalk',blocked:false};
 assert(isPartySave(s));
});
