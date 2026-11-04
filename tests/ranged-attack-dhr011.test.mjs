import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {generateCharacter} from '../src/characters.mjs';
import {createActionBudget} from '../src/evolved-encounters.mjs';
import {resolveSkillCheck} from '../src/evolved-checks.mjs';
import {validateAmmunitionConservation,applyAmmunitionAction} from '../src/weapon-ammunition.mjs';
import {resolveRangedAttack} from '../src/ranged-attack.mjs';

const STOCK=Object.freeze({signal_cartridge:4});
const action=(fields={})=>({actorId:'pc-1',weaponId:'launcher_01',targetId:'raptor_01',seed:1993,...fields});
const targets=()=>[{id:'raptor_01',defeated:false},{id:'pc-2',dead:false}];
function fixture() {
  const shooter=generateCharacter({career:'tactical',seed:83,index:0});
  const other=generateCharacter({career:'ranger',seed:91,index:1});
  shooter.inventory=['signal_launcher_01','signal_cartridge'];
  other.inventory=[];
  shooter.location=other.location='field';
  return {
    saveVersion:3,beat:7,rng:2345,actors:[shooter,other],
    weapons:[{id:'launcher_01',itemId:'signal_launcher_01',ownerId:'pc-1',
      class:'ranged',ammo:{itemId:'signal_cartridge',capacity:3,loaded:2}}],
    ammoSpent:{signal_cartridge:0},
    rooms:{field:{items:['signal_cartridge']}},
    combat:{active:true,round:1,index:0,
      order:[{card:1,kind:'human',actorId:'pc-1'},
        {card:2,kind:'human',actorId:'pc-2'},
        {card:3,kind:'dinosaur',actorId:'raptor_01'}],
      budgets:{'pc-1':createActionBudget(),'pc-2':createActionBudget()}},
  };
}
const fire=(s=fixture(),a=action(),t=targets(),stock=STOCK)=>
  resolveRangedAttack(s,stock,a,t);
function denied(s,a=action(),t=targets(),stock=STOCK) {
  const before=JSON.stringify(s),r=fire(s,a,t,stock);
  assert.equal(r.accepted,false);
  assert.equal(JSON.stringify(s),before);
  return r.reason;
}
function throwsWithoutMutation(s,a=action(),t=targets(),stock=STOCK) {
  const before=JSON.stringify(s);
  assert.throws(()=>fire(s,a,t,stock),RangeError);
  assert.equal(JSON.stringify(s),before);
}
function freezeDeep(v) {
  if(v&&typeof v==='object'&&!Object.isFrozen(v)){
    Object.values(v).forEach(freezeDeep); Object.freeze(v);
  }
  return v;
}

