import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {newPartyIncident,isPartySave,partyStep} from '../src/party-engine.mjs';
import {activeCombatSlot,activeTurnId,beginCombat,validCombatState,COMBAT_COST} from '../src/combat-turns.mjs';
import {currentOwner,setControlMode,runAutonomousTurn} from '../src/party-director.mjs';

const roster=makeParty({seed:77,size:3,careers:['ranger','maintenance','medic']});
function fixture(seed=51) {
 const s=newPartyIncident({seed:889,roster});
 s.dinosaurs[0].location='control';
 for(const a of s.actors)a.armorLevel=10; // Isolate scheduling from injury and death.
 assert(beginCombat(s,seed));
 const slot=activeCombatSlot(s);
 if(slot.kind==='human')s.cursor=s.actors.findIndex(a=>a.id===slot.actorId);
 assert(isPartySave(s));
 return s;
}
function untilKind(kind) {
 for(let seed=1;seed<100;seed++){
  const s=fixture(seed);
  if(activeCombatSlot(s)?.kind===kind)return s;
 }
 throw Error('No matching first card');
}
function turn(s,action='end'){
 const slot=activeCombatSlot(s);
 const r=slot.kind==='dinosaur'?
  partyStep(s,{kind:'predator'},{actorId:s.dinosaurs[0].id,source:'ai'}):
  partyStep(s,action,{actorId:activeTurnId(s),source:'human'});
 assert(r.accepted,'Turn failed: '+r.reason);
 return r.state;
}
test('combat initiative is unique and gives one card per survivor plus two per dinosaur',()=>{
 const s=fixture();
 const cards=s.combat.order;
 assert.equal(cards.length,5);
 assert.equal(cards.filter(c=>c.kind==='dinosaur').length,2);
 assert.equal(new Set(cards.map(c=>c.card)).size,5);
 assert(cards.every((x,i)=>i===0||cards[i-1].card<x.card));
 assert.equal(s.combat.roundHistory[0].seed,51);
 assert(isPartySave(JSON.parse(JSON.stringify(s))));
});
test('one quick followed by one full action remains on one human card until exhausted',()=>{
 let s=untilKind('human');
 const who=activeTurnId(s),card=activeCombatSlot(s).card;
 s=turn(s,'guard');
 assert.equal(activeTurnId(s),who);
 assert.equal(activeCombatSlot(s).card,card);
 assert.equal(s.combat.budgets[who].quickSpent,1);
 s=turn(s,'attack dinosaur');
 assert.equal(s.combat.budgets[who].fullSpent,1);
 assert.notEqual(activeTurnId(s),who);
});
test('one full then quick works; a second full action is rejected without mutation',()=>{
 let s=untilKind('human'),who=activeTurnId(s);
 s=turn(s,'attack dinosaur');
 assert.equal(activeTurnId(s),who);
 const before=JSON.stringify(s);
 const denied=partyStep(s,'attack dinosaur',{actorId:who,source:'human'});
 assert.equal(denied.accepted,false);
 assert.equal(JSON.stringify(s),before);
 s=turn(s,'guard');assert.notEqual(activeTurnId(s),who);
});
test('two quick actions exhaust a combat card and prevent a late full action',()=>{
 let s=untilKind('human'),who=activeTurnId(s);
 s=turn(s,'guard');s=turn(s,'guard');
 assert.equal(s.combat.budgets[who].quickSpent,2);
 assert.equal(s.combat.budgets[who].full,0);
 assert.notEqual(activeTurnId(s),who);
});
test('end turn advances one card without spending RNG or rolling unnecessary dice',()=>{
 let s=untilKind('human');
 const rng=s.rng,beat=s.beat,card=activeCombatSlot(s).card;
 s=turn(s,'end');
 assert.equal(s.rng,rng);assert.equal(s.beat,beat+1);
 assert.notEqual(activeCombatSlot(s).card,card);
});
test('dinosaur initiative is computer-only and consumes exactly one creature action',()=>{
 let s=untilKind('dinosaur');
 const original=JSON.stringify(s),beat=s.beat;
 assert.equal(partyStep(s,'attack dinosaur',{actorId:'pc-1',source:'human'}).accepted,false);
 assert.equal(JSON.stringify(s),original);
 assert.equal(currentOwner(s),'ai');
 s=turn(s);
 assert.equal(s.beat,beat+1);
 assert.equal(s.actions.at(-1).actorId,s.dinosaurs[0].id);
 assert(s.actions.at(-1).kind.startsWith('predator_'));
});
test('all scheduled cards occur in their drawn order then initiative is redrawn',()=>{
 let s=fixture(32);
 const cards=s.combat.order.map(c=>c.card),seen=[];
 for(let i=0;i<cards.length;i++){
  seen.push(activeCombatSlot(s).card);
  s=turn(s);
 }
 assert.deepEqual(seen,cards);
 assert.equal(s.combat.round,2);
 assert.equal(s.combat.roundHistory.length,2);
 assert(isPartySave(s));
});
test('reserved quick action is consumed for an actual dodge reaction to the predator',()=>{
 let s=untilKind('dinosaur');
 const target=s.actors[0];
 for(const other of s.actors.slice(1))other.hidden=true;
 target.guarding=true;
 s.combat.budgets[target.id].quickSpent=1;
 s.combat.budgets[target.id].quick=1;
 const next=turn(s),action=next.actions.at(-1);
 assert.equal(action.kind,'predator_attack');
 assert.equal(action.target,target.id);
 assert.equal(action.evaded,true);
 assert.equal(next.combat.budgets[target.id].quickSpent,2);
 assert.equal(next.actors[0].guarding,false);
});
test('no prepared guard means no free quick-action dodge',()=>{
 let s=untilKind('dinosaur');
 for(const other of s.actors.slice(1))other.hidden=true;
 const next=turn(s);
 assert.equal(next.actions.at(-1).evaded,false);
 assert.equal(next.combat.budgets['pc-1'].quickSpent,0);
});
test('defeating the velociraptor ends combat without awarding further creature turns',()=>{
 let s=untilKind('human');
 s.dinosaurs[0].defeated=true;s.dinosaurs[0].health=0;
 s=turn(s);
 assert.equal(s.combat.active,false);
 assert(isPartySave(s));
});
test('switching from Party to Spectator preserves combat order, RNG and past actions',()=>{
 let s=fixture(24);
 const before={rng:s.rng,combat:JSON.stringify(s.combat),beat:s.beat};
 s=setControlMode(s,{mode:'spectator'}).state;
 assert.equal(s.rng,before.rng);assert.equal(s.beat,before.beat);
 assert.equal(JSON.stringify(s.combat),before.combat);
 assert.equal(currentOwner(s),'ai');
 const out=runAutonomousTurn(s,{singleStep:true});
 assert.equal(out.accepted,true,out.reason);
 assert.equal(out.state.actions.length,1);
});
test('each spectator Step executes exactly one human or dinosaur initiative action',()=>{
 const play=()=>{
  let s=setControlMode(fixture(17),{mode:'spectator'}).state;
  for(let i=0;i<9;i++){
   const r=runAutonomousTurn(s,{singleStep:true});
   assert.equal(r.accepted,true,r.reason);
   s=r.state;
  }
  return s;
 };
 const a=play(),b=play();
 assert.deepEqual(a,b);
 assert.equal(a.actions.length,9);
 assert.equal(a.aiDecisions.length,9);
});
test('earlier valid party saves without combat overlay remain compatible',()=>{
 const s=newPartyIncident({seed:2020,roster});delete s.combat;
 assert(isPartySave(s));
 assert.equal(partyStep(s,'wait',{actorId:'pc-1',source:'human'}).accepted,true);
});
test('forged duplicate cards or impossible human action budget fail save checks',()=>{
 const dup=fixture();
 dup.combat.order[1].card=dup.combat.order[0].card;
 assert(!validCombatState(dup));assert(!isPartySave(dup));
 const bad=fixture();
 const id=bad.combat.order.find(o=>o.kind==='human').actorId;
 bad.combat.budgets[id].quickSpent=2;bad.combat.budgets[id].fullSpent=1;
 assert(!isPartySave(bad));
});
test('combat action costs are explicit and players cannot command the predator directly',()=>{
 assert.equal(COMBAT_COST.move,'quick');
 assert.equal(COMBAT_COST.attack,'full');
 assert.equal(COMBAT_COST.aid,'full');
 const s=untilKind('human'),before=JSON.stringify(s),id=activeTurnId(s);
 assert.equal(partyStep(s,{kind:'predator'},{actorId:id,source:'human'}).accepted,false);
 assert.equal(JSON.stringify(s),before);
});
