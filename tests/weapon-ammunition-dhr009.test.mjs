import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAmmunitionConservation, validAmmunitionConservation, applyAmmunitionAction,
} from '../src/weapon-ammunition.mjs';

const stock = Object.freeze({signal_cartridge: 7, dart_round: 5});
const fixture = () => ({
  actors: [
    {id:'pc-1', location:'field', inventory:['field_knife_01','signal_launcher_01','signal_cartridge'],
      gear:['signal_cartridge']},
    {id:'pc-2', location:'field', inventory:['dart_rifle_01', 'dart_round'], gear:[]},
  ],
  weapons: [
    {id:'knife_01', itemId:'field_knife_01', ownerId:'pc-1', class:'melee'},
    {id:'launcher_01', itemId:'signal_launcher_01', ownerId:'pc-1', class:'ranged',
      ammo:{itemId:'signal_cartridge', capacity:3, loaded:2}},
    {id:'dart_01', itemId:'dart_rifle_01', ownerId:'pc-2', class:'ranged',
      ammo:{itemId:'dart_round', capacity:4, loaded:1}},
  ],
  rooms:{field:{items:['signal_cartridge','signal_cartridge','signal_cartridge','dart_round']},
    camp:{items:['dart_round']}},
  ammoSpent:{signal_cartridge:0,dart_round:1},
  rng:1993, beat:7, saveVersion:3,
});
const operate = (s,kind,fields={}) => applyAmmunitionAction(s, stock, {kind,...fields});
const rejects = (s,action) => {
  const before=JSON.stringify(s);
  assert.throws(() => applyAmmunitionAction(s,stock,action),RangeError);
  assert.equal(JSON.stringify(s),before);
};