test('DHR-011 module syntax and stock-backed fixture',()=>{
  const out=spawnSync(process.execPath,['--check',
    new URL('../src/ranged-attack.mjs',import.meta.url).pathname],{encoding:'utf8'});
  assert.equal(out.status,0,out.stderr);
  assert.equal(validateAmmunitionConservation(fixture(),STOCK),true);
});
test('valid source-backed shot costs a full action and rolls Evolved Agility plus Ranged Combat',()=>{
  const s=fixture(),r=fire(s),a=s.actors[0];
  assert.equal(r.accepted,true);
  assert.equal(r.kind,'ranged_attack');
  assert.equal(r.skill,'ranged_combat');
  assert.equal(r.cost,'full');
  assert.equal(r.check.attribute,'agility');
  assert.equal(r.check.baseCount,a.attributes.agility+a.skills.ranged_combat);
  assert.deepEqual(r.check,resolveSkillCheck(a,
    {skill:'ranged_combat',seed:1993,push:0,spendStoryPoint:false,storyPointTiming:'after'}));
  assert.equal(r.nextBudget.fullSpent,1);
  assert.equal(r.nextBudget.quickSpent,0);
  assert.equal(r.ammoItemId,'signal_cartridge');
  assert.equal(r.loadedAtDeclaration,2);
  assert.deepEqual(r.ammoAction,{kind:'spend',actorId:'pc-1',weaponId:'launcher_01'});
  assert(Object.isFrozen(r.ammoAction));
  assert.equal(r.rollSuccess,r.check.success);
  assert.equal(r.hit,null);
  assert.equal(r.damage,null);
  assert.equal(r.worldEffects,'unresolved');
});
test('an untrained actor rolls Agility without invented ranged training',()=>{
  const s=fixture(),shooter=s.actors[0];
  shooter.skills={heavy_machinery:1,stamina:3,close_combat:3,
    mobility:1,ranged_combat:0,piloting:1,observation:1,comtech:0,
    survival:0,command:0,manipulation:0,medical_aid:0};
  const r=fire(s);
  assert.equal(r.accepted,true);
  assert.equal(r.check.baseCount,shooter.attributes.agility);
});
test('one quick plus full remains legal; spent full or two quick deny the shot',()=>{
  const s=fixture();
  s.combat.budgets['pc-1']={full:1,quick:1,fullSpent:0,quickSpent:1};
  assert.deepEqual(fire(s).nextBudget,{full:0,quick:1,fullSpent:1,quickSpent:1});
  s.combat.budgets['pc-1']={full:0,quick:1,fullSpent:1,quickSpent:1};
  assert.match(denied(s),/Full action/);
  s.combat.budgets['pc-1']={full:0,quick:0,fullSpent:0,quickSpent:2};
  assert.match(denied(s),/Full action/);
});
test('only current human initiative owner may declare an attack',()=>{
  const s=fixture();
  s.combat.index=1;assert.match(denied(s),/initiative/);
  s.combat.index=2;assert.match(denied(s),/initiative/);
  s.combat.active=false;assert.match(denied(s),/initiative/);
  delete s.combat;assert.match(denied(s),/initiative/);
});
test('fabricated and internally contradictory budgets cannot buy extra attacks',()=>{
  for(const budget of [null,{}, {full:1,quick:2,fullSpent:1,quickSpent:0},
    {full:1,quick:7,fullSpent:0,quickSpent:0},
    {full:0,quick:0,fullSpent:1,quickSpent:2},
    {full:1,quick:2,fullSpent:'0',quickSpent:0},
    {full:1,quick:2,fullSpent:0,quickSpent:0,bonus:1}]){
    const s=fixture();s.combat.budgets['pc-1']=budget;
    assert.match(denied(s),/initiative/);
  }
});
test('unknown, self, dead or defeated targets and disabled shooters cannot fire',()=>{
  const s=fixture();
  assert.match(denied(s,action({targetId:'unknown_09'})),/Target is absent/);
  assert.match(denied(s,action({targetId:'pc-1'})),/cannot target/);
  assert.match(denied(s,action(),[{id:'raptor_01',defeated:true}]),/out of action/);
  s.actors[1].dead=true;
  assert.match(denied(s,action({targetId:'pc-2'})),/out of action/);
  for(const flag of ['dead','broken','pendingSkip']){
    const bad=fixture();bad.actors[0][flag]=true;
    assert.match(denied(bad),/cannot act/);
  }
  const broken=fixture();broken.actors[0].health=0;
  assert.match(denied(broken),/cannot act/);
});
test('undeclared, melee, wrongly owned and empty ranged weapons never roll',()=>{
  const s=fixture();
  assert.match(denied(s,action({weaponId:'unknown_01'})),/does not carry/);
  s.weapons.push({id:'knife_01',itemId:'knife_01_item',ownerId:'pc-2',class:'melee'});
  s.actors[1].inventory.push('knife_01_item');
  assert.match(denied(s,action({weaponId:'knife_01'})),/does not carry/);
  const illegal=fixture();illegal.weapons[0].ownerId='pc-2';
  throwsWithoutMutation(illegal);
  const empty=fixture();
  empty.weapons[0].ammo.loaded=0;
  empty.rooms.field.items.push('signal_cartridge','signal_cartridge');
  assert.equal(validateAmmunitionConservation(empty,STOCK),true);
  assert.match(denied(empty),/not loaded/);
});
test('forged ammo or duplicated gear fails independent stock conservation first',()=>{
  const cases=[];
  const a=fixture();a.weapons[0].ammo.loaded=3;cases.push(a);
  const b=fixture();b.actors[1].inventory.push('signal_launcher_01');cases.push(b);
  const c=fixture();c.weapons[0].ammo.loaded=99;cases.push(c);
  const d=fixture();d.ammoSpent.signal_cartridge=2;cases.push(d);
  const e=fixture();e.weapons[0].ammo.itemId='forged_round';cases.push(e);
  for(const bad of cases) throwsWithoutMutation(bad);
  throwsWithoutMutation(fixture(),action(),targets(),{signal_cartridge:100});
  throwsWithoutMutation(fixture(),action(),targets(),{});
});
test('unexpected modifiers, invalid IDs/seeds and fake targets are rejected',()=>{
  for(const a of [action({modifier:20}),action({damage:999}),
    action({aimed:true}),action({skill:'close_combat'}),
    action({seed:'1993'}),action({seed:-1}),action({seed:4294967296}),
    action({actorId:'../pc-1'}),action({push:7}),action({spendStoryPoint:1})]){
    throwsWithoutMutation(fixture(),a);
  }
  for(const t of [null,{},[{id:'raptor_01'},{id:'raptor_01'}],
    [{id:'../raptor'}],[{id:'raptor_01',dead:1}]]){
    throwsWithoutMutation(fixture(),action(),t);
  }
});
test('source-valid pushing and earned story points produce a proposed actor copy',()=>{
  const s=fixture();s.actors[0].storyPoints=1;
  const a=action({push:1,spendStoryPoint:true,storyPointTiming:'before'});
  const r=fire(s,a);
  assert.equal(r.accepted,true);
  assert.equal(r.check.storyPointSpent,true);
  assert.equal(r.actorAfter.storyPoints,0);
  assert.equal(s.actors[0].storyPoints,1);
  assert.deepEqual(r.check,resolveSkillCheck(s.actors[0],
    {skill:'ranged_combat',seed:1993,push:1,
      spendStoryPoint:true,storyPointTiming:'before'}));
  assert.match(denied(s,action({push:2})),/second Agility push/);
  assert.match(denied(fixture(),action({spendStoryPoint:true})),/story point/);
});
test('shot is a proposal only: DHR-009 independently commits one loaded round',()=>{
  const s=fixture(),before=JSON.stringify(s),r=fire(s);
  assert.equal(JSON.stringify(s),before);
  assert.equal(s.weapons[0].ammo.loaded,2);
  assert.equal(s.ammoSpent.signal_cartridge,0);
  const next=applyAmmunitionAction(s,STOCK,r.ammoAction);
  assert.equal(next.state.weapons[0].ammo.loaded,1);
  assert.equal(next.state.ammoSpent.signal_cartridge,1);
  assert.equal(JSON.stringify(s),before);
  assert(validateAmmunitionConservation(next.state,STOCK));
});
test('frozen replay, world RNG and pre-weapon historical saves remain unchanged',()=>{
  const s=fixture(),before=JSON.stringify(s),t=targets(),a=action({seed:3588});
  freezeDeep(s);freezeDeep(t);freezeDeep(a);
  const r=fire(s,a,t);
  assert.deepEqual(r,fire(s,a,t));
  assert.equal(r.check.draws,r.draws);
  assert.equal(JSON.stringify(s),before);
  assert.equal(s.rng,2345);
  assert.equal(s.beat,7);
  assert.equal(s.combat.budgets['pc-1'].fullSpent,0);
  const historical={saveVersion:3,actors:[{id:'pc-1',inventory:[]}],
    rng:1993,beat:0,history:[{kind:'look',seed:11}]};
  const fingerprint=JSON.stringify(historical);
  assert.match(denied(historical,action(),[],{}),/does not carry/);
  assert.equal(JSON.stringify(historical),fingerprint);
  assert(!('weapons' in historical));
  assert(!('ammoSpent' in historical));
  assert(!('combat' in historical));
});
