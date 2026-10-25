import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,isPartySave,partyStep,partyView,upgradePartySave} from '../src/party-engine.mjs';
import {setControlMode,currentOwner,actorObservation,chooseCompanionAction,runAutonomousTurn} from '../src/party-director.mjs';
import {compileSelectedAdventure} from '../src/adventure-catalog.mjs';
import {objectiveStatus} from '../src/adventure-objectives.mjs';
const one=makeParty({seed:88,size:1,careers:['scientist']});
const fresh=(seed=88)=>newPartyIncident({adventureId:'ridge-survey',seed,roster:one});
const step=(s,cmd,source='human')=>{
 const r=partyStep(s,cmd,{actorId:s.actors[s.cursor].id,source});
 assert.equal(r.accepted,true,cmd+' '+r.reason);
 return r.state;
};
test('009-B2b1: selected scenario launches structurally different map and no rescue flag leakage',()=>{
 const s=fresh();
 assert.equal(s.scenario,'ridge-survey');
 assert.equal(s.actors[0].location,'field-camp');
 assert.equal(s.adventureBinding.id,'ridge-survey');
 assert.deepEqual(Object.keys(s.rooms).sort(),Object.keys(compileSelectedAdventure('ridge-survey',0).definition.rooms).sort());
 assert.deepEqual(s.flags,{dataRecovered:false,reportSent:false,teamWithdrawn:false});
 assert.equal(isPartySave(s),true);
 const v=partyView(s);
 assert.equal(v.adventureTitle,'The Long Count');
 assert.deepEqual(v.exits.map(x=>x.id),['rocky-ascent','river-crossing']);
 assert.equal(v.objectives.length,3);
 assert.equal(v.objectivePlan[0].room,'forest-blind');
 assert.equal(v.visibleDinosaurs.length,0);
});
test('009-B2b1: first adventure still uses old identical legacy schema and mechanics',()=>{
 const old=newPartyIncident({seed:88,roster:one});
 assert.equal(old.scenario,'nublar-incident-1993');
 assert.equal(old.actors[0].location,'control');
 assert.equal(old.adventureBinding.id,'nublar-after-the-storm');
 assert.equal(isPartySave(old),true);
 assert.equal(partyView(old).roomName,'Visitor Center Control Room');
 assert.throws(()=>newPartyIncident({adventureId:'unknown',roster:one}),RangeError);
});
test('009-B2b1: legal adjacent research movement and authored stock remain physical',()=>{
 let s=fresh();
 const before=structuredClone(s);
 const rejected=partyStep(s,'move helipad');
 assert.equal(rejected.accepted,false);
 assert.deepEqual(s,before);
 s=step(s,'take field-notes');
 assert.equal(s.actors[0].inventory.includes('field-notes'),true);
 s=step(s,'move river-crossing');
 s=step(s,'move forest-blind');
 assert.equal(s.actors[0].location,'forest-blind');
 assert.equal(s.actors[0].visitedRooms.includes('river-crossing'),true);
 assert.equal(isPartySave(s),true);
});
test('009-B2b1: no remote objective or no-roll AI shortcut can bypass research methods',()=>{
 const s=fresh();
 for(const cmd of ['use survey records','use field transmitter','use return to safety',
  {kind:'objective',target:'walk-out'},'move helipad']){
  const r=partyStep(s,cmd);
  assert.equal(r.accepted,false,JSON.stringify(cmd));
  assert.strictEqual(r.state,s);
 }
});
test('009-B2b1: Evolved Observation success authorizes research, failure costs time but not progress',()=>{
 let ok=null,fail=null;
 for(let seed=1;seed<=180&&(!ok||!fail);seed++){
  const s=fresh(seed);
  s.actors[0].location='forest-blind';
  const r=partyStep(s,'use survey records');
  assert.equal(r.accepted,true);
  if(r.result.success)ok=r;else fail=r;
 }
 assert.ok(ok);assert.ok(fail);
 assert.equal(ok.state.flags.dataRecovered,true);
 assert.equal(ok.state.objectiveRecords[0].id,'recover-transect');
 assert.equal(fail.state.flags.dataRecovered,false);
 assert.equal(fail.state.objectiveRecords.length,0);
 assert.equal(fail.state.beat,1);
 assert.equal(isPartySave(ok.state),true);
 assert.equal(isPartySave(fail.state),true);
});
test('009-B2b1: completed research has source-legal second skill and routine final walk-out',()=>{
 let completed=null;
 for(let seed=1;seed<=160&&!completed;seed++){
  let s=fresh(seed);
  s=step(s,'move river-crossing');s=step(s,'move forest-blind');
  for(let n=0;n<16&&!s.flags.dataRecovered;n++)s=step(s,'use survey records');
  if(!s.flags.dataRecovered)continue;
  s=step(s,'move survey-ridge');
  for(let n=0;n<16&&!s.flags.reportSent;n++)s=step(s,'use field transmitter');
  if(!s.flags.reportSent)continue;
  s=step(s,'move rocky-ascent');s=step(s,'move field-camp');
  const beforeRng=s.rng;
  s=step(s,'use return to safety');
  assert.equal(s.rng,beforeRng,'routine action cannot secretly draw dice');
  completed=s;
 }
 assert.ok(completed,'tested source Evolved checks permit a completed run');
 assert.equal(completed.outcome,'rescued');
 assert.equal(completed.adventureOutcome,'completed');
 assert.equal(completed.flags.teamWithdrawn,true);
 assert.deepEqual(objectiveStatus(compileSelectedAdventure('ridge-survey',0),completed).completedIds,
  ['recover-transect','send-field-report','walk-out']);
 assert.equal(isPartySave(completed),true);
 assert.equal(partyView(completed).objectives.every(o=>o.done),true);
 assert.equal(partyStep(completed,'wait').accepted,false);
});
test('009-B2b1: peaceful dinosaur appears only in its physical observation zone',()=>{
 let s=fresh();
 assert.equal(partyView(s).wildlifeEncounter,null);
 s=step(s,'move rocky-ascent');s=step(s,'move survey-ridge');
 const v=partyView(s);
 assert.match(v.wildlifeEncounter.title,/parasaurolophus/);
 assert.equal(v.visibleDinosaurs.length,0,'no hostile combat action invented for a neutral animal');
 const beforeRng=s.rng;
 s=step(s,'wildlife watch');
 assert.equal(s.rng,beforeRng);
 assert.equal(s.beat,3);
 assert.equal(isPartySave(s),true);
});
test('009-B2b1: movement and inventory remain valid across distinct one-survivor saves',()=>{
 let a=fresh(70),b=fresh(71);
 a=step(a,'take field-notes');
 b=step(b,'move rocky-ascent');
 assert.equal(b.rooms['field-camp'].items.includes('field-notes'),true);
 assert.equal(a.rooms['field-camp'].items.includes('field-notes'),false);
 assert.equal(isPartySave(a),true);assert.equal(isPartySave(b),true);
});
test('009-B2b1: two-person actual handoff conserves item counts and requires colocation',()=>{
 const party=makeParty({seed:81,size:2});
 let s=newPartyIncident({adventureId:'ridge-survey',seed:81,roster:party});
 const initial=JSON.stringify(s);
 assert.equal(partyStep(s,{kind:'give',target:'field-radio',recipientId:party[1].id}).accepted,false);
 assert.equal(JSON.stringify(s),initial);
 s=step(s,'give field-radio to pc-2');
 assert.equal(s.actors[1].inventory.includes('field-radio'),true);
 assert.equal(isPartySave(s),true);
});
test('009-B2b1: tampered map, flags, objective records, item stock and fingerprint cannot load',()=>{
 const s=fresh();
 for(const modify of [
  x=>x.rooms['field-camp'].items.push('field-notes'),
  x=>x.flags.beacon=true,
  x=>x.actors[0].location='helipad',
  x=>x.adventureBinding.fingerprint='forged',
  x=>x.objectiveRecords.push({id:'walk-out',actorId:'pc-1',beat:0,room:'field-camp'}),
  x=>x.scenario='nublar-incident-1993'
 ]){
  const forged=structuredClone(s);modify(forged);
  assert.equal(isPartySave(forged),false);
  assert.throws(()=>upgradePartySave(forged),RangeError);
 }
});
test('009-B2b1: control mode and actor focus remain meaningful for selected adventure',()=>{
 const party=makeParty({seed:72,size:3});
 let s=newPartyIncident({adventureId:'ridge-survey',seed:72,roster:party});
 s=setControlMode(s,{mode:'focus',focusedActorId:party[1].id}).state;
 assert.equal(currentOwner(s),'ai');
 assert.equal(partyStep(s,'wait',{source:'human'}).accepted,false);
 const auto=runAutonomousTurn(s,{singleStep:true});
 assert.equal(auto.accepted,true,auto.reason);
 assert.equal(auto.state.cursor,1);
 assert.equal(currentOwner(auto.state),'human');
 const human=partyStep(auto.state,'wait',{source:'human'});
 assert.equal(human.accepted,true);
 assert.equal(currentOwner(human.state),'ai');
});
test('009-B2b1: spectator companion intent aims for the real survey blind, not the Nublar generator',()=>{
 const party=makeParty({seed:77,size:2});
 const initial=newPartyIncident({adventureId:'ridge-survey',seed:77,roster:party});
 const o=actorObservation(initial,party[0].id);
 assert.equal(o.adventureId,'ridge-survey');
 const suggested=chooseCompanionAction(o);
 assert.equal(suggested.goal,'recover-transect');
 assert.ok(['rocky-ascent','river-crossing'].includes(suggested.target));
 let s=setControlMode(initial,{mode:'spectator'}).state;
 for(let i=0;i<3;i++){
  const r=runAutonomousTurn(s,{singleStep:true});
  assert.equal(r.accepted,true,r.reason);s=r.state;
  assert.equal(isPartySave(s),true);
 }
 assert.ok(s.actors.some(a=>a.location!=='field-camp'));
});
test('009-B2b1: per-actor view excludes remote stock and other actors private inventory',()=>{
 const party=makeParty({seed:55,size:2});
 let s=newPartyIncident({adventureId:'ridge-survey',seed:55,roster:party});
 s=step(s,'take field-notes');
 s=step(s,'move rocky-ascent');
 const v=partyView(s,{actorId:party[1].id});
 assert.equal(v.location,'field-camp');
 assert.equal(v.inventory.some(x=>x.id==='field-notes'),false);
 assert.equal(v.items.some(x=>x.id==='field-notes'),false);
 assert.equal(JSON.stringify(v).includes('researchObstacle'),false);
 assert.equal(JSON.stringify(v).includes('missing-records'),false);
});
test('009-B2b1: browser offers two scenario choices and dynamic objectives',async()=>{
 const {readFile}=await import('node:fs/promises');
 const page=await readFile(new URL('../party.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8');
 assert.match(page,/id="adventure-select"/);
 assert.match(page,/The Long Count/);
 assert.match(app,/v\.objectives/);
 assert.match(app,/adventureId:\$\('adventure-select'\)\.value/);
});
