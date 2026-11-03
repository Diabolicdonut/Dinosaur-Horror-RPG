import test from 'node:test';
import assert from 'node:assert/strict';
import {WEAPON_CLASSES,validateCarriedWeaponDefinition,
  validateCarriedWeapons,validCarriedWeapons} from '../src/carried-weapons.mjs';

const people = () => [
  {id:'pc-1', inventory:['tool_kit', 'field_knife_01'], gear:['protective vest']},
  {id:'pc-2', inventory:['signal_launcher_01', 'signal_cartridge'], gear:[]},
];
const knife = () => ({id:'knife_01',itemId:'field_knife_01',ownerId:'pc-1',class:'melee'});
const launcher = () => ({id:'launcher_01',itemId:'signal_launcher_01',ownerId:'pc-2',
  class:'ranged',ammo:{itemId:'signal_cartridge',capacity:2,loaded:1}});
const fails = (weapons, actors = people()) => {
  assert.equal(validCarriedWeapons(weapons, actors), false);
  assert.throws(() => validateCarriedWeapons(weapons, actors), RangeError);
};

test('only mechanical classes are exposed; no invented combat modifiers or attacks', () => {
  assert.deepEqual(WEAPON_CLASSES, ['melee','ranged']);
  assert(Object.isFrozen(WEAPON_CLASSES));
  assert(validateCarriedWeaponDefinition(knife()));
  assert(validateCarriedWeaponDefinition(launcher()));
  assert(validateCarriedWeapons([knife(),launcher()],people()));
});
test('ranged definitions permit an empty magazine and a full magazine', () => {
  for (const loaded of [0,2]) {
    const w=launcher(); w.ammo.loaded=loaded;
    assert(validateCarriedWeapons([w], people()));
  }
});
test('a starting-gear weapon counts as carried, but not as invented inventory', () => {
  const actors=people(); actors[0].gear.push('utility_blade_02');
  const spec={id:'blade_02',itemId:'utility_blade_02',ownerId:'pc-1',class:'melee'};
  assert(validateCarriedWeapons([spec],actors));
  assert(!actors[0].inventory.includes(spec.itemId));
});
test('an empty or absent specification set preserves old actors without a migration', () => {
  const actors=people(), original=structuredClone(actors);
  assert(validateCarriedWeapons([],actors));
  assert(validateCarriedWeapons(undefined,actors));
  assert.deepEqual(actors,original);
  assert(!('weapons' in actors[0]));
  fails(null,actors);
});
test('owner must be a real actor carrying exactly the weapon item', () => {
  const missingOwner=knife(); missingOwner.ownerId='pc-9'; fails([missingOwner]);
  const wrongCarrier=knife(); wrongCarrier.ownerId='pc-2'; fails([wrongCarrier]);
  const missingItem=people(); missingItem[0].inventory=[]; fails([knife()],missingItem);
});
test('weapons cannot be forged through duplicate inventories or gear slots', () => {
  const actors=people(); actors[1].inventory.push('field_knife_01'); fails([knife()],actors);
  const both=people(); both[0].gear.push('field_knife_01'); fails([knife()],both);
  const duplicated=people(); duplicated[0].inventory.push('field_knife_01'); fails([knife()],duplicated);
});
test('duplicate physical item or specification ID cannot create extra weapons', () => {
  const a=knife(), b=knife(); b.id='knife_02';
  fails([a,b]);
  const c=launcher(); c.id=a.id; fails([a,c]);
});
test('ammunition identity cannot alias a weapon item', () => {
  const a=launcher(); a.ammo.itemId=a.itemId; fails([a]);
  const b=launcher(); b.ammo.itemId='field_knife_01'; fails([knife(),b]);
});
test('melee weapons must not have ammunition while ranged weapons must have it', () => {
  const a=knife(); a.ammo={itemId:'cartridge',capacity:1,loaded:1}; fails([a]);
  const b=launcher(); delete b.ammo; fails([b]);
  const c=launcher(); c.ammo=null; fails([c]);
});
test('ammo count is finite, safe, integral and never greater than magazine capacity', () => {
  const mutate=(key,value)=>{const w=launcher();w.ammo[key]=value;fails([w]);};
  for(const value of [0,-1,1.5,NaN,Infinity,'6',2**53]) mutate('capacity',value);
  for(const value of [-1,1.5,NaN,Infinity,'1',3,2**53]) mutate('loaded',value);
});
test('unknown, missing, malformed or spoofed weapon fields are rejected', () => {
  for (const invalid of [null,[],{},'knife',42]) fails([invalid]);
  for (const field of ['id','itemId','ownerId','class']) {
    const w=knife(); delete w[field]; fails([w]);
  }
  for (const [field,value] of [['id',''],['itemId','../knife'],['ownerId','pc 1'],['class','energy']]) {
    const w=knife(); w[field]=value; fails([w]);
  }
  for(const field of ['damage','attackBonus','armor','script','range']){
    const w=knife(); w[field]=0; fails([w]);
  }
  const ammo=launcher();ammo.ammo.damage=99;fails([ammo]);
  const inherited=Object.create(knife());fails([inherited]);
});
test('actor identities and physical inventories are verified without assuming adventure IDs', () => {
  fails([knife()],null);
  fails([knife()],[{id:'pc-1',inventory:[]},{id:'pc-1',inventory:[]}]);
  fails([knife()],[{id:'pc-1',inventory:'field_knife_01'}]);
  fails([knife()],[{id:'pc-1',inventory:['field_knife_01'],gear:null}]);
  const w=knife();w.ownerId='ranger_01';
  assert(validateCarriedWeapons([w],[{id:'ranger_01',inventory:['field_knife_01']}]));
});
test('validation is deterministic, replay-safe and never mutates frozen input', () => {
  const actors=people(), weapons=[knife(),launcher()], before=JSON.stringify({actors,weapons});
  Object.freeze(actors[0].inventory);Object.freeze(actors[0].gear);
  Object.freeze(actors[1].inventory);Object.freeze(actors[1].gear);
  actors.forEach(Object.freeze);Object.freeze(actors);
  Object.freeze(weapons[1].ammo);weapons.forEach(Object.freeze);Object.freeze(weapons);
  for(let i=0;i<15;i++) assert.equal(validateCarriedWeapons(weapons,actors),true);
  assert.equal(JSON.stringify({actors,weapons}),before);
  const reloaded=JSON.parse(before);
  assert(validateCarriedWeapons(reloaded.weapons,reloaded.actors));
  assert.deepEqual(reloaded,{actors,weapons});
});
