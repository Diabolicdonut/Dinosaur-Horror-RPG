import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newPartyIncident,partyStep,partyView,isPartySave,upgradePartySave,parsePartyAction} from '../src/party-engine.mjs';
import {CINEMATIC_DANGERS,currentCinematicAct,availableDangerEvents,dangerAllowed,validDangerRecords} from '../src/cinematic-danger.mjs';
import {setControlMode,setCamera} from '../src/party-director.mjs';
const game=(seed=1993)=>newPartyIncident({seed});
const risk=(s)=>partyStep(s,'danger brace-paddock-gate',{actorId:s.actors[s.cursor].id,source:'human'});
const located=(seed=1993)=>{
 const s=game(seed);s.actors[0].location='paddock';
 s.dinosaurs[0].location='helipad';
 return s;
};
function findResult(success){
 for(let i=1;i<=200;i++){
  const s=located(i),r=risk(s);
  if(r.accepted&&r.result?.success===success)return {before:s,after:r.state,record:r.result};
 }
 throw Error('No deterministic '+success+' fixture found.');
}
test('act progression is purely derived from committed rescue flags',()=>{
 const s=game(),before=JSON.stringify(s);
 assert.equal(currentCinematicAct(s).number,1);
 assert.equal(currentCinematicAct(s).title,'The Silent Park');
 s.flags.power=true;assert.equal(currentCinematicAct(s).number,2);
 s.flags.distress=true;assert.equal(currentCinematicAct(s).number,3);
 assert.equal(currentCinematicAct(s).title,'The Last Signal');
 s.flags.beacon=true;assert.equal(currentCinematicAct(s).title,'The Way Out');
 assert.equal(s.dinosaurs.length,1);assert.notEqual(before,JSON.stringify(s));
});
test('danger event is optional and only available in actual matching zone',()=>{
 const s=game(),a=s.actors[0];
 assert.deepEqual(availableDangerEvents(s,a),[]);
 assert.equal(dangerAllowed(s,a,'brace-paddock-gate'),false);
 a.location='paddock';
 assert.deepEqual(availableDangerEvents(s,a).map(e=>e.id),['brace-paddock-gate']);
 assert.equal(availableDangerEvents(s,a)[0].skill,'heavy_machinery');
 assert.equal(Object.keys(CINEMATIC_DANGERS).length,1);
});
test('invalid or remote danger action spends no time, RNG, supplies or stress',()=>{
 const s=game(),before=JSON.stringify(s);
 for(const cmd of ['danger brace-paddock-gate','danger no-such-gate']){
  const r=partyStep(s,cmd,{actorId:'pc-1',source:'human'});
  assert.equal(r.accepted,false);
  assert.strictEqual(r.state,s);
 }
 assert.equal(JSON.stringify(s),before);
});
test('danger action is a real parsed Jurassic skill check, not free scene narration',()=>{
 assert.equal(parsePartyAction('danger brace-paddock-gate').kind,'danger');
 assert.equal(parsePartyAction('danger brace-paddock-gate').target,'brace-paddock-gate');
 assert.equal(parsePartyAction('push danger brace-paddock-gate').push,1);
 const {before,after,record}=findResult(true);
 assert.equal(after.beat,before.beat+1);
 assert.equal(after.clock.explorationActions,before.clock.explorationActions+1);
 assert.equal(after.dangerRecords.length,1);
 assert.equal(after.actions.at(-1).kind,'danger');
 assert.equal(after.actions.at(-1).success,true);
 assert.equal(after.actions.at(-1).target,'brace-paddock-gate');
 assert.equal(after.actions.at(-1).seed,record.seed);
 assert(Array.isArray(record.base));
 assert.equal(after.flags.paddockGateBraced,true);
 assert.equal(before.flags.paddockGateBraced,false);
 assert.equal(after.dinosaurs.length,1);
 assert(isPartySave(after));
});
test('success permanently resolves the gate without altering rescue or monster position',()=>{
 const {before,after}=findResult(true);
 assert.equal(after.flags.paddockGateBraced,true);
 assert.equal(after.flags.power,false);
 assert.equal(after.flags.distress,false);
 assert.equal(after.flags.beacon,false);
 assert.equal(after.dinosaurs[0].location,before.dinosaurs[0].location);
 assert.deepEqual(availableDangerEvents(after,after.actors[0]),[]);
 assert.equal(after.events.some(e=>e.category==='milestone'&&e.message.includes('stops swinging')),true);
});
test('failed physical hazard makes consequential noise, does not mark success, and remains playable',()=>{
 const {before,after,record}=findResult(false);
 assert.equal(record.success,false);
 assert.equal(after.flags.paddockGateBraced,false);
 assert.equal(after.dangerRecords[0].success,false);
 assert.equal(after.actions.at(-1).noise,3);
 assert(after.events.some(e=>e.category==='risk'&&e.message.includes('loud clang')));
 assert.equal(after.flags.power,before.flags.power);
 assert.equal(after.outcome,'playing');
 assert.equal(before.actions.length,0);
 assert(isPartySave(after));
});
test('actor cannot reroll same hazard freely; another present survivor can attempt after failure',()=>{
 const {after}=findResult(false);
 const snapshot=JSON.stringify(after);
 const old=partyStep(after,'danger brace-paddock-gate',{actorId:'pc-1',source:'human'});
 assert.equal(old.accepted,false);
 assert.equal(JSON.stringify(after),snapshot);
 after.actors[1].location='paddock';
 const other=partyStep(after,'danger brace-paddock-gate',{actorId:'pc-2',source:'human'});
 assert(other.accepted,other.reason);
 assert.equal(other.state.dangerRecords.length,2);
 assert(isPartySave(other.state));
});
test('invalid hazard histories fail save validation; old saves without fields still work',()=>{
 const s=game();
 delete s.dangerRecords;delete s.flags.paddockGateBraced;
 assert(isPartySave(s));assert(isPartySave(upgradePartySave(s)));
 s.dangerRecords=[{id:'brace-paddock-gate',zone:'paddock',actorId:'pc-1',beat:0,success:false,successes:0}];
 assert(isPartySave(s));
 s.dangerRecords.push({...s.dangerRecords[0]});assert(!isPartySave(s));
 s.dangerRecords.pop();s.dangerRecords[0].zone='control';assert(!isPartySave(s));
 s.dangerRecords[0].zone='paddock';s.dangerRecords[0].actorId='ghost';assert(!isPartySave(s));
 s.dangerRecords[0].actorId='pc-1';s.flags.paddockGateBraced='yes';assert(!isPartySave(s));
});
test('physical danger cannot interrupt active combat or incapacitated actors',()=>{
 const s=located();
 s.actors[0].broken=true;
 assert.equal(dangerAllowed(s,s.actors[0],'brace-paddock-gate'),false);
 s.actors[0].broken=false;
 s.combat={active:true};
 assert.equal(dangerAllowed(s,s.actors[0],'brace-paddock-gate'),false);
});
test('act indicator and hazard availability honor character camera and control switching',()=>{
 let s=located(),rng=s.rng;
 s.actors[1].location='control';
 s=setControlMode(s,{mode:'spectator'}).state;
 s=setCamera(s,{mode:'actor',actorId:'pc-2'}).state;
 const nearby=partyView(s,{actorId:'pc-1'}),remote=partyView(s,{actorId:'pc-2'});
 assert.equal(nearby.cinematicAct.number,1);
 assert.equal(nearby.availableDangerEvents.length,1);
 assert.deepEqual(remote.availableDangerEvents,[]);
 assert.equal(s.rng,rng);
 assert(!('dangerRecords' in remote));
 assert(!('paddockGateBraced' in remote.flags));
 assert(!('paddockGateBraced' in nearby.flags));
 assert(isPartySave(s));
});
test('repeat seed and action yield exactly the same Evolved outcome and world consequence',()=>{
 const a=risk(located(77)),b=risk(located(77));
 assert(a.accepted&&b.accepted);
 assert.deepEqual(a.state,b.state);
 assert.equal(a.state.actions.at(-1).seed,b.state.actions.at(-1).seed);
 assert.deepEqual(a.state.dinosaurs,b.state.dinosaurs);
});
test('browser exposes real current-act and optional skill challenge, not an auto attack',async()=>{
 const [html,app,engine]=await Promise.all([
  readFile(new URL('../party.html',import.meta.url),'utf8'),
  readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8'),
  readFile(new URL('../src/party-engine.mjs',import.meta.url),'utf8')
 ]);
 assert(html.includes('party-app.mjs?v=009c2'));
 assert(app.includes('party-engine.mjs?v=009c2'));
 assert(app.includes('CINEMATIC ACT'));
 assert(app.includes('Attempt challenge'));
 assert(engine.includes("result(hazard.skill,hazard.context)"));
 assert(engine.includes('validDangerRecords(s)'));
 assert(!engine.includes('islandPopulation'));
});