test('DHR-009 accounts for source-authorized loaded, carried, floor, spent rounds and weapon items',()=>{
  const s=fixture();
  assert.equal(validateAmmunitionConservation(s,stock),true);
  assert.equal(validAmmunitionConservation(s,stock),true);
  assert.equal(s.ammoSpent.dart_round,1);
});
test('physical pickup removes exactly the requested floor count and grants only carried rounds',()=>{
  const s=fixture(),before=JSON.stringify(s);
  const {state:next,receipt}=operate(s,'pickup',
    {actorId:'pc-1',roomId:'field',ammoId:'signal_cartridge',quantity:2});
  assert.deepEqual(receipt,{kind:'pickup',ammoId:'signal_cartridge',quantity:2});
  assert(Object.isFrozen(receipt));
  assert.equal(next.rooms.field.items.filter(x=>x==='signal_cartridge').length,1);
  assert.equal(next.actors[0].inventory.filter(x=>x==='signal_cartridge').length,3);
  assert.equal(next.ammoSpent.signal_cartridge,0);
  assert.equal(next.beat,s.beat);assert.equal(next.rng,s.rng);
  assert.equal(JSON.stringify(s),before);
  assert(validateAmmunitionConservation(next,stock));
});
test('drop and same-room transfer maintain quantity and destination ownership',()=>{
  const original=fixture();
  const a=operate(original,'transfer',
    {fromId:'pc-1',toId:'pc-2',ammoId:'signal_cartridge',quantity:2}).state;
  assert.equal(a.actors[0].inventory.includes('signal_cartridge'),false);
  assert.equal(a.actors[0].gear.includes('signal_cartridge'),false);
  assert.equal(a.actors[1].inventory.filter(x=>x==='signal_cartridge').length,2);
  const b=operate(a,'drop',
    {actorId:'pc-2',roomId:'field',ammoId:'signal_cartridge',quantity:2}).state;
  assert.equal(b.rooms.field.items.filter(x=>x==='signal_cartridge').length,5);
  assert.equal(b.actors[1].inventory.includes('signal_cartridge'),false);
  assert(validateAmmunitionConservation(b,stock));
});
test('reload spends only owned spare rounds including source starting gear, never duplicates',()=>{
  const s=fixture();
  const {state:n,receipt}=operate(s,'reload',
    {actorId:'pc-1',weaponId:'launcher_01',quantity:1});
  assert.deepEqual(receipt,{kind:'reload',ammoId:'signal_cartridge',quantity:1});
  assert.equal(n.weapons[1].ammo.loaded,3);
  assert.equal(n.actors[0].inventory.includes('signal_cartridge'),false);
  assert.equal(n.actors[0].gear.includes('signal_cartridge'),true);
  assert(validateAmmunitionConservation(n,stock));
});
test('spend is one source-limited loaded round and increments one permanent spent counter',()=>{
  let s=fixture();
  for(let i=0;i<2;i++) {
    const before=s.ammoSpent.signal_cartridge;
    const {state:n,receipt}=operate(s,'spend',{actorId:'pc-1',weaponId:'launcher_01'});
    assert.deepEqual(receipt,{kind:'spend',ammoId:'signal_cartridge',quantity:1});
    assert.equal(n.ammoSpent.signal_cartridge,before+1);
    assert.equal(n.weapons[1].ammo.loaded,1-i);
    s=n;
  }
  rejects(s,{kind:'spend',actorId:'pc-1',weaponId:'launcher_01'});
  assert.equal(s.ammoSpent.signal_cartridge,2);
});
test('reload capacity, shortage, unknown ammo and forged loaded ammunition reject atomically',()=>{
  const s=fixture();
  rejects(s,{kind:'reload',actorId:'pc-1',weaponId:'launcher_01',quantity:2});
  rejects(s,{kind:'reload',actorId:'pc-1',weaponId:'launcher_01',quantity:5});
  rejects(s,{kind:'reload',actorId:'pc-2',weaponId:'launcher_01',quantity:1});
  rejects(s,{kind:'reload',actorId:'pc-1',weaponId:'knife_01',quantity:1});
  rejects(s,{kind:'pickup',actorId:'pc-1',roomId:'field',ammoId:'unknown_round',quantity:1});
  const fake=fixture();fake.weapons[1].ammo.loaded=3;
  assert.equal(validAmmunitionConservation(fake,stock),false);
});
test('location gates reject remote pickups, remote drops, and remote transfers',()=>{
  const s=fixture();s.actors[1].location='camp';
  rejects(s,{kind:'pickup',actorId:'pc-1',roomId:'camp',ammoId:'dart_round',quantity:1});
  rejects(s,{kind:'drop',actorId:'pc-1',roomId:'camp',ammoId:'signal_cartridge',quantity:1});
  rejects(s,{kind:'transfer',fromId:'pc-1',toId:'pc-2',ammoId:'signal_cartridge',quantity:1});
  rejects(s,{kind:'pickup',actorId:'pc-1',roomId:'unknown',ammoId:'signal_cartridge',quantity:1});
});
test('transfer rejects self-gifts, missing actors, absent spare and overdraw',()=>{
  const s=fixture();
  rejects(s,{kind:'transfer',fromId:'pc-1',toId:'pc-1',ammoId:'signal_cartridge',quantity:1});
  rejects(s,{kind:'transfer',fromId:'pc-1',toId:'ghost',ammoId:'signal_cartridge',quantity:1});
  rejects(s,{kind:'transfer',fromId:'pc-2',toId:'pc-1',ammoId:'signal_cartridge',quantity:1});
  rejects(s,{kind:'drop',actorId:'pc-1',roomId:'field',ammoId:'signal_cartridge',quantity:3});
  rejects(s,{kind:'pickup',actorId:'pc-1',roomId:'field',ammoId:'signal_cartridge',quantity:4});
});
test('invalid quantity, action shape, ambiguity and unsupported operations fail closed',()=>{
  const s=fixture();
  for(const bad of [0,-1,1.5,'1',NaN,Infinity,Number.MAX_SAFE_INTEGER])
    rejects(s,{kind:'pickup',actorId:'pc-1',roomId:'field',ammoId:'signal_cartridge',quantity:bad});
  rejects(s,{kind:'spend',actorId:'pc-1',weaponId:'launcher_01',quantity:2});
  rejects(s,{kind:'pickup',actorId:'pc-1',roomId:'field',ammoId:'signal_cartridge',quantity:1,script:'bonus'});
  rejects(s,{kind:'create',actorId:'pc-1'});
  rejects(s,{kind:'transfer',fromId:'pc-1',toId:'pc-2',ammoId:'dart_round',quantity:0});
  rejects(s,null);
});
test('conservation detects minted, missing, duplicated and misreported stock or consumption',()=>{
  const mutations=[
    s=>s.actors[0].inventory.push('signal_cartridge'),
    s=>s.rooms.field.items.push('signal_cartridge'),
    s=>s.rooms.field.items.pop(),
    s=>s.ammoSpent.signal_cartridge++,
    s=>s.ammoSpent.dart_round=-1,
    s=>s.ammoSpent.dart_round=Number.MAX_SAFE_INTEGER,
    s=>s.weapons[1].ammo.loaded=-1,
    s=>s.weapons[1].ammo.capacity=0,
    s=>s.actors[1].inventory.push('dart_rifle_01'),
  ];
  for(const mutate of mutations){const s=fixture();mutate(s);
    assert.equal(validAmmunitionConservation(s,stock),false);}
  for(const bad of [{signal_cartridge:8,dart_round:5},
    {signal_cartridge:7,dart_round:4},
    {signal_cartridge:-1,dart_round:5},
    {signal_cartridge:7},
    {signal_cartridge:7,dart_round:5,bonus:1}])
    assert.equal(validAmmunitionConservation(fixture(),bad),false);
});
test('malformed source records, aliases and missing spend counters are rejected',()=>{
  const invalid=[
    s=>{s.ammoSpent=null;}, s=>{delete s.ammoSpent;},
    s=>{s.ammoSpent.dart_round='1';},s=>{s.ammoSpent.bonus=0;},
    s=>{s.rooms.field.items=null;},s=>{s.rooms.field.items='signal_cartridge';},
    s=>{s.weapons=null;},s=>{s.weapons[0].itemId=s.weapons[1].itemId;},
  ];
  for(const mutate of invalid) {const s=fixture();mutate(s);
    assert.equal(validAmmunitionConservation(s,stock),false);}
  assert.equal(validAmmunitionConservation(fixture(),Object.create(stock)),false);
});
test('multiple weapons of the same ammunition type share one finite source ledger',()=>{
  const s=fixture();
  s.actors[1].inventory.push('second_launcher_01');
  s.weapons.push({id:'second_launcher_01',itemId:'second_launcher_01',ownerId:'pc-2',
    class:'ranged',ammo:{itemId:'signal_cartridge',capacity:3,loaded:0}});
  assert(validateAmmunitionConservation(s,stock));
  const taken=operate(s,'pickup',{actorId:'pc-2',roomId:'field',ammoId:'signal_cartridge',quantity:1}).state;
  const loaded=operate(taken,'reload',{actorId:'pc-2',weaponId:'second_launcher_01',quantity:1}).state;
  const spent=operate(loaded,'spend',{actorId:'pc-2',weaponId:'second_launcher_01'}).state;
  assert.equal(spent.ammoSpent.signal_cartridge,1);
  assert(validateAmmunitionConservation(spent,stock));
});
test('frozen source data are not mutated; replays produce identical state, ledger and receipts',()=>{
  const s=fixture();const firstInput=structuredClone(s),before=JSON.stringify(s);
  for(const actor of s.actors){Object.freeze(actor.inventory);Object.freeze(actor.gear);Object.freeze(actor);}
  for(const room of Object.values(s.rooms)){Object.freeze(room.items);Object.freeze(room);}
  for(const weapon of s.weapons){if(weapon.ammo)Object.freeze(weapon.ammo);Object.freeze(weapon);}
  Object.freeze(s.weapons);Object.freeze(s.actors);Object.freeze(s.ammoSpent);Object.freeze(s.rooms);Object.freeze(s);
  const action={kind:'pickup',actorId:'pc-1',roomId:'field',ammoId:'signal_cartridge',quantity:1};
  const one=applyAmmunitionAction(s,stock,action);
  const two=applyAmmunitionAction(JSON.parse(before),stock,structuredClone(action));
  assert.deepEqual(one,two);
  assert.deepEqual(s,firstInput);
  assert.equal(JSON.stringify(s),before);
  assert.equal(one.state.rng,1993);assert.equal(one.state.beat,7);
  assert(validateAmmunitionConservation(JSON.parse(JSON.stringify(one.state)),stock));
});
test('all five transactions are JSON replay deterministic, including gear spent counters',()=>{
  const steps=[
    {kind:'pickup',actorId:'pc-1',roomId:'field',ammoId:'signal_cartridge',quantity:1},
    {kind:'drop',actorId:'pc-1',roomId:'field',ammoId:'signal_cartridge',quantity:1},
    {kind:'transfer',fromId:'pc-1',toId:'pc-2',ammoId:'signal_cartridge',quantity:1},
    {kind:'spend',actorId:'pc-1',weaponId:'launcher_01'},
    {kind:'reload',actorId:'pc-1',weaponId:'launcher_01',quantity:1},
  ];
  const play=()=>steps.reduce((state,action)=>applyAmmunitionAction(state,stock,action).state,fixture());
  assert.deepEqual(play(),play());
  assert(validateAmmunitionConservation(play(),stock));
});
test('historical Party-style save without weapons or spend ledger is accepted untouched',()=>{
  const old={actors:[{id:'pc-1',inventory:['battery_cell'],gear:[]},
    {id:'pc-2',inventory:[]}],rooms:{shed:{items:['battery_cell']}},rng:67,beat:9};
  const before=JSON.stringify(old);
  assert(validateAmmunitionConservation(old));
  assert(validateAmmunitionConservation(old,{}));
  assert.equal(JSON.stringify(old),before);
  assert.equal(Object.hasOwn(old,'weapons'),false);
  assert.equal(Object.hasOwn(old,'ammoSpent'),false);
  assert.equal(validAmmunitionConservation(old,{signal_cartridge:1}),false);
  const forged={...old,ammoSpent:{}};
  assert.equal(validAmmunitionConservation(forged,{}),false);
});
