import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,partyStep,partyView,isPartySave,parsePartyAction} from '../src/party-engine.mjs';
import {actorObservation,chooseCompanionAction} from '../src/party-director.mjs';
const roster=makeParty({seed:19,size:3,careers:['ranger','medic','tactical']});
const game=(seed=1993)=>newPartyIncident({seed,roster});
function exposure(seed){
 const s=game(seed);
 s.dinosaurs[0].location='control';
 s.dinosaurs[0].alert=2;
 return partyStep(s,'wait',{source:'human',actorId:'pc-1'});
}
test('source-derived stealth contact only affects survivors actually exposed to the dinosaur',()=>{
 const s=game(1);s.dinosaurs[0].location='control';
 s.actors[1].location='lobby';
 s.actors[2].hidden=true;
 const result=partyStep(s,'wait',{source:'human',actorId:'pc-1'});
 assert(result.accepted);
 assert.equal(result.state.actors[1].health,roster[1].healthMax);
 assert.equal(result.state.actors[1].seenThreats.length,0);
 assert.equal(result.state.actors[2].health,roster[2].healthMax);
 assert.equal(s.actors[0].seenThreats.length,0,'source world was not mutated');
});
test('no distant room observation exposes hidden predator position',()=>{
 const s=game();
 const v=partyView(s,{actorId:'pc-1'});
 assert.equal(v.visibleDinosaurs.length,0);
 const a=actorObservation(s,'pc-1');
 assert(!('hiddenPredatorLocation' in a));
 assert.equal(a.dinosaurs.length,0);
});
test('dinosaur exposure can inflict actual damage, broken condition and source-coded critical injury',()=>{
 let struck=false,broken=false;
 for(let seed=1;seed<500;seed++){
  const result=exposure(seed);
  assert.equal(result.accepted,true);
  const actor=result.state.actors[0];
  if(actor.health<actor.healthMax){struck=true;}
  if(actor.broken){
   broken=true;
   assert.equal(actor.health,0);
   assert(actor.criticalInjuries.length>=1);
   assert.equal(result.state.outcome==='playing'||result.state.outcome==='lost',true);
  }
  if(struck&&broken)break;
 }
 assert(struck,'there should be reachable seeded harm outcomes');
 assert(broken,'there should be a reachable seeded critical injury');
});
test('successful hiding prevents automatic discovery until active search is attempted',()=>{
 const s=game(53);
 s.dinosaurs[0].location='control';s.dinosaurs[0].alert=0;
 s.actors.forEach(a=>{a.hidden=true;});
 const result=partyStep(s,'wait',{source:'human',actorId:'pc-1'});
 assert(result.accepted);
 assert(result.state.actors.every(a=>a.health===a.healthMax));
 assert(result.state.actors.every(a=>a.hidden));
});
test('defeated dinosaurs are not active threats or exposed in character view',()=>{
 const s=game(99);
 s.dinosaurs[0].location='control';s.dinosaurs[0].defeated=true;s.dinosaurs[0].health=0;
 const result=partyStep(s,'wait',{source:'human',actorId:'pc-1'});
 assert.equal(result.accepted,true);
 assert(result.state.actors.every(a=>a.health===a.healthMax));
 assert.deepEqual(partyView(result.state,{actorId:'pc-1'}).visibleDinosaurs,[]);
 assert.deepEqual(actorObservation(result.state,'pc-1').dinosaurs,[]);
});
test('guard and aid parser translates bounded realistic actions',()=>{
 assert.equal(parsePartyAction('stand watch').kind,'guard');
 assert.equal(parsePartyAction('attack the velociraptor').kind,'attack');
 assert.deepEqual(parsePartyAction('treat pc-2'),{kind:'aid',target:'pc-2',push:0});
});
test('a broken teammate can be treated by the actual trained medic',()=>{
 let successful=false;
 for(let seed=1;seed<150;seed++){
  const s=game(seed);
  s.cursor=1; // medic is the scheduled human actor
  s.actors[0].health=0;s.actors[0].broken=true;
  const r=partyStep(s,'aid pc-1',{source:'human',actorId:'pc-2'});
  assert.equal(r.accepted,true);
  if(r.state.actors[0].health>0){
   successful=true;assert.equal(r.state.actors[0].broken,false);break;
  }
 }
 assert(successful,'medical aid succeeds for some legal rolls');
});
test('a living uninjured person cannot consume medical treatment as an objective exploit',()=>{
 const s=game();
 const b=JSON.stringify(s);
 s.cursor=1;
 const original=JSON.stringify(s);
 const result=partyStep(s,'aid pc-1',{source:'human',actorId:'pc-2'});
 assert.equal(result.accepted,false);
 assert.equal(JSON.stringify(s),original);
});
test('a survivor can attack only a real dinosaur in their immediate zone',()=>{
 const s=game(17),before=JSON.stringify(s);
 const fail=partyStep(s,'attack dinosaur',{source:'human',actorId:'pc-1'});
 assert.equal(fail.accepted,false);
 assert.equal(JSON.stringify(s),before);
 let fought=false;
 for(let seed=1;seed<40;seed++){
  const scene=game(seed);
  scene.dinosaurs[0].location='control';
  const outcome=partyStep(scene,'attack dinosaur',{source:'human',actorId:'pc-1'});
  assert.equal(outcome.accepted,true);
  if(outcome.state.dinosaurs[0].health<6){fought=true;break;}
 }
 assert(fought);
});
test('death and panic forced skipped actions remain actor-local and auditable',()=>{
 const s=game();
 s.actors[0].dead=true;s.actors[0].health=0;
 const r=partyStep(s,'move lobby',{source:'human',actorId:'pc-1'});
 assert.equal(r.accepted,true);
 assert.equal(r.state.actors[0].location,'control');
 assert.equal(r.state.actions.at(-1).kind,'incapacitated');
 const t=game();t.actors[0].pendingSkip=true;
 const v=partyStep(t,'attack dinosaur',{source:'human',actorId:'pc-1'});
 assert.equal(v.accepted,true);
 assert.equal(v.state.actions.at(-1).kind,'panic_freeze');
});
test('separate party and per-actor states remain serializable after dangerous encounters',()=>{
 const r=exposure(37);
 const saved=JSON.parse(JSON.stringify(r.state));
 assert.equal(isPartySave(saved),true);
 assert.deepEqual(saved,r.state);
 const view=partyView(saved,{actorId:'pc-2'});
 assert.equal(view.actorId,'pc-2');
});
test('AI medic detects a nearby incapacitated ally but not one in a remote zone',()=>{
 const s=game();
 s.actors[0].broken=true;s.actors[0].health=0;
 const medic=actorObservation(s,'pc-2');
 assert.equal(chooseCompanionAction(medic).kind,'aid');
 assert.equal(chooseCompanionAction(medic).target,'pc-1');
 s.actors[0].location='lobby';
 const remote=actorObservation(s,'pc-2');
 assert.notEqual(chooseCompanionAction(remote).kind,'aid');
});
