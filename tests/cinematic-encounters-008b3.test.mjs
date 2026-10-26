import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newPartyIncident,partyStep,partyView,isPartySave,upgradePartySave,parsePartyAction} from '../src/party-engine.mjs';
import {WILDLIFE_ENCOUNTER,wildlifeState,wildlifeAvailable,validWildlifeState,dialogueAvailable,validDialogueRecords} from '../src/cinematic-encounters.mjs';
import {setControlMode,setCamera} from '../src/party-director.mjs';

const game=(seed=1993)=>newPartyIncident({seed});
const player=(s,cmd,actorId=s.actors[s.cursor].id)=>partyStep(s,cmd,{actorId,source:'human'});
const safeJungle=(seed=1993)=>{
 const s=game(seed);
 s.actors[0].location='jungle';s.dinosaurs[0].defeated=true;
 return s;
};
function findApproach(success){
 for(let seed=1;seed<300;seed++){
  const s=safeJungle(seed),r=player(s,'wildlife approach');
  if(r.accepted&&r.result.success===success)return {before:s,after:r.state,result:r.result};
 }
 throw Error('No seeded Mobility example for '+success);
}
test('authored dinosaur is a grounded streamside encounter, not a predator token',()=>{
 const s=safeJungle(),v=partyView(s);
 assert.equal(WILDLIFE_ENCOUNTER.location,'jungle');
 assert.equal(WILDLIFE_ENCOUNTER.kind,'Parasaurolophus');
 assert(v.wildlifeEncounter.description.includes('drainage stream'));
 assert.deepEqual(v.wildlifeEncounter.choices.map(x=>x.id),['watch','approach']);
 assert.equal(s.dinosaurs.length,1);
 assert.equal(s.dinosaurs[0].kind,'Velociraptor');
});
test('peaceful watching is optional, consumes a normal exploration action and no skill roll',()=>{
 const s=safeJungle(),snapshot=JSON.stringify(s);
 const r=player(s,'wildlife watch');assert(r.accepted,r.reason);
 assert.equal(JSON.stringify(s),snapshot);
 assert.equal(r.state.beat,s.beat+1);
 assert(r.state.wildlifeEncounter.seenBy.includes('pc-1'));
 assert.equal(r.state.wildlifeEncounter.status,'present');
 assert.equal(r.state.actions.at(-1).kind,'wildlife');
 assert.equal(r.state.actions.at(-1).target,'watch');
 assert.equal(r.state.actions.at(-1).outcome,'observed');
 assert(!('seed' in r.state.actions.at(-1)));
 assert.equal(r.state.combat,null);
 assert(isPartySave(r.state));
});
test('a character cannot repeatedly farm the same peaceful watching action',()=>{
 const s=safeJungle(),first=player(s,'wildlife watch');
 assert(first.accepted);
 const later=first.state;
 // Round-robin scheduling still governs the other survivors' turns.
 later.cursor=0;
 const before=JSON.stringify(later),denied=player(later,'wildlife watch');
 assert.equal(denied.accepted,false);
 assert.equal(JSON.stringify(later),before);
});
test('approaching is a genuine Evolved Mobility check and can remain peaceful',()=>{
 const {before,after,result}=findApproach(true);
 assert.equal(result.success,true);
 assert.equal(result.outcome,'calm');
 assert.equal(after.wildlifeEncounter.status,'present');
 assert(after.wildlifeEncounter.approachedBy.includes('pc-1'));
 assert(after.wildlifeEncounter.seenBy.includes('pc-1'));
 assert.equal(after.actions.at(-1).seed,result.seed);
 assert(Array.isArray(result.base));
 assert.equal(after.dinosaurs.length,1);
 assert.deepEqual(after.dinosaurs,before.dinosaurs);
 assert(isPartySave(after));
});
test('failed approach credibly startles herbivore into withdrawing without attacking',()=>{
 const {before,after,result}=findApproach(false);
 assert.equal(result.success,false);
 assert.equal(after.wildlifeEncounter.status,'withdrawn');
 assert.equal(after.wildlifeEncounter.reason,'disturbed');
 assert.equal(after.actions.at(-1).noise,2);
 assert.equal(after.outcome,'playing');
 assert.equal(after.combat,null);
 assert.equal(after.dinosaurs.length,1);
 assert(after.events.some(e=>e.actorId==='pc-1'&&e.message.includes('withdraws')));
 assert.equal(before.wildlifeEncounter.status,'present');
 assert(isPartySave(after));
});
test('a withdrawn dinosaur cannot be repeatedly approached or summoned again',()=>{
 const {after}=findApproach(false);
 after.cursor=0;
 const before=JSON.stringify(after),r=player(after,'wildlife approach');
 assert.equal(r.accepted,false);
 assert.equal(JSON.stringify(after),before);
 assert.deepEqual(wildlifeAvailable(after,after.actors[0]),[]);
 assert.equal(partyView(after).wildlifeEncounter?.status,'withdrawn');
});
test('a first scene witness does not grant a second survivor unearned memories',()=>{
 const s=safeJungle();s.actors[1].location='jungle';
 const r=player(s,'wildlife watch');assert(r.accepted);
 assert(r.state.wildlifeEncounter.seenBy.includes('pc-1'));
 assert(!r.state.wildlifeEncounter.seenBy.includes('pc-2'));
 const v=partyView(r.state,{actorId:'pc-2'});
 assert(v.wildlifeEncounter?.choices.some(c=>c.id==='watch'));
 assert(!('seenBy' in v.wildlifeEncounter));
});
test('scripted squall hides the stream encounter rather than forcing a sighting',()=>{
 const s=safeJungle();s.clock.explorationStretches=2;
 assert.deepEqual(wildlifeAvailable(s,s.actors[0]),[]);
 assert.equal(partyView(s).wildlifeEncounter,null);
 const denied=player(s,'wildlife watch');
 assert.equal(denied.accepted,false);
 s.clock.explorationStretches=4;
 assert(wildlifeAvailable(s,s.actors[0]).length>0);
});
test('a nearby active Velociraptor prevents pretending the streamside scene is calm',()=>{
 const s=safeJungle();s.dinosaurs[0].defeated=false;s.dinosaurs[0].location='jungle';
 assert.deepEqual(wildlifeAvailable(s,s.actors[0]),[]);
 assert.equal(partyView(s).wildlifeEncounter,null);
});
test('committed predator presence causes authored herbivore withdrawal without combat spawn',()=>{
 const s=game();s.dinosaurs[0].location='jungle';s.actors[0].location='control';
 const before=JSON.stringify(s);
 const r=player(s,'wait');assert(r.accepted,r.reason);
 assert.equal(JSON.stringify(s),before);
 assert.equal(r.state.wildlifeEncounter.status,'withdrawn');
 assert.equal(r.state.wildlifeEncounter.reason,'predator');
 assert.equal(r.state.dinosaurs.length,1);
 assert(isPartySave(r.state));
});
test('dialogue is available only between living capable colocated actual party members',()=>{
 const s=game();
 const options=dialogueAvailable(s,s.actors[0]);
 assert(options.some(o=>o.recipientId==='pc-2'&&o.topic==='check-in'));
 assert(options.some(o=>o.recipientId==='pc-2'&&o.topic==='plan'));
 s.actors[1].location='jungle';
 assert(!dialogueAvailable(s,s.actors[0]).some(o=>o.recipientId==='pc-2'));
 const denied=player(s,'talk pc-2 check-in');
 assert.equal(denied.accepted,false);
 s.actors[1].location='control';s.actors[1].dead=true;
 assert(!dialogueAvailable(s,s.actors[0]).some(o=>o.recipientId==='pc-2'));
});
test('check-in dialogue records actual human exchange without granting free recovery',()=>{
 const s=game(),before=JSON.stringify(s),stress=s.actors.map(a=>a.stress);
 const r=player(s,'talk pc-2 check-in');assert(r.accepted,r.reason);
 assert.equal(JSON.stringify(s),before);
 assert.equal(r.state.beat,s.beat);assert.equal(r.state.rng,s.rng);
 assert.deepEqual(r.state.actors.map(a=>a.stress),stress);
 assert.deepEqual(r.state.actors.map(a=>a.health),s.actors.map(a=>a.health));
 assert.deepEqual(r.state.dinosaurs,s.dinosaurs);
 assert.equal(r.state.dialogueRecords.length,1);
 assert.equal(r.state.dialogueRecords[0].zone,'control');
 assert(isPartySave(r.state));
});
test('planning talk follows real changing objective facts without fabricating objectives',()=>{
 const s=game(),first=player(s,'talk pc-2 plan');
 assert(first.accepted);assert(first.state.events.at(-1).message.includes('restoring auxiliary power'));
 const prepared=game();prepared.flags.power=true;
 assert(player(prepared,'talk pc-2 plan').state.events.at(-1).message.includes('powered radio'));
 prepared.flags.distress=true;
 assert(player(prepared,'talk pc-2 plan').state.events.at(-1).message.includes('helipad'));
});
test('repeated dialogue is rejected, another legitimate topic is permitted',()=>{
 const s=game(),first=player(s,'talk pc-2 check-in');
 assert(first.accepted);
 const old=JSON.stringify(first.state);
 const blocked=player(first.state,'talk pc-2 check-in');
 assert.equal(blocked.accepted,false);
 assert.equal(JSON.stringify(first.state),old);
 const next=player(first.state,'talk pc-2 plan');
 assert(next.accepted);
 assert.equal(next.state.dialogueRecords.length,2);
});
test('dialogue logs reject forged participants, repeated topics and invented locations',()=>{
 const s=game();
 s.dialogueRecords=[{actorId:'pc-1',recipientId:'pc-2',topic:'check-in',zone:'control',beat:0}];
 assert(validDialogueRecords(s));assert(isPartySave(s));
 s.dialogueRecords.push({...s.dialogueRecords[0]});
 assert(!isPartySave(s));
 s.dialogueRecords.pop();s.dialogueRecords[0].zone='made-up';
 assert(!isPartySave(s));
 s.dialogueRecords[0].zone='control';s.dialogueRecords[0].recipientId='ghost';
 assert(!isPartySave(s));
});
test('saved wildlife state rejects invalid identities, duplicate witnesses and forged status',()=>{
 const s=safeJungle();
 s.wildlifeEncounter.seenBy.push('pc-1');
 assert(validWildlifeState(s));assert(isPartySave(s));
 s.wildlifeEncounter.seenBy.push('pc-1');
 assert(!isPartySave(s));
 s.wildlifeEncounter.seenBy.pop();
 s.wildlifeEncounter.status='withdrawn';s.wildlifeEncounter.reason=null;
 assert(!isPartySave(s));
 s.wildlifeEncounter.reason='disturbed';
 assert(isPartySave(s));
});
test('older party v3 saves remain valid with both new optional fields absent',()=>{
 const s=game();
 delete s.dialogueRecords;delete s.wildlifeEncounter;
 assert(isPartySave(s));assert(isPartySave(upgradePartySave(s)));
 s.actors[0].location='jungle';
 assert.deepEqual(wildlifeState(s),{status:'present',seenBy:[],approachedBy:[],reason:null});
});
test('mode and camera switching preserve local choices and actor privacy',()=>{
 let s=game();s.actors[0].location='jungle';
 s.dinosaurs[0].defeated=true;
 const saved=JSON.stringify(s.wildlifeEncounter),rng=s.rng;
 s=setControlMode(s,{mode:'spectator'}).state;
 s=setCamera(s,{mode:'actor',actorId:'pc-2'}).state;
 assert.equal(s.rng,rng);
 assert.equal(JSON.stringify(s.wildlifeEncounter),saved);
 const far=partyView(s,{actorId:'pc-2'});
 assert.equal(far.wildlifeEncounter,null);
 assert.equal(far.dialogueOpportunities.filter(o=>o.recipientId==='pc-1').length,0);
 assert(isPartySave(s));
});
test('browser and parsers expose meaningful choices, not a hidden simulator',async()=>{
 const [html,app,engine,scenario]=await Promise.all([
  readFile(new URL('../party.html',import.meta.url),'utf8'),
  readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8'),
  readFile(new URL('../src/party-engine.mjs',import.meta.url),'utf8'),
  readFile(new URL('../src/scenario.mjs',import.meta.url),'utf8')
 ]);
 assert(html.includes('party-app.mjs?v=009b2b2c2b'));
 assert(app.includes('party-engine.mjs?v=009b2b2c2b'));
 assert(app.includes('v.wildlifeEncounter?.choices'));
 assert(app.includes('v.dialogueOpportunities'));
 assert.equal(parsePartyAction('wildlife watch').kind,'wildlife');
 assert.equal(parsePartyAction('wildlife approach').target,'approach');
 assert.equal(parsePartyAction('talk pc-2 check-in').kind,'dialogue');
 assert(engine.includes("result('mobility','careful_approach')"));
 assert(engine.includes('validWildlifeState(s)'));
 assert(scenario.includes('drainage stream'));
 assert(!engine.includes('populationSimulation'));
});
