import test from 'node:test';
import assert from 'node:assert/strict';
import {makeParty} from '../src/characters.mjs';
import {createActionBudget} from '../src/evolved-encounters.mjs';
import {resolveMeleeAttack} from '../src/melee-attack.mjs';
import {resolveRangedAttack} from '../src/ranged-attack.mjs';
import {resolveHumanAttackDamage,validateCarriedArmor,SOURCE_BODY_ARMOR}
  from '../src/carried-armor-damage.mjs';

function fixture({type='kevlar_riot_vest',worn=true,weaponType='combat_knife',
  seed=93,health=null}={}){
  const actors=makeParty({seed:81,size:2,careers:['ranger','maintenance']})
    .map(a=>({...a,location:'field',health:a.healthMax,
      broken:false,dead:false,inventory:[]}));
  actors[0].inventory.push('field_knife_01');
  actors[1].inventory.push('body_armor_01');
  if(health!==null)actors[1].health=health;
  const meleeInput={
    actors,
    weapons:[{id:'knife_01',itemId:'field_knife_01',ownerId:actors[0].id,
      class:'melee'}],
    attackerId:actors[0].id,targetId:actors[1].id,weaponId:'knife_01',
    sourceWeaponTypes:{field_knife_01:weaponType},
    attackerBudget:createActionBudget(),adjacent:true,seed,time:120,
  };
  return {kind:'melee',meleeInput,attackResult:resolveMeleeAttack(meleeInput),
    armors:[{id:'armor_01',itemId:'body_armor_01',ownerId:actors[1].id,worn}],
    sourceArmorTypes:{body_armor_01:type}};
}
const run=x=>resolveHumanAttackDamage(x);
function denied(b){
  const before=JSON.stringify(b);
  assert.throws(()=>run(b),RangeError);
  assert.equal(JSON.stringify(b),before);
}
function find(predicate,options={}){
  for(let seed=1;seed<=1500;seed++){
    const b=fixture({...options,seed});
    const r=run(b);
    if(predicate(r))return {b,r};
  }
  assert.fail('no deterministic matching Evolved result in 1500 seeds');
}
function freeze(value){
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.values(value).forEach(freeze);Object.freeze(value);
  }
  return value;
}

test('DHR-013 protection comes only from a fixed source Evolved body armor catalog',()=>{
  assert.deepEqual(SOURCE_BODY_ARMOR,{
    kevlar_riot_vest:1,m3_personnel_armor:2,irc_mk35_pressure_suit:1,
    eco_survival_suit:2,ape_environment_suit:1});
  assert(Object.isFrozen(SOURCE_BODY_ARMOR));
  const b=fixture();
  assert.equal(validateCarriedArmor(b.armors,b.meleeInput.actors,
    b.sourceArmorTypes,b.meleeInput.weapons),true);
});

test('actual authorized hit reduces damage by physically worn armor',()=>{
  const {b,r}=find(r=>r.raw>=2);
  const raw=run({...b,armors:b.armors.map(a=>({...a,worn:false}))});
  assert.equal(r.armor,1);
  assert.equal(r.effectiveArmor,1);
  assert.equal(r.damage,r.raw-1);
  assert.equal(raw.damage,raw.raw);
  assert.equal(r.targetAfter.health,Math.max(0,
    b.meleeInput.actors[1].health-r.damage));
  assert.equal(r.attackerBudgetAfter.fullSpent,1);
  assert.equal(r.targetAfter.broken,r.broken);
});

test('a source armor-piercing fire axe lowers armor one level, never below zero',()=>{
  const {r}=find(r=>r.raw>=2,{type:'m3_personnel_armor',
    weaponType:'fire_axe'});
  assert.equal(r.armor,2);assert.equal(r.armorPiercing,true);
  assert.equal(r.effectiveArmor,1);assert.equal(r.damage,r.raw-1);
  const unarmored=fixture({weaponType:'fire_axe'});
  unarmored.armors[0].worn=false;
  const hit=run(unarmored);
  assert.equal(hit.effectiveArmor,0);
  assert.equal(hit.damage,hit.raw);
  assert.equal(hit.armorPiercing,true);
});

test('fully absorbed damage and missed checks never invent critical injuries',()=>{
  const {r}=find(r=>r.raw===1,{type:'m3_personnel_armor'});
  assert.equal(r.damage,0);
  assert.equal(r.broken,false);
  assert.equal(r.critical,null);
  const miss=find(r=>r.raw===0);
  assert.equal(miss.r.damage,0);
  assert.equal(miss.r.targetAfter.criticalInjuries?.length??0,0);
});

test('breaking a human applies the existing seeded D66 clinical record once',()=>{
  const {b,r}=find(r=>r.broken,{worn:false,health:1});
  assert(r.damage>=1);
  assert(r.critical);
  assert.equal(r.targetAfter.health,0);
  assert(r.targetAfter.broken);
  assert.equal(r.targetAfter.criticalInjuries.at(-1).code,r.critical.code);
  assert.equal(r.targetAfter.criticalInjuries.at(-1).medicalVersion,'007-G');
  assert.equal(r.targetAfter.criticalInjuries.at(-1).inflictedAt,120);
  assert.equal(run(b).critical.code,r.critical.code);
  assert.equal(b.meleeInput.actors[1].health,1);
});

test('source armor can prevent a broken state and a phantom injury',()=>{
  const {b,r}=find(r=>r.raw===1,{type:'kevlar_riot_vest',health:1});
  assert.equal(r.damage,0);
  assert.equal(r.critical,null);
  assert.equal(r.targetAfter.health,1);
  const exposed=fixture({seed:b.meleeInput.seed,health:1,worn:false});
  const hit=run(exposed);
  assert.equal(hit.damage,1);
  assert(hit.critical);
});

