import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {createActionBudget,spendActionBudget} from '../src/evolved-encounters.mjs';
import {validateCarriedWeapons} from '../src/carried-weapons.mjs';
import {resolveMeleeAttack,SOURCE_MELEE_PROFILES} from '../src/melee-attack.mjs';

const fixture=()=>{
  const actors=makeParty({seed:81,size:2,careers:['ranger','maintenance']})
    .map(a=>({...a,location:'field',health:a.healthMax,broken:false,
      dead:false,inventory:[]}));
  actors[0].inventory.push('field_knife_01');
  return {
    actors,
    weapons:[{id:'knife_01',itemId:'field_knife_01',ownerId:actors[0].id,class:'melee'}],
    attackerId:actors[0].id,targetId:actors[1].id,weaponId:'knife_01',
    sourceWeaponTypes:{field_knife_01:'combat_knife'},
    attackerBudget:createActionBudget(),adjacent:true,seed:91,time:120,
  };
};
const throws=(bad)=>{
  const before=structuredClone(bad);
  assert.throws(()=>resolveMeleeAttack(bad),RangeError);
  assert.deepEqual(bad,before);
};
const find=(predicate,options={})=>{
  const base=fixture();
  for(let seed=1;seed<1500;seed++){
    const result=resolveMeleeAttack({...base,seed,...options});
    if(predicate(result))return result;
  }
  assert.fail('no deterministic matching attack in 1500 source seeds');
};

test('DHR-010 profiles contain only three source-confirmed, ordinary damage melee types',()=>{
  assert.deepEqual(Object.keys(SOURCE_MELEE_PROFILES).sort(),
    ['blunt_instrument','combat_knife','fire_axe']);
  assert.deepEqual(SOURCE_MELEE_PROFILES.combat_knife,
    {modifier:1,baseDamage:2,armorPiercing:false});
  assert(Object.isFrozen(SOURCE_MELEE_PROFILES));
});

test('verified physical knife uses Evolved Close Combat dice, source damage and full action',()=>{
  const input=fixture();
  assert(validateCarriedWeapons(input.weapons,input.actors));
  const pre=structuredClone(input);
  const hit=find(r=>r.remaining>=2);
  assert.equal(hit.strike.skill,'close_combat');
  assert.equal(hit.strike.modifier,1);
  assert.equal(hit.strike.attribute,'strength');
  assert.equal(hit.remaining,hit.strike.successes);
  assert.equal(hit.raw,2+hit.remaining-1);
  assert.equal(hit.damage,hit.raw);
  assert.equal(hit.attackerBudgetAfter.fullSpent,1);
  assert.equal(hit.attackerBudgetAfter.quick,2);
  assert.equal(hit.defense,null);
  assert.equal(hit.defenderBudgetAfter,null);
  assert.deepEqual(input,pre);
});

test('source profiles alter only authorized base damage/bonus; no weapon stat injection',()=>{
  const base=fixture();
  const blunt={...base,sourceWeaponTypes:{field_knife_01:'blunt_instrument'}};
  const axe={...base,sourceWeaponTypes:{field_knife_01:'fire_axe'}};
  const b=resolveMeleeAttack(blunt),a=resolveMeleeAttack(axe);
  assert.equal(b.strike.modifier,1);
  assert.equal(a.strike.modifier,0);
  assert.equal(b.raw,b.remaining?b.remaining:0);
  assert.equal(a.raw,a.remaining?2+a.remaining-1:0);
  throws({...base,damage:999});
  throws({...base,attackBonus:999});
  throws({...base,sourceWeaponTypes:{field_knife_01:{modifier:99,baseDamage:12}}});
  throws({...base,sourceWeaponTypes:{field_knife_01:'stun_baton'}});
  throws({...base,sourceWeaponTypes:{}});
  throws({...base,sourceWeaponTypes:{field_knife_01:'combat_knife',phantom:'fire_axe'}});
});

