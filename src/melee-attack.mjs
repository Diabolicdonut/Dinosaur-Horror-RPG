// DHR-010: source-authorized, pure survivor-on-survivor melee resolution.
// The caller supplies authoritative world positions, an item->profile binding
// from authored equipment (never a player/save-supplied damage statistic), and
// already authorized combat budgets. This module does not attach to scenarios,
// invent equipment, alter saves, decide hostile intent or authorize encounters.
//
// Authority: private ALIEN RPG Evolved Edition, Close Combat pp. 62-64,
// equipment table p. 309 and Damage pp. 67-70; existing project adaptations:
// evolved-checks, evolved-encounters and evolved-injuries. No book text copied.
import {validateCarriedWeapons} from './carried-weapons.mjs';
import {resolveSkillCheck} from './evolved-checks.mjs';
import {spendActionBudget,rollCriticalInjury} from './evolved-encounters.mjs';
import {woundModifiers,applyNewCritical} from './evolved-injuries.mjs';

export const SOURCE_MELEE_PROFILES = Object.freeze({
  blunt_instrument:Object.freeze({modifier:1,baseDamage:1,armorPiercing:false}),
  combat_knife:Object.freeze({modifier:1,baseDamage:2,armorPiercing:false}),
  fire_axe:Object.freeze({modifier:0,baseDamage:2,armorPiercing:true}),
});

const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
  Object.getPrototypeOf(x)===Object.prototype;
const uint=x=>Number.isSafeInteger(x)&&x>=0&&x<=0xffffffff;
const exact=(x,keys)=>record(x)&&Object.keys(x).length===keys.length&&
  keys.every(k=>own(x,k));
const fail=message=>{throw new RangeError('Invalid melee attack: '+message);};
const fields=Object.freeze([
  'actors','weapons','attackerId','targetId','weaponId','sourceWeaponTypes',
  'attackerBudget','defend','defenderBudget','adjacent','seed','time',
  'push','defenderPush'
]);

// An Evolved human turn allows full+quick (either order) or two quick.
// Reject forged budget counters *before* rolling or applying an effect.
function checkBudget(b){
  if(!exact(b,['full','quick','quickSpent','fullSpent'])||
     !Object.values(b).every(Number.isInteger)||
     b.quickSpent<0||b.quickSpent>2||b.fullSpent<0||b.fullSpent>1||
     b.full!==(b.fullSpent||b.quickSpent===2?0:1)||
     b.quick!==2-b.quickSpent||(b.fullSpent&&b.quickSpent>1))
    fail('unverified Evolved action budget');
}
function spend(b,cost){
  checkBudget(b);
  const used=spendActionBudget(b,cost);
  if(!used.accepted)fail('insufficient '+cost+' action budget');
  return used.budget;
}
function checkHuman(a){
  // resolveSkillCheck will also validate the full career/attribute/skill sheet.
  if(!record(a)||!Number.isSafeInteger(a.healthMax)||a.healthMax<1||
     a.healthMax>30||!Number.isSafeInteger(a.health)||a.health<1||
     a.health>a.healthMax||a.dead===true||a.broken===true||
     typeof a.location!=='string'||!a.location)
    fail('unsupported or incapacitated human actor');
  // Physical armor provenance and nonstandard combat conditions belong to
  // later integration gates. Do not silently grant an armor/stance advantage.
  if((a.armorLevel??0)!==0||a.restrained===true||a.unaware===true||
     a.stunned===true||a.pendingSkip===true||a.cover===true)
    fail('unsupported armor or target condition');
}
function sourceProfile(weapons,types,id){
  const melee=weapons.filter(w=>w.class==='melee');
  if(!record(types)||Object.keys(types).length!==melee.length||
     melee.some(w=>!own(types,w.itemId)||!own(SOURCE_MELEE_PROFILES,types[w.itemId])))
    fail('missing, forged or unsupported source equipment profile');
  const weapon=weapons.find(w=>w.id===id);
  if(!weapon||weapon.class!=='melee')fail('not an authorized melee weapon');
  return {weapon,profile:SOURCE_MELEE_PROFILES[types[weapon.itemId]],type:types[weapon.itemId]};
}

