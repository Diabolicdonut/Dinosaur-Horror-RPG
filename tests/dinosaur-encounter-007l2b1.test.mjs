import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,partyStep,isPartySave,partyView} from '../src/party-engine.mjs';
import {beginCombat,activeCombatSlot} from '../src/combat-turns.mjs';
import {creatureCanTargetActor,raptorAttackPlan,validApproachPounce,VELOCIRAPTOR_TACTICS} from '../src/dinosaur-encounter.mjs';
import {setControlMode,setCamera} from '../src/party-director.mjs';

const roster=makeParty({seed:84,size:3,careers:['ranger','maintenance','medic']});
const game=()=>newPartyIncident({seed:1993,roster});
function leadingPredator({ambush=false}={}){
 for(let seed=1;seed<160;seed++){
  const s=game(),d=s.dinosaurs[0];
  d.location='control';d.facing='lobby';
  d.lastHunt={beat:0,from:'lobby',to:'control',behavior:'stalk',blocked:false};
  for(const a of s.actors){a.armorLevel=10;a.light.on=false;}
  if(!beginCombat(s,seed,ambush?{surpriseActorId:'dinosaur-1',ambush:true}:{}))
   continue;
  if(activeCombatSlot(s)?.kind!=='dinosaur')continue;
  assert(isPartySave(s));
  return s;
 }
 throw Error('No deterministic predator-leading combat fixture found.');
}
test('raptor exposes only a real living colocated survivor or a lit hiding place',()=>{
 const s=game(),d=s.dinosaurs[0],a=s.actors[0];
 d.location='control';a.light.on=false;a.hidden=true;
 assert.equal(creatureCanTargetActor(d,a),false);
 a.light.on=true;assert.equal(creatureCanTargetActor(d,a),true);
 a.location='shed';assert.equal(creatureCanTargetActor(d,a),false);
 a.location='control';a.dead=true;assert.equal(creatureCanTargetActor(d,a),false);
 a.dead=false;a.broken=true;assert.equal(creatureCanTargetActor(d,a),false);
 d.defeated=true;assert.equal(creatureCanTargetActor(d,a),false);
});
test('an earned pounce requires a recent physical approach in first combat round',()=>{
 const s=leadingPredator(),d=s.dinosaurs[0],a=s.actors[0];
 assert.equal(validApproachPounce(s,d,a),true);
 assert.equal(raptorAttackPlan(s,a).id,'pounce');
 assert.equal(raptorAttackPlan(s,a).attackDiceBonus,1);
 assert.equal(raptorAttackPlan(s,a).baseDamageBonus,0);
 assert.equal(VELOCIRAPTOR_TACTICS.bite.attackDiceBonus,0);
 const before=JSON.stringify(s);
 assert.equal(raptorAttackPlan(s,a).id,'pounce');
 assert.equal(JSON.stringify(s),before);
 s.combat.round=2;assert.equal(raptorAttackPlan(s,a).id,'bite');
});
test('no manufactured pounce from stalled, blocked or nonadjacent hunt history',()=>{
 const s=leadingPredator(),d=s.dinosaurs[0],a=s.actors[0];
 for(const record of [
  null,
  {beat:0,from:'control',to:'control',behavior:'stalk',blocked:false},
  {beat:0,from:'lobby',to:'control',behavior:'stalk',blocked:true},
  {beat:0,from:'helipad',to:'control',behavior:'stalk',blocked:false},
  {beat:0,from:'lobby',to:'control',behavior:'patrol',blocked:false},
  {beat:99,from:'lobby',to:'control',behavior:'stalk',blocked:false}
 ]){
  d.lastHunt=record;
  assert.equal(raptorAttackPlan(s,a).id,'bite',JSON.stringify(record));
 }
});
test('a reinforced maintenance door cannot manufacture a pounce until breached',()=>{
 const s=leadingPredator(),d=s.dinosaurs[0],a=s.actors[0];
 d.location='shed';a.location='shed';
 d.lastHunt={beat:0,from:'utility',to:'shed',behavior:'investigate',blocked:false};
 s.combat.room='shed';
 assert.equal(raptorAttackPlan(s,a).id,'bite');
 s.flags.shedBarrierBreached=true;
 assert.equal(raptorAttackPlan(s,a).id,'pounce');
});
test('first legal attack records original pounce tactic and uses only one extra die',()=>{
 const s=leadingPredator(),d=s.dinosaurs[0],before=JSON.stringify(s);
 const attack=partyStep(s,{kind:'predator'},{actorId:d.id,source:'ai'});
 assert(attack.accepted,attack.reason);
 assert.equal(JSON.stringify(s),before);
 const record=attack.state.actions.at(-1);
 assert.equal(record.kind,'predator_attack');
 assert.equal(record.tactic,'pounce');
 assert.equal(record.attackDice,7);
 assert.equal(record.ambush,false);
 assert.equal(record.damage,0);
 assert.equal(raptorAttackPlan(attack.state,attack.state.actors[0]).id,'bite');
 assert(isPartySave(JSON.parse(JSON.stringify(attack.state))));
});
test('pounce is declared to the defending human before seeded resolution',()=>{
 const s=leadingPredator();
 const marked=partyStep(s,{kind:'predator'},{actorId:s.dinosaurs[0].id,source:'ai',reactionPrompt:true});
 assert(marked.accepted,marked.reason);
 assert.equal(marked.awaitingReaction,true);
 assert.equal(marked.state.actions.length,0);
 assert(marked.state.events.some(e=>e.message.includes('pounces toward')));
 const victim=marked.state.combat.pendingReaction.victimId;
 const result=partyStep(marked.state,{kind:'react',target:'defend'},{actorId:victim,source:'human'});
 assert(result.accepted,result.reason);
 assert.equal(result.state.actions.at(-1).tactic,'pounce');
 assert.equal(result.state.actions.at(-1).attackDice,7);
 assert.equal(result.state.actions.at(-1).defense,'close_combat');
 assert(isPartySave(result.state));
});
test('surprise remains its own Evolved modifier rather than free pounce attacks',()=>{
 const s=leadingPredator({ambush:true});
 const out=partyStep(s,{kind:'predator'},{actorId:s.dinosaurs[0].id,source:'ai',reactionPrompt:true});
 assert(out.accepted,out.reason);
 assert(!out.awaitingReaction);
 const strike=out.state.actions.at(-1);
 assert.equal(strike.tactic,'pounce');
 assert.equal(strike.ambush,true);
 assert.equal(strike.attackDice,9);
 assert.equal(strike.defense,'none');
});
test('concealment under an extinguished lamp remains effective against attack selection',()=>{
 const s=leadingPredator(),a=s.actors[0];
 for(const p of s.actors){p.hidden=true;p.light.on=false;}
 assert.equal(raptorAttackPlan(s,a),null);
 const attack=partyStep(s,{kind:'predator'},{actorId:s.dinosaurs[0].id,source:'ai'});
 assert(attack.accepted,attack.reason);
 assert.equal(attack.state.actions.at(-1).kind,'predator_wait');
 assert(attack.state.actors.every(x=>x.hidden));
});
test('lit cover cannot hide from a colocated raptor without consuming an invalid action',()=>{
 const s=game();s.dinosaurs[0].location='control';
 s.actors[0].light.on=true;
 const before=JSON.stringify(s);
 const r=partyStep(s,'hide behind rolling cabinet',{actorId:s.actors[0].id,source:'human'});
 assert.equal(r.accepted,false);
 assert.equal(r.state,s);
 assert.equal(JSON.stringify(s),before);
});
test('switching on a lamp beside the raptor reveals previously concealed cover',()=>{
 const s=game(),a=s.actors[0];
 s.dinosaurs[0].location='control';
 a.hidden=true;a.coverId='rolling_cabinet';a.light.on=false;
 assert(isPartySave(s));
 const result=partyStep(s,'light on',{actorId:a.id,source:'human'});
 assert(result.accepted,result.reason);
 assert.equal(result.state.actors[0].hidden,false);
 assert.equal(result.state.actors[0].coverId,null);
 assert(result.state.events.some(e=>e.actorId===a.id&&e.message.includes('gives away')));
 assert(isPartySave(result.state));
});
test('hidden lamp-exposed older v3 combats stay in initiative; no schema bump',()=>{
 const s=leadingPredator(),a=s.actors[0];
 a.hidden=true;a.coverId='rolling_cabinet';a.light.on=true;
 assert(isPartySave(s));
 assert.equal(raptorAttackPlan(s,a).id,'pounce');
 const out=partyStep(s,{kind:'predator'},{actorId:s.dinosaurs[0].id,source:'ai'});
 assert(out.accepted,out.reason);
 assert.equal(out.state.actions.at(-1).kind,'predator_attack');
 assert(isPartySave(out.state));
});
test('camera/control changes do not consume earned opening or disclose private hunt state',()=>{
 let s=leadingPredator();const rng=s.rng,original=JSON.stringify(s.dinosaurs[0]);
 s=setControlMode(s,{mode:'spectator'}).state;
 s=setCamera(s,{mode:'actor',actorId:'pc-2'}).state;
 assert.equal(s.rng,rng);
 assert.equal(JSON.stringify(s.dinosaurs[0]),original);
 const v=partyView(s,{actorId:'pc-2'});
 assert(!('lastHunt' in v));assert(!('attackTactic' in v));
 assert.equal(raptorAttackPlan(s,s.actors[0]).id,'pounce');
});
test('updated party browser imports real predator mechanics without changing solo or Worker',async()=>{
 const html=await readFile(new URL('../party.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/party-app.mjs',import.meta.url),'utf8');
 const engine=await readFile(new URL('../src/party-engine.mjs',import.meta.url),'utf8');
 assert(html.includes('party-app.mjs?v=009b2b1'));
 assert(app.includes("party-engine.mjs?v=009b2b1"));
 assert(app.includes("party-director.mjs?v=009b2b1"));
 assert(engine.includes("combat-turns.mjs?v=007l2b1"));
 assert(engine.includes('raptorAttackPlan'));
 assert(!engine.includes("from '../worker/"));
});