test('miss, panic-blocked strike and zero damage never grant an injury',()=>{
  const miss=find(r=>r.remaining===0);
  assert.equal(miss.raw,0);assert.equal(miss.damage,0);
  assert.equal(miss.critical,null);
  assert.equal(miss.broken,false);
  assert.equal(miss.targetAfter.health,fixture().actors[1].health);
  const stressed=fixture();
  stressed.actors[0].stress=10;
  const blocked=find(r=>r.strike.successes>0&&!r.strike.success,{actors:stressed.actors});
  assert.equal(blocked.remaining,0);
  assert.equal(blocked.damage,0);
});

test('predeclared source defense uses a quick interrupt and independently rolled Close Combat',()=>{
  const base=fixture();
  const r=resolveMeleeAttack({...base,defend:true,defenderBudget:createActionBudget()});
  assert.equal(r.defense.skill,'close_combat');
  assert.equal(r.defense.attribute,'strength');
  assert.equal(r.defenderBudgetAfter.quickSpent,1);
  assert.equal(r.attackerBudgetAfter.fullSpent,1);
  const expected=r.strike.success?Math.max(0,
    r.strike.successes-(r.defense.success?r.defense.successes:0)):0;
  assert.equal(r.remaining,expected);
  const replay=resolveMeleeAttack({...base,defend:true,defenderBudget:createActionBudget()});
  assert.deepEqual(r,replay);
  const counter=find(r=>r.defense.successes>0&&r.remaining<r.strike.successes,
    {defend:true,defenderBudget:createActionBudget()});
  assert(counter.defense.initial.base.every(d=>d>=1&&d<=6));
});

test('no undeclared defense, free reactive action or exhaustion is permitted',()=>{
  const b=fixture();
  throws({...b,defend:true});
  throws({...b,defend:false,defenderBudget:createActionBudget()});
  throws({...b,defenderPush:1});
  throws({...b,defend:'yes',defenderBudget:createActionBudget()});
  const empty=spendActionBudget(spendActionBudget(createActionBudget(),'quick').budget,'quick').budget;
  throws({...b,attackerBudget:empty});
  throws({...b,defend:true,defenderBudget:empty});
  throws({...b,attackerBudget:{full:99,quick:2,quickSpent:0,fullSpent:0}});
  throws({...b,attackerBudget:{...createActionBudget(),bonus:1}});
  const afterFull=spendActionBudget(createActionBudget(),'full').budget;
  throws({...b,attackerBudget:afterFull});
  const afterQuick=spendActionBudget(createActionBudget(),'quick').budget;
  const accepted=resolveMeleeAttack({...b,attackerBudget:afterQuick});
  assert.equal(accepted.attackerBudgetAfter.quick,1);
  assert.equal(accepted.attackerBudgetAfter.full,0);
});

test('weapon must exist once, be carried by attacker and pass exact DHR-007 schema',()=>{
  const b=fixture();
  throws({...b,weapons:[]});
  throws({...b,weapons:[{...b.weapons[0],ownerId:b.targetId}]});
  throws({...b,weaponId:'invented'});
  throws({...b,weaponId:'launcher_01'});
  throws({...b,weapons:[{...b.weapons[0],damage:50}]});
  throws({...b,weapons:[{...b.weapons[0],ammo:{itemId:'ammo_1',capacity:2,loaded:2}}]});
  const missing=fixture();missing.actors[0].inventory=[];
  throws(missing);
  const duplicated=fixture();duplicated.actors[1].gear.push('field_knife_01');
  throws(duplicated);
  const ranged=fixture();ranged.weapons[0]={...ranged.weapons[0],class:'ranged',
    ammo:{itemId:'fake_ammo',capacity:2,loaded:2}};
  throws(ranged);
});

