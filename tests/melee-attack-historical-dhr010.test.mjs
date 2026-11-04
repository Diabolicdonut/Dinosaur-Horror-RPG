import test from 'node:test';
import assert from 'node:assert/strict';
import {newPartyIncident,isPartySave,upgradePartySave} from '../src/party-engine.mjs';
import {resolveMeleeAttack} from '../src/melee-attack.mjs';

test('DHR-010 leaves untouched historical Party saves without weapons or melee bindings',()=>{
  const old=newPartyIncident({seed:1993});
  delete old.adventureBinding;
  assert(isPartySave(old));
  const json=JSON.stringify(old),previousRng=old.rng;
  assert.equal(Object.hasOwn(old,'weapons'),false);
  assert.throws(()=>resolveMeleeAttack({
    actors:old.actors,weapons:[],attackerId:old.actors[0].id,
    targetId:old.actors[1].id,weaponId:'invented',
    sourceWeaponTypes:{},attackerBudget:{full:1,quick:2,quickSpent:0,fullSpent:0},
    adjacent:true,seed:1993,
  }),RangeError);
  assert.equal(JSON.stringify(old),json);
  assert.equal(old.rng,previousRng);
  assert(isPartySave(old));
  const upgraded=upgradePartySave(old);
  assert(isPartySave(upgraded));
  assert.equal(Object.hasOwn(upgraded,'weapons'),false);
});

test('no action attempts can mint an old save weapon, change its world RNG or rewrite history',()=>{
  const original=newPartyIncident({seed:81});
  const json=JSON.stringify(original);
  const invalids=[
    {id:'knife_01',itemId:'fabricated_01',ownerId:original.actors[0].id,class:'melee'},
    {id:'knife_01',itemId:'fabricated_01',ownerId:original.actors[0].id,class:'melee',damage:2},
  ];
  for(const weapon of invalids){
    assert.throws(()=>resolveMeleeAttack({
      actors:original.actors,weapons:[weapon],
      attackerId:original.actors[0].id,targetId:original.actors[1].id,
      weaponId:weapon.id,sourceWeaponTypes:{fabricated_01:'combat_knife'},
      attackerBudget:{full:1,quick:2,quickSpent:0,fullSpent:0},
      adjacent:true,seed:81,
    }),RangeError);
  }
  assert.equal(JSON.stringify(original),json);
  assert(isPartySave(original));
});
