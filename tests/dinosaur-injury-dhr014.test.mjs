import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {compileAdventure,adventureBinding,adventureFingerprint}
  from '../src/adventure-definition.mjs';
import {initialAdventureCreatures} from '../src/adventure-creatures.mjs';
import {beginAdventureCombat,activeAdventureCombatSlot}
  from '../src/adventure-combat-scheduler.mjs';
import {makeParty,validateCharacter} from '../src/characters.mjs';
import {resolveDinosaurInjury,resolveDinosaurWithdrawal}
  from '../src/dinosaur-injury.mjs';

const room=(name,exits)=>({name,description:'An independent physical zone.',exits,items:[]});
const def={
  schemaVersion:1,id:'injury_arboretum',revision:1,title:'Ranger contact test',
  premise:'An optional encounter in a wild sanctuary.',
  start:'nest',startItems:[],itemNames:{knife_item:'Park service axe'},
  rooms:{
    nest:room('Nesting thicket',['clearing','woods']),
    clearing:room('Open clearing',['nest','woods']),
    woods:room('Pine woods',['nest','clearing']),
  },
  flags:{},objectives:[{id:'leave',description:'Leave the sanctuary',
    room:'clearing',requires:[],effects:[{type:'end',outcome:'completed'}]}],
  initialCreatures:[{id:'raptor_01',species:'velociraptor',
    location:'nest',disposition:'predatory'}],
  variants:{},
};
function fixture({species='velociraptor',disposition='predatory',weaponType='fire_axe',
  blocker=[],control='party',roomId='nest',health=4}={}) {
  const definition=structuredClone(def);
  definition.initialCreatures[0].species=species;
  definition.initialCreatures[0].disposition=disposition;
  const compiled=compileAdventure(definition,{seed:11});
  const actor=makeParty({size:1,seed:20,careers:['tactical']})[0];
  actor.attributes={strength:5,agility:3,wits:4,empathy:2};
  actor.skills=Object.fromEntries(Object.keys(actor.skills).map(k=>[k,0]));
  Object.assign(actor.skills,{close_combat:3,stamina:3,ranged_combat:3,
    heavy_machinery:1});
  actor.resolve=3;actor.healthMax=4;actor.health=health;
  actor.location=roomId;actor.inventory=['knife_item'];actor.broken=false;actor.dead=false;
  assert.deepEqual(validateCharacter(actor),[]);
  let combat;
  for(let seed=1;seed<100;seed++){
    const candidate=beginAdventureCombat({actorIds:[actor.id],
      predatorId:'raptor_01',predatorSpeed:2,seed});
    if(activeAdventureCombatSlot(candidate).actorId===actor.id){
      combat=candidate;break;
    }
  }
  assert(combat,'test fixture needs a human initiative first');
  const state={
    saveVersion:3,adventureBinding:adventureBinding(compiled),beat:0,rng:8888,
    actors:[actor],dinosaurs:initialAdventureCreatures(compiled),
    weapons:[{id:'axe_01',itemId:'knife_item',ownerId:actor.id,class:'melee'}],
    rooms:Object.fromEntries(Object.keys(definition.rooms).map(id=>[id,{items:[]}])),
    combat,creatureRecords:[],control:{mode:control},
    actions:[],outcome:'playing',
  };
  const attack={actorId:actor.id,creatureId:'raptor_01',
    weaponId:'axe_01',seed:25};
  return {compiled,state,attack,
    sourceWeaponTypes:{knife_item:weaponType},
    contact:{a:actor.id,b:'raptor_01',range:'adjacent'},
    blockedEdges:blocker};
}
const run=f=>resolveDinosaurInjury(f);
function find(where,options={}) {
  const f=fixture(options);
  for(let seed=0;seed<3000;seed++){
    f.attack.seed=seed;
    const result=run(f);
    if(where(result))return {f,result};
  }
  assert.fail('Unable to find a reproducible relevant seeded outcome.');
}
const invalid=f=>{
  const before=JSON.stringify(f);
  assert.throws(()=>run(f),RangeError);
  assert.equal(JSON.stringify(f),before,'a rejected hit mutates no source or save');
};
function freeze(x){
  if(x&&typeof x==='object'&&!Object.isFrozen(x)){
    Object.values(x).forEach(freeze);Object.freeze(x);
  }
  return x;
}

