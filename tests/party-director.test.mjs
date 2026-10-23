import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,partyStep,isPartySave,upgradePartySave,
 PARTY_ENGINE_VERSION,partyView} from '../src/party-engine.mjs';
import {CONTROL_MODES,SPEED_OPTIONS,currentOwner,cameraActorId,setControlMode,
 setFocusActor,setCamera,setPlayback,actorObservation,chooseCompanionAction,
 runAutonomousTurn} from '../src/party-director.mjs';

const roster=makeParty({seed:1993,size:3,careers:['ranger','maintenance','scientist']});
const start=()=>newPartyIncident({seed:1993,roster});
const assertAction=(r)=>{assert.equal(r.accepted,true,r.reason);return r.state;};
const spectator=()=>{
 const r=setControlMode(start(),{mode:'spectator'});
 assert(r.accepted);return r.state;
};
test('control modes and supported AI display pacing are explicit',()=>{
 assert.deepEqual(CONTROL_MODES,['party','focus','spectator']);
 assert.deepEqual(SPEED_OPTIONS,[400,800,1200,2000]);
 const s=start();assert.equal(PARTY_ENGINE_VERSION,3);
 assert.equal(s.control.mode,'party');assert.equal(currentOwner(s),'human');
 assert.equal(s.control.paused,true);
});
test('switch modes is non-temporal: RNG, world state and old actions unchanged',()=>{
 let s=start();
 s=assertAction(partyStep(s,'move lobby',{actorId:'pc-1'}));
 const before={beat:s.beat,rng:s.rng,actions:structuredClone(s.actions),
   rooms:structuredClone(s.rooms),actors:structuredClone(s.actors),dinosaurs:structuredClone(s.dinosaurs)};
 const r=setControlMode(s,{mode:'focus',focusedActorId:'pc-2'});
 assert(r.accepted);
 const after=r.state;
 assert.equal(after.beat,before.beat);
 assert.equal(after.rng,before.rng);
 for(const key of ['actions','rooms','actors','dinosaurs'])
   assert.deepEqual(after[key],before[key],key);
 assert.equal(after.control.paused,true);
 assert.equal(after.controlHistory.at(-1).beat,before.beat);
 assert.equal(after.controlHistory.at(-1).focusedActorId,'pc-2');
});
test('invalid mode or ineligible character cannot hijack control',()=>{
 const s=start(),json=JSON.stringify(s);
 assert.equal(setControlMode(s,{mode:'infinite'}).accepted,false);
 assert.equal(setControlMode(s,{mode:'focus',focusedActorId:'pc-999'}).accepted,false);
 assert.equal(setFocusActor(s,'pc-999').accepted,false);
 assert.equal(JSON.stringify(s),json);
});
test('focus mode controls exactly the selected actor; computer owns all other turns',()=>{
 let s=assertAction(setControlMode(start(),{mode:'focus',focusedActorId:'pc-2'}));
 assert.equal(currentOwner(s),'ai');
 const human=partyStep(s,'wait',{actorId:'pc-1',source:'human'});
 assert.equal(human.accepted,false);
 s=assertAction(runAutonomousTurn(s,{singleStep:true}));
 assert.equal(s.cursor,1);
 assert.equal(currentOwner(s),'human');
 assert.equal(runAutonomousTurn(s,{singleStep:true}).accepted,false);
 s=assertAction(partyStep(s,'wait',{actorId:'pc-2',source:'human'}));
 assert.equal(s.cursor,2);assert.equal(currentOwner(s),'ai');
});
test('focus character switching works at any boundary without spending turns',()=>{
 let s=assertAction(setControlMode(start(),{mode:'focus',focusedActorId:'pc-1'}));
 const before=JSON.stringify(s.actions),clock=s.beat;
 const choice=setFocusActor(s,'pc-3');assert(choice.accepted);s=choice.state;
 assert.equal(s.control.focusedActorId,'pc-3');
 assert.equal(currentOwner(s),'ai');
 assert.equal(s.control.paused,true);
 assert.equal(s.beat,clock);assert.equal(JSON.stringify(s.actions),before);
 assert.deepEqual(s.actors.map(a=>a.id),['pc-1','pc-2','pc-3']);
});
test('Party mode does not silently allow computer to act for a player',()=>{
 const s=start(),before=JSON.stringify(s);
 assert.equal(partyStep(s,'wait',{source:'ai'}).accepted,false);
 assert.equal(runAutonomousTurn(s,{singleStep:true}).accepted,false);
 assert.equal(JSON.stringify(s),before);
});
test('spectator disallows human action, allows one AI action at a time',()=>{
 let s=spectator();const before=JSON.stringify(s);
 assert.equal(currentOwner(s),'ai');
 assert.equal(partyStep(s,'wait',{source:'human'}).accepted,false);
 assert.equal(JSON.stringify(s),before);
 s=assertAction(runAutonomousTurn(s,{singleStep:true}));
 assert.equal(s.beat,1);assert.equal(s.actions.length,1);assert.equal(s.aiDecisions.length,1);
 assert.equal(s.aiDecisions[0].actorId,'pc-1');
 assert.equal(s.aiDecisions[0].actionIndex,0);
});
test('pause prohibits automatic advance, step advances exactly one committed action',()=>{
 let s=spectator(),json=JSON.stringify(s);
 assert.equal(runAutonomousTurn(s).accepted,false);
 assert.equal(JSON.stringify(s),json);
 s=assertAction(runAutonomousTurn(s,{singleStep:true}));
 assert.equal(s.beat,1);
 assert.equal(s.aiDecisions.length,1);
 assert.equal(s.control.paused,true);
 assert.equal(runAutonomousTurn(s).accepted,false);
 assert.equal(s.beat,1);
});
test('resume and pause controls change only playback state and epoch',()=>{
 let s=spectator();const oldRng=s.rng;
 s=assertAction(setPlayback(s,{paused:false,speedMs:400}));
 assert.equal(s.control.paused,false);
 assert.equal(s.control.speedMs,400);
 assert.equal(s.rng,oldRng);assert.equal(s.beat,0);
 s=assertAction(runAutonomousTurn(s));
 assert.equal(s.beat,1);
 const step1=s.beat,rng1=s.rng;
 s=assertAction(setPlayback(s,{paused:true}));
 assert.equal(s.beat,step1);assert.equal(s.rng,rng1);
 assert.equal(runAutonomousTurn(s).accepted,false);
});
test('AI checks expected beat and control epoch to reject stale scheduled actions',()=>{
 let s=spectator();
 const {beat,epoch}= {beat:s.beat,epoch:s.control.epoch};
 s=assertAction(setPlayback(s,{paused:false}));
 assert.equal(runAutonomousTurn(s,{expectedBeat:beat,expectedEpoch:epoch}).accepted,false);
 assert.equal(s.beat,beat);
 assert.equal(runAutonomousTurn(s,{expectedBeat:beat+1,expectedEpoch:s.control.epoch}).accepted,false);
 s=assertAction(runAutonomousTurn(s,{expectedBeat:beat,expectedEpoch:s.control.epoch}));
 assert.equal(s.beat,beat+1);
});
test('camera can be changed independently of actor control and action budget',()=>{
 let s=assertAction(setControlMode(start(),{mode:'focus',focusedActorId:'pc-1'}));
 const epoch=s.control.epoch;
 s=assertAction(setCamera(s,{mode:'actor',actorId:'pc-3'}));
 assert.equal(s.control.cameraMode,'actor');assert.equal(cameraActorId(s),'pc-3');
 assert.equal(s.control.focusedActorId,'pc-1');
 assert.equal(s.beat,0);assert.equal(s.actions.length,0);
 assert(s.control.epoch>epoch);
 s=assertAction(setCamera(s,{mode:'follow'}));
 assert.equal(cameraActorId(s),'pc-1');
});
test('unknown camera and invalid playback speed are rejected without mutation',()=>{
 const s=start(),before=JSON.stringify(s);
 assert.equal(setCamera(s,{mode:'actor',actorId:'pc-x'}).accepted,false);
 assert.equal(setCamera(s,{mode:'omniscient'}).accepted,false);
 assert.equal(setPlayback(s,{speedMs:15}).accepted,false);
 assert.equal(setPlayback(s,{paused:'true'}).accepted,false);
 assert.equal(JSON.stringify(s),before);
});
test('camera actor observations only reveal local actor, scene and nearby allies, not secrets',()=>{
 const s=start();
 const projection=actorObservation(s,'pc-1');
 assert.deepEqual(projection.dinosaurs,[]);
 assert(projection.exits.includes('lobby'));
 assert.equal(projection.location,'control');
 assert.equal(projection.nearbyAllies.length,2);
 assert(!('dinosaurs' in projection.mission));
 assert(!('rng' in projection));
 assert(!('rooms' in projection));
 assert(!('allActorInventories' in projection));
 assert(!('allActorObservations' in projection));
});
test('AI choice is unchanged by hidden dinosaur relocation outside the observer room',()=>{
 const s=start(),p=structuredClone(s);
 p.dinosaurs[0].location='jungle';
 const a=actorObservation(s,'pc-1'),b=actorObservation(p,'pc-1');
 assert.deepEqual(a,b);
 assert.deepEqual(chooseCompanionAction(a),chooseCompanionAction(b));
});
test('visible dinosaur causes concealment, not arbitrary hidden location attack',()=>{
 const s=start(),p=structuredClone(s);
 p.dinosaurs[0].location='control';
 const observed=actorObservation(p,'pc-1');
 assert.deepEqual(observed.dinosaurs,['Velociraptor']);
 assert.equal(chooseCompanionAction(observed).kind,'hide');
 p.actors[0].hidden=true;
 assert.equal(chooseCompanionAction(actorObservation(p,'pc-1')).kind,'wait');
});
test('autonomous survivor follows physically legal park map and acquires accessible keycard',()=>{
 let s=spectator();
 const decisions=[];
 for(let i=0;i<9;i++){
  const r=runAutonomousTurn(s,{singleStep:true});
  assert(r.accepted,r.reason);
  decisions.push(r.decision);
  s=r.state;
 }
 assert(decisions.some(d=>d.proposed.goal==='find_access_card'));
 assert(s.actions.every(a=>s.actors.some(actor=>actor.id===a.actorId)));
 assert(s.rooms.lobby.items.length===0||s.actors.some(a=>a.inventory.includes('keycard')));
 assert.equal(s.beat,9);
 assert(isPartySave(s));
});
test('the same spectator seed and roster produce byte-identical event and decision journals',()=>{
 const walk=()=>{
  let s=spectator();
  for(let i=0;i<35&&s.outcome==='playing';i++)
    s=assertAction(runAutonomousTurn(s,{singleStep:true}));
  return s;
 };
 const x=walk(),y=walk();
 assert.deepEqual(x,y);
 assert(x.aiDecisions.length>0);
 assert(x.actions.length>0);
});
test('AI proposals and results survive a mode switch and an uninterrupted deterministic replay',()=>{
 let s=spectator();
 for(let i=0;i<4;i++)s=assertAction(runAutonomousTurn(s,{singleStep:true}));
 const saved=JSON.parse(JSON.stringify(s));
 s=assertAction(setControlMode(s,{mode:'party'}));
 assert.equal(s.aiDecisions.length,saved.aiDecisions.length);
 assert.deepEqual(s.dinosaurs,saved.dinosaurs);
 assert.equal(s.rng,saved.rng);
 assert.equal(currentOwner(s),'human');
 s=assertAction(partyStep(s,'wait',{source:'human',actorId:s.actors[s.cursor].id}));
 assert.equal(s.aiDecisions.length,saved.aiDecisions.length);
 assert.equal(s.beat,saved.beat+1);
});
test('007-C party save migrates without replaying actions, dice, inventory, or dinosaur turns',()=>{
 let s=start();
 s=assertAction(partyStep(s,'move lobby',{source:'human'}));
 s=assertAction(partyStep(s,'wait',{source:'human'}));
 const old=structuredClone(s),before=JSON.stringify(s);
 old.version=2;delete old.control;delete old.controlHistory;delete old.aiDecisions;
 for(const a of old.actors){delete a.visitedRooms;delete a.attemptedObservations;}
 assert.equal(isPartySave(old),false);
 const newer=upgradePartySave(old);
 assert(isPartySave(newer));
 assert.equal(newer.control.mode,'party');
 assert.equal(newer.control.paused,true);
 assert.equal(newer.beat,old.beat);
 assert.equal(newer.rng,old.rng);
 assert.deepEqual(newer.rooms,old.rooms);
 assert.deepEqual(newer.dinosaurs,old.dinosaurs);
 assert.deepEqual(newer.actions,old.actions);
 assert.deepEqual(newer.actors.map(a=>a.inventory),old.actors.map(a=>a.inventory));
 assert.equal(JSON.stringify(s),before,'Migration is pure and does not mutate source.');
 assert(newer.actors[0].visitedRooms.includes('lobby'));
});
test('migration rejects an incompatible singleton save and cannot downgrade version 3',()=>{
 const s=start();
 assert.deepEqual(upgradePartySave(s),s);
 assert.throws(()=>upgradePartySave({kind:'other',version:2}),RangeError);
 const invalid=structuredClone(s);invalid.version=5;
 assert.throws(()=>upgradePartySave(invalid),RangeError);
});
test('manual party mode after spectator remains the same Evolved rules outcome for equal seed and action',()=>{
 const original=start();
 const look=spectator();
 const returned=assertAction(setControlMode(look,{mode:'party'}));
 const first=assertAction(partyStep(original,'hide',{source:'human',actorId:original.actors[0].id}));
 const second=assertAction(partyStep(returned,'hide',{source:'human',actorId:returned.actors[0].id}));
 assert.equal(first.actions[0].seed,second.actions[0].seed);
 assert.deepEqual(first.actions[0].base,second.actions[0].base);
 assert.deepEqual(first.actions[0].stressDice,second.actions[0].stressDice);
});
test('UI mode controls and versioned browser entrypoint exist and parse',async()=>{
 const html=await readFile(new URL('../party.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8');
 for(const id of ['owner','control-summary','control-mode','focus-actor','camera-mode',
  'camera-actor','sim-step','sim-pause','sim-resume','playback-speed','playback-status'])
  assert(html.includes('id="'+id+'"'),id);
 assert(html.includes('./src/party-app.mjs?v=007j'));
 assert(app.includes("from './party-director.mjs?v=007j'"));
 assert(app.includes("upgradePartySave(loaded)"));
 assert(app.includes('expectedEpoch'));
 assert(app.includes('document.hidden'));
 assert(!app.includes('dinosaur-rpg-save'));
 for(const path of ['../src/party-engine.mjs','../src/party-director.mjs','../src/party-app.mjs']){
  const file=new URL(path,import.meta.url);
  const check=spawnSync(process.execPath,['--check',file.pathname],{encoding:'utf8'});
  assert.equal(check.status,0,path+': '+check.stderr);
 }
});

test('spectator can complete objectives in a controlled no-predator fixture',()=>{
 let s=spectator();
 s.dinosaurs[0].defeated=true; // Isolate reasoning about goals from independent lethal encounter risk.
 let poweredAt=null;
 for(let i=0;i<400&&s.outcome==='playing';i++){
  const result=runAutonomousTurn(s,{singleStep:true});
  assert(result.accepted,result.reason);
  s=result.state;
  if(s.flags.power&&poweredAt===null)poweredAt=s.beat;
  assert(isPartySave(s));
 }
 assert(s.actions.some(a=>a.kind==='take'&&a.target==='keycard'),
   'an AI survivor should physically recover the unique visible staff card');
 assert(poweredAt!==null,'a card-holding AI survivor should eventually reach the shed and restore power');
 assert(s.flags.distress,'a survivor should successfully send a radio distress call');
 assert(s.flags.beacon,'autonomous survivors should eventually activate the beacon');
 assert.equal(s.outcome,'rescued');
 assert(s.beat>=poweredAt);
 assert(s.aiDecisions.length>0);
});

test('malformed save actor collection is rejected instead of throwing during control validation',()=>{
 const invalid=start();invalid.actors={};
 assert.equal(isPartySave(invalid),false);
 const missing=start();missing.control.focusedActorId='pc-missing';
 assert.equal(isPartySave(missing),false);
});