/**
 * Resolve ONE declared full-action Close Combat strike at verified Adjacent
 * range using a verified, physically owned melee weapon. A predeclared defense
 * spends a genuine quick action and uses independent Evolved seeded dice.
 *
 * Trust boundary: sourceWeaponTypes must come from the trusted authored item
 * catalog (not an action/character/save); adjacent must come from the trusted
 * spatial adapter, not a player assertion; budgets must be from the authoritative
 * combat scheduler. Identity, valid ownership and numeric budget invariants are
 * independently revalidated here. Human targets only: dinosaurs, unarmed and
 * special attacks, armor/weak spots, stun, reaction permission and scenario
 * integration have separate queued owners.
 *
 * Results are standalone copies; inputs, RNG/beat and old save data are untouched.
 */
export function resolveMeleeAttack(input){
  if(!record(input)||Object.keys(input).some(k=>!fields.includes(k)))
    fail('attack options or unsupported manual stats');
  const {actors,weapons,attackerId,targetId,weaponId,sourceWeaponTypes,
    attackerBudget,defend=false,defenderBudget,adjacent,
    seed,time=0,push=0,defenderPush=0}=input;
  if(!Array.isArray(actors)||!Array.isArray(weapons))
    fail('actor and weapon collections required');
  validateCarriedWeapons(weapons,actors);
  if(typeof attackerId!=='string'||typeof targetId!=='string'||
     attackerId===targetId||!uint(seed)||!Number.isSafeInteger(time)||time<0||
     !Number.isInteger(push)||push<0||push>2||
     !Number.isInteger(defenderPush)||defenderPush<0||defenderPush>2)
    fail('actor, target, seed, time or push');
  if(typeof defend!=='boolean'||adjacent!==true||
     (!defend&&(defenderBudget!==undefined||defenderPush!==0)))
    fail('unsupported range or unsolicited defense');
  const attacker=actors.find(a=>a.id===attackerId);
  const target=actors.find(a=>a.id===targetId);
  if(!attacker||!target)fail('unknown target or attacker');
  checkHuman(attacker);checkHuman(target);
  if(attacker.location!==target.location)
    fail('target is not physically colocated at Adjacent range');
  const {weapon,profile,type}=sourceProfile(weapons,sourceWeaponTypes,weaponId);
  if(weapon.ownerId!==attackerId)fail('attacker does not carry this weapon');
  const attackerBudgetAfter=spend(attackerBudget,'full');
  const defenderBudgetAfter=defend?spend(defenderBudget,'quick'):null;
  // All input validation and budget verification precede the first die.
  const strike=resolveSkillCheck(attacker,{skill:'close_combat',
    modifier:profile.modifier+woundModifiers(attacker,'close_combat').modifier,
    seed,push});
  const defense=defend?resolveSkillCheck(target,{skill:'close_combat',
    modifier:woundModifiers(target,'close_combat').modifier,
    seed:(seed^0xa5a5a5a5)>>>0,push:defenderPush}):null;
  const opposedSuccesses=defense?.success?defense.successes:0;
  const remaining=strike.success?Math.max(0,strike.successes-opposedSuccesses):0;
  const raw=remaining>0?profile.baseDamage+remaining-1:0;
  // This slice intentionally permits only unarmored humans; the existing
  // project's flat armor/damage and D66 clinical consequences are retained.
  const damage=raw;
  let targetAfter=defense?.after??structuredClone(target);
  targetAfter.health=Math.max(0,targetAfter.health-damage);
  const broken=damage>0&&target.health>0&&targetAfter.health===0;
  const outright=damage>=2*target.healthMax;
  const critical=broken?rollCriticalInjury((seed^0xf1771ae1)>>>0,
    targetAfter.criticalInjuries||[]):null;
  targetAfter.broken=Boolean(targetAfter.broken||broken);
  targetAfter.dead=Boolean(targetAfter.dead||outright||critical?.deadline==='instant');
  if(targetAfter.dead)targetAfter.health=0;
  if(critical)targetAfter=applyNewCritical(targetAfter,critical,{time,seed});
  return {
    attackerId,targetId,weaponId,weaponType:type,seed,
    strike,defense,remaining,raw,armor:0,damage,broken,critical,
    dead:targetAfter.dead,attackerAfter:strike.after,targetAfter,
    attackerBudgetAfter,defenderBudgetAfter,
  };
}