test('DHR-014 module has valid Node ESM syntax and independent source identity',()=>{
  const p=spawnSync(process.execPath,['--check',
    new URL('../src/dinosaur-injury.mjs',import.meta.url).pathname],{encoding:'utf8'});
  assert.equal(p.status,0,p.stderr);
  const f=fixture();
  assert.equal(f.compiled.fingerprint,adventureFingerprint(f.compiled.definition));
  assert.equal(f.state.dinosaurs[0].defeated,false);
  assert.equal(f.state.dinosaurs[0].health,undefined);
});

test('real carried weapon, adjacent source contact and Evolved dice wound the animal',()=>{
  const {f,result:r}=find(r=>r.damage>0&&r.healthAfter>0);
  assert.equal(r.accepted,true);
  assert.equal(r.strike.success,true);
  assert(r.strike.rolls||r.strike.baseDice||r.strike.baseRolls||r.strike.successes>0);
  assert.equal(r.armor,1);
  assert.equal(r.effectiveArmor,0,'a source fire axe pierces one armor level');
  assert.equal(r.damage,r.raw-r.effectiveArmor);
  assert.equal(r.healthBefore,6);
  assert.equal(r.creatureAfter.health,6-r.damage);
  assert.equal(r.creatureAfter.defeated,false);
  assert.equal(r.combatAfter.budgets[f.attack.actorId].fullSpent,1);
  assert.equal(r.combatAfter.history.at(-1).kind,'attack');
  assert.equal(r.worldCommitted,false);
  assert.equal(r.combatSecondsAdvanced,0);
});

test('a clean miss or absorbed hit neither wounds nor triggers animal flight',()=>{
  const {result:r}=find(r=>r.damage===0);
  assert.equal(r.reaction,'unharmed');
  assert.equal(r.withdrawal,null);
  assert.equal(r.creatureAfter.health,6);
  assert.equal(r.creatureAfter.injured,false);
  assert.equal(r.reactionRoll,null);
});

test('a high genuine Evolved hit incapacitates, without human D66 or forced death',()=>{
  const {result:r}=find(r=>r.incapacitated);
  assert.equal(r.healthAfter,0);
  assert.equal(r.creatureAfter.defeated,true);
  assert.equal(r.reaction,'incapacitated');
  assert.equal(r.withdrawal,null);
  assert.equal(r.creatureAfter.dead,undefined);
  assert.equal(r.creatureAfter.criticalInjuries,undefined);
});

test('nonlethal retreat names only a connected unblocked empty exit',()=>{
  const {f,result:r}=find(r=>r.reaction==='withdraw');
  assert.equal(r.creatureAfter.location,'nest','attacker turn cannot teleport wildlife');
  assert.equal(r.withdrawal.from,'nest');
  assert.equal(r.withdrawal.to,'clearing');
  assert.equal(r.withdrawal.movementTurns,1);
  assert.equal(r.withdrawal.immediate,false);
  const next=structuredClone(r.combatAfter);
  next.index=next.order.findIndex((slot,i)=>i>f.state.combat.index&&
    slot.kind==='dinosaur');
  assert(next.index>f.state.combat.index);
  const moved=resolveDinosaurWithdrawal(f,next);
  assert.equal(moved.accepted,true);
  assert.equal(moved.creatureAfter.location,'clearing');
  assert.equal(moved.creatureTurnsSpent,1);
  assert.equal(moved.combatAfter.history.at(-1).cost,'full');
  assert.equal(moved.worldCommitted,false);
});

test('source blockers prevent the only safe escape and never allow a teleport',()=>{
  const f=fixture({blocker:[['nest','clearing'],['nest','woods']]});
  const {result:r}=find(r=>r.damage>0&&r.healthAfter>0,
    {blocker:[['nest','clearing'],['nest','woods']]});
  assert.equal(r.withdrawal,null);
  assert.notEqual(r.reaction,'withdraw');
  const blocked=find(r=>r.damage>0&&r.reaction==='withdraw',
    {blocker:[['nest','clearing']]});
  assert.equal(blocked.result.withdrawal.to,'woods');
  assert.equal(f.blockedEdges.length,2);
});

test('occupied exit is not a magically safe unobserved withdrawal',()=>{
  const f=fixture();
  f.state.actors.push({...f.state.actors[0],id:'pc-2',
    location:'clearing',inventory:[],gear:[...f.state.actors[0].gear]});
  // The control roster still has a single active combatant. The extra human
  // is a non-participating but physically real witness occupying the exit.
  const {result:r}=find(r=>r.reaction==='withdraw');
  f.attack.seed=r.seed;
  const actual=run(f);
  assert.equal(actual.withdrawal?.to,'woods');
});

