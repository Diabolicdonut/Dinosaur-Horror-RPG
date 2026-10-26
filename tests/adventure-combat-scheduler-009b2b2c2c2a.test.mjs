import test from 'node:test';
import assert from 'node:assert/strict';
import {beginAdventureCombat,activeAdventureCombatSlot,validAdventureCombat,
 spendAdventureCombatAction,advanceAdventureCombatSlot}
 from '../src/adventure-combat-scheduler.mjs';
const make=(seed=1993)=>beginAdventureCombat({actorIds:['researcher-a','researcher-b'],
 predatorId:'hunter-1',predatorSpeed:2,seed});
test('009-B2b2c2c2a: source initiative deterministic and numbered with true predator speed',()=>{
 const a=make(),b=make();
 assert.deepEqual(a,b);assert.equal(validAdventureCombat(a),true);
 assert.equal(a.order.length,4);
 assert.equal(new Set(a.order.map(x=>x.card)).size,4);
 assert.equal(a.order.filter(x=>x.kind==='dinosaur').length,2);
 assert.ok(a.order.every(x=>x.card>=1&&x.card<=10));
});
test('009-B2b2c2c2a: malformed combatants and bad seed cannot create fabricated fights',()=>{
 for(const options of [
  {actorIds:[],predatorId:'hunter',seed:1},
  {actorIds:['same','same'],predatorId:'hunter',seed:1},
  {actorIds:['a'],predatorId:'a',seed:1},
  {actorIds:['a'],predatorId:'hunter',predatorSpeed:9,seed:1},
  {actorIds:['a'],predatorId:'hunter',seed:-1}
 ])assert.throws(()=>beginAdventureCombat(options),RangeError);
});
test('009-B2b2c2c2a: human cannot spend dinosaur initiative or another actor card',()=>{
 const a=make();const slot=activeAdventureCombatSlot(a);
 const inappropriate=slot.kind==='dinosaur'?'researcher-a':
  slot.actorId==='researcher-a'?'researcher-b':'researcher-a';
 const r=spendAdventureCombatAction(a,{actorId:inappropriate,kind:'attack'});
 assert.equal(r.accepted,false);assert.strictEqual(r.combat,a);
});
test('009-B2b2c2c2a: full action consumes source action budget exactly once',()=>{
 let a=Array.from({length:120},(_,n)=>make(n)).find(s=>activeAdventureCombatSlot(s).kind==='human');
 const id=activeAdventureCombatSlot(a).actorId;
 const before=structuredClone(a);
 const result=spendAdventureCombatAction(a,{actorId:id,kind:'attack'});
 assert.equal(result.accepted,true);
 assert.equal(result.cost,'full');
 assert.equal(result.combat.budgets[id].full,0);
 assert.equal(spendAdventureCombatAction(result.combat,{actorId:id,kind:'attack'}).accepted,false);
 assert.deepEqual(a,before);
});
test('009-B2b2c2c2a: quick action budget permits two quick actions and denies a third',()=>{
 const a=Array.from({length:120},(_,n)=>make(n)).find(s=>activeAdventureCombatSlot(s).kind==='human');
 const id=activeAdventureCombatSlot(a).actorId;
 const one=spendAdventureCombatAction(a,{actorId:id,kind:'guard'});
 const two=spendAdventureCombatAction(one.combat,{actorId:id,kind:'move'});
 assert.equal(one.accepted,true);assert.equal(two.accepted,true);
 assert.equal(two.combat.budgets[id].quick,0);
 assert.equal(spendAdventureCombatAction(two.combat,{actorId:id,kind:'take'}).accepted,false);
 assert.equal(validAdventureCombat(two.combat),true);
});
test('009-B2b2c2c2a: new round must draw fresh numbered initiative and replenish budgets',()=>{
 let s=make(19);const initial=structuredClone(s);
 for(let i=0;i<s.order.length-1;i++){
  const t=advanceAdventureCombatSlot(s);assert.equal(t.accepted,true);
  s=t.combat;
 }
 const missing=advanceAdventureCombatSlot(s);
 assert.equal(missing.accepted,false);assert.strictEqual(missing.combat,s);
 const next=advanceAdventureCombatSlot(s,{nextSeed:733});
 assert.equal(next.accepted,true);
 assert.equal(next.combat.round,2);
 assert.equal(next.combat.cardSeed,733);
 assert.equal(next.combat.index,0);
 assert.equal(validAdventureCombat(next.combat),true);
 assert.deepEqual(make(19),initial);
});
test('009-B2b2c2c2a: malformed cards and forged action budget are rejected',()=>{
 const a=make();
 for(const mutate of [
  s=>s.order[0].card=99,
  s=>s.order[0].actorId='fictional-creature',
  s=>s.index=100,
  s=>s.budgets['researcher-a'].quickSpent=100,
  s=>s.cardSeed=-1
 ]){
  let changed=structuredClone(a);mutate(changed);
  assert.equal(validAdventureCombat(changed),false);
 }
});
test('009-B2b2c2c2a: independent of Nublar or Long Count scenario-specific names',()=>{
 const x=beginAdventureCombat({actorIds:['marine','technician'],
  predatorId:'creature-alpha',predatorSpeed:1,seed:44});
 assert.equal(validAdventureCombat(x),true);
 assert.equal(x.order.filter(y=>y.kind==='dinosaur').length,1);
 assert.deepEqual(x.actorIds,['marine','technician']);
});