test('target must be alive, independently valid and physically Adjacent',()=>{
  const b=fixture();
  throws({...b,adjacent:false});
  throws({...b,adjacent:'true'});
  const remote=fixture();remote.actors[1].location='ridge';throws(remote);
  throws({...b,attackerId:b.targetId,targetId:b.targetId});
  throws({...b,targetId:'pc-9'});
  const dead=fixture();dead.actors[1].dead=true;throws(dead);
  const broken=fixture();broken.actors[1].broken=true;broken.actors[1].health=0;throws(broken);
  const unwounded=fixture();unwounded.actors[0].health=0;throws(unwounded);
  const armor=fixture();armor.actors[1].armorLevel=2;throws(armor);
  const hidden=fixture();hidden.actors[1].unaware=true;throws(hidden);
  const stunned=fixture();stunned.actors[1].stunned=true;throws(stunned);
  const creature=fixture();creature.actors[1].career='velociraptor';throws(creature);
});

test('D66 critical and source-adopted broken/dead effects occur only on genuine hits',()=>{
  const base=fixture();base.actors[1].health=1;
  const hit=find(r=>r.broken,{actors:base.actors});
  assert(hit.critical);
  assert.equal(hit.targetAfter.health,0);
  assert(hit.targetAfter.broken);
  assert(hit.targetAfter.criticalInjuries.some(w=>w.code===hit.critical.code));
  assert.equal(hit.targetAfter.criticalInjuries.at(-1).medicalVersion,'007-G');
  assert.equal(hit.targetAfter.criticalInjuries.at(-1).inflictedAt,120);
  assert.equal(base.actors[1].health,1);
  const untouched=find(r=>r.damage===0,{actors:base.actors});
  assert.equal(untouched.targetAfter.criticalInjuries?.length||0,0);
});

test('existing critical wounds apply source modifiers but source sheet stays unchanged',()=>{
  const b=fixture();b.actors[0].criticalInjuries=[{code:32,healed:false}];
  const r=resolveMeleeAttack(b);
  assert.equal(r.strike.modifier,-1); // source knife +1 and rib injury -2
  assert.deepEqual(b.actors[0].criticalInjuries,[{code:32,healed:false}]);
  b.actors[0].criticalInjuries[0].healed=true;
  assert.equal(resolveMeleeAttack(b).strike.modifier,1);
});

test('refuses invalid seeds, pushes, clocks and fabricated gear without rolling',()=>{
  const b=fixture();
  for(const seed of [-1,2**32,1.25,'91',NaN,Infinity,null,undefined])
    throws({...b,seed});
  for(const push of [-1,3,'1',1.25])throws({...b,push});
  for(const time of [-1,'120',1.5])throws({...b,time});
  const fake=fixture();fake.weapons[0].itemId='ghost_knife';
  throws(fake);
});

test('frozen inputs, JSON replay, seeded dice and historical data remain immutable',()=>{
  const b=fixture();
  b.actors[0].rng=1993;b.actors[1].beat=11;
  const snapshot=JSON.stringify(b);
  for(const a of b.actors){
    Object.freeze(a.inventory);Object.freeze(a.gear);Object.freeze(a.attributes);
    Object.freeze(a.skills);Object.freeze(a);
  }
  Object.freeze(b.weapons[0]);Object.freeze(b.weapons);
  Object.freeze(b.actors);Object.freeze(b.sourceWeaponTypes);
  Object.freeze(b.attackerBudget);Object.freeze(b);
  const once=resolveMeleeAttack(b);
  const twice=resolveMeleeAttack(JSON.parse(snapshot));
  assert.deepEqual(once,twice);
  assert.equal(JSON.stringify(b),snapshot);
  assert.equal(once.attackerAfter.rng,1993);
  assert.equal(once.targetAfter.beat,11);
  assert.equal(once.strike.initial.base.filter(x=>x===6).length+
    once.strike.initial.stress.filter(x=>x===6).length,
    once.strike.pushes.length?once.strike.initial.base.filter(x=>x===6).length+
      once.strike.initial.stress.filter(x=>x===6).length:once.strike.successes);
});