test('wrong turn, reused creature card, mismatched initiative cannot move animal',()=>{
  const {f,result:r}=find(r=>r.reaction==='withdraw');
  assert.equal(resolveDinosaurWithdrawal(f,r.combatAfter).accepted,false);
  const next=structuredClone(r.combatAfter);
  next.index=1;
  next.cardSeed=9999;
  assert.equal(resolveDinosaurWithdrawal(f,next).accepted,false);
  next.cardSeed=r.combatAfter.cardSeed;
  next.history.push({round:next.round,card:next.order[1].card,
    actorId:'raptor_01',kind:'withdraw',cost:'full'});
  assert.equal(resolveDinosaurWithdrawal(f,next).accepted,false);
});

test('no fabricated damage, health, weakness, reaction, death or actor option',()=>{
  const cases=[
    f=>f.attack.damage=12,
    f=>f.attack.weakSpot='eyes',
    f=>f.attack.reaction='flee',
    f=>f.attack.targetId='raptor_01',
    f=>f.attack.seed=-1,
    f=>f.attack.push=4,
    f=>f.state.dinosaurs[0].health=1,
    f=>f.state.dinosaurs[0].injured=true,
    f=>f.state.dinosaurs[0].dead=true,
    f=>f.state.dinosaurs[0].defeated=true,
    f=>f.sourceWeaponTypes.knife_item='imaginary_laser',
    f=>f.sourceWeaponTypes.fake='combat_knife',
    f=>f.state.weapons[0].ownerId='pc-2',
    f=>f.state.actors[0].inventory=[],
    f=>f.contact.range='long',
    f=>f.contact.a='pc-999',
    f=>f.state.combat.predatorId='unknown',
    f=>f.state.combat.budgets['pc-1'].fullSpent=1,
    f=>f.blockedEdges.push(['nest','ghost']),
    f=>f.blockedEdges.push(['nest','woods'],['woods','nest']),
  ];
  for(const corrupt of cases){const f=fixture();corrupt(f);invalid(f);}
});

test('noncontact, unseeded threat and unsupported species cannot be damaged',()=>{
  const far=fixture({roomId:'woods'});invalid(far);
  const grazer=fixture({species:'parasaurolophus',disposition:'neutral'});invalid(grazer);
  const others=fixture({species:'unknown_rex'});invalid(others);
  const broken=fixture();broken.state.actors[0].broken=true;invalid(broken);
  const noCombat=fixture();noCombat.state.combat=null;invalid(noCombat);
  const mismatch=fixture();mismatch.state.adventureBinding.fingerprint='00000000';
  invalid(mismatch);
});

test('normal, frozen, cloned and reloaded inputs produce identical seeded proofs',()=>{
  const f=fixture(),prior=JSON.stringify(f.state),attack=JSON.stringify(f.attack);
  freeze(f);
  const a=run(f),b=run(f),c=run(structuredClone(f));
  assert.deepEqual(a,b);assert.deepEqual(b,c);
  assert.equal(JSON.stringify(f.state),prior);
  assert.equal(JSON.stringify(f.attack),attack);
  assert.equal(f.state.rng,8888);
  assert.equal(f.state.beat,0);
});

test('Party, Focus and Spectator do not alter animal mechanical response',()=>{
  const party=fixture(),focus=fixture({control:'focus'}),
    spectator=fixture({control:'spectator'});
  const canonical=run(party);
  for(const variant of [focus,spectator]){
    const alt=run(variant);
    assert.deepEqual(alt,canonical);
  }
});

test('historical v3 save and original scenario definition remain unchanged',()=>{
  const f=fixture(),source=JSON.stringify(f.compiled.definition),
    state=JSON.stringify(f.state);
  run(f);
  assert.equal(JSON.stringify(f.compiled.definition),source);
  assert.equal(JSON.stringify(f.state),state);
  assert.equal(f.state.dinosaurs[0].health,undefined);
  assert.equal(f.state.dinosaurs[0].injured,undefined);
  assert.equal(f.state.saveVersion,3);
  assert.equal(f.state.adventureBinding.fingerprint,f.compiled.fingerprint);
});