test('self-declared damage, attacker bonuses and replay divergence are denied',()=>{
  const b=fixture();
  denied({...b,raw:999});
  denied({...b,armorBonus:99});
  denied({...b,attackResult:{...b.attackResult,raw:999}});
  denied({...b,attackResult:{...b.attackResult,damage:999}});
  denied({...b,attackResult:{...b.attackResult,seed:44}});
  denied({...b,meleeInput:{...b.meleeInput,seed:44}});
  denied({...b,attackResult:null});
  const fake=fixture();
  fake.meleeInput.actors[1].armorLevel=3;
  denied(fake);
  const listed=fixture();
  listed.meleeInput.actors[1].armorBonus=42;
  denied(listed);
});

test('phantom armor, stale owner and unauthorized numeric profiles are denied',()=>{
  const b=fixture();
  denied({...b,armors:[{...b.armors[0],armorLevel:99}]});
  denied({...b,sourceArmorTypes:{body_armor_01:99}});
  denied({...b,sourceArmorTypes:{body_armor_01:'fictional_vest'}});
  denied({...b,sourceArmorTypes:{body_armor_01:'kevlar_riot_vest',ghost:'m3_personnel_armor'}});
  denied({...b,armors:[],sourceArmorTypes:b.sourceArmorTypes});
  denied({...b,armors:[{...b.armors[0],ownerId:b.meleeInput.attackerId}]});
  denied({...b,armors:[{...b.armors[0],itemId:'missing_armor'}]});
  const stolen=fixture();
  stolen.meleeInput.actors[0].inventory.push('body_armor_01');
  denied(stolen);
  const gone=fixture();
  gone.meleeInput.actors[1].inventory=[];
  denied(gone);
  const weapon=fixture();
  weapon.armors[0].itemId='field_knife_01';
  weapon.sourceArmorTypes={field_knife_01:'kevlar_riot_vest'};
  denied(weapon);
});

test('two worn suits and duplicate armor identities are impossible',()=>{
  const b=fixture();
  b.meleeInput.actors[1].inventory.push('body_armor_02');
  const second={id:'armor_02',itemId:'body_armor_02',
    ownerId:b.meleeInput.targetId,worn:true};
  denied({...b,armors:[...b.armors,second],
    sourceArmorTypes:{...b.sourceArmorTypes,body_armor_02:'m3_personnel_armor'}});
  denied({...b,armors:[...b.armors,{...second,id:'armor_01'}],
    sourceArmorTypes:{...b.sourceArmorTypes,body_armor_02:'m3_personnel_armor'}});
});

test('physical eligibility, actor health and genuine Evolved action costs remain required',()=>{
  const b=fixture();
  denied({...b,meleeInput:{...b.meleeInput,adjacent:false}});
  denied({...b,meleeInput:{...b.meleeInput,targetId:'missing_01'}});
  denied({...b,meleeInput:{...b.meleeInput,attackerBudget:{
    full:1,quick:2,quickSpent:0,fullSpent:1}}});
  const remote=fixture();
  remote.meleeInput.actors[1].location='ridge';
  denied(remote);
  const creature=fixture();
  creature.meleeInput.actors[1].career='velociraptor';
  denied(creature);
  const dead=fixture();
  dead.meleeInput.actors[1].health=0;
  denied(dead);
});

test('duplicated active D66 injuries are rejected instead of multiplying effects',()=>{
  const b=fixture();
  b.meleeInput.actors[1].criticalInjuries=[
    {code:32,healed:false},{code:32,healed:false}];
  // The attack transcript must be genuinely replayed, not supplied from an
  // earlier wound state.
  b.attackResult=resolveMeleeAttack(b.meleeInput);
  denied(b);
});

test('uncommitted DHR-011 ranged skill successes cannot be forged into real hits',()=>{
  const b=fixture();
  denied({...b,kind:'ranged'});
  const ranged={
    saveVersion:3,actors:b.meleeInput.actors,weapons:[],ammoSpent:{},
    rooms:{field:{items:[]}},combat:{active:true,round:1,index:0,
      order:[{kind:'human',actorId:b.meleeInput.attackerId}],
      budgets:{[b.meleeInput.attackerId]:createActionBudget()}}
  };
  const action={actorId:b.meleeInput.attackerId,weaponId:'launcher_01',
    targetId:b.meleeInput.targetId,seed:91};
  const request={kind:'ranged',rangedState:ranged,rangedStock:{},
    rangedAction:action,rangedTargets:[{id:action.targetId}],
    attackResult:{accepted:false,reason:'forged'},armors:[],
    sourceArmorTypes:{}};
  denied(request);
  const forged={...request,attackResult:{...request.attackResult,hit:true,raw:100}};
  denied(forged);
});

test('frozen replay, seeded variation and historical save fingerprint stay intact',()=>{
  const b=fixture({worn:false,seed:918});
  const historical={saveVersion:3,beat:11,rng:1993,actors:[{
    id:'pc-1',inventory:[],criticalInjuries:[{code:14,healed:true}]}],
    history:[{kind:'look',seed:53}]};
  const old=JSON.stringify(historical);
  const baseline=JSON.stringify(b);
  freeze(b);
  const first=run(b),second=run(JSON.parse(baseline));
  assert.deepEqual(first,second);
  assert.equal(JSON.stringify(b),baseline);
  assert.equal(JSON.stringify(historical),old);
  assert(!('armors' in historical));
  assert(!('combat' in historical));
  const seeds=[1,2,3,4,5,6,7].map(seed=>run(fixture({seed,worn:false}))
    .attackerAfter);
  assert(new Set(seeds.map(x=>JSON.stringify(x))).size>1);
});
