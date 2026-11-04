// DHR-013: source-backed carried body armor and human attack consequences.
// This is a pure adapter. No live encounter, ammo ledger, action history,
// scenario file, accepted checkpoint or historical save schema is mutated.
//
// Authority: privately held ALIEN RPG Evolved Edition, printed pp. 67-71
// (damage/armor/criticals), p. 90 and equipment summary p. 309.
// Source catalog bindings and the attack state MUST come from the trusted
// scenario/compiler and combat scheduler, never player prose or client stats.
import {validateCarriedWeapons} from './carried-weapons.mjs';
import {resolveMeleeAttack} from './melee-attack.mjs';
import {resolveRangedAttack} from './ranged-attack.mjs';
import {rollCriticalInjury} from './evolved-encounters.mjs';
import {applyNewCritical,TRAUMA} from './evolved-injuries.mjs';

export const SOURCE_BODY_ARMOR = Object.freeze({
  kevlar_riot_vest:1,
  m3_personnel_armor:2,
  irc_mk35_pressure_suit:1,
  eco_survival_suit:2,
  ape_environment_suit:1,
});
const has=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
  Object.getPrototypeOf(v)===Object.prototype;
const key=v=>typeof v==='string'&&/^[a-z][A-Za-z0-9_-]{1,63}$/.test(v);
const exact=(v,fields)=>object(v)&&Object.keys(v).length===fields.length&&
  fields.every(k=>has(v,k));
const fail=why=>{throw new RangeError('Invalid human damage: '+why);};
const clone=v=>structuredClone(v);

/**
 * Armor records are trusted source declarations, not items claimed in an
 * action. Each {id,itemId,ownerId,worn} binds a unique physically carried
 * item. A suit only protects the human while worn. A separate trusted
 * itemId->catalog-type mapping supplies ALL protection values.
 *
 * Carried-but-not-worn armor is allowed; two worn suits are not. This validates
 * ownership against both inventory and starting gear, and prohibits a weapon
 * being relabeled as armor. Missing armor arrays mean no NEW armor, which keeps
 * pre-armor adventures/saves unmodified.
 */
export function validateCarriedArmor(armors,actors,sourceArmorTypes,weapons=[]){
  if(!Array.isArray(armors)||!Array.isArray(actors)||!Array.isArray(weapons)||
     !object(sourceArmorTypes))fail('source armor roster required');
  validateCarriedWeapons(weapons,actors);
  if(Object.keys(sourceArmorTypes).length!==armors.length)
    fail('source armor mapping must be exact');
  const actorIds=new Set(),carriedIds=new Set(),wornBy=new Set(),armorIds=new Set();
  for(const actor of actors){
    if(!object(actor)||!key(actor.id)||actorIds.has(actor.id)||
       !Array.isArray(actor.inventory)||!Array.isArray(actor.gear??[]))
      fail('invalid or duplicate actor');
    actorIds.add(actor.id);
    if((actor.armorLevel??0)!==0||has(actor,'armorBonus')||has(actor,'armorRating'))
      fail('self-declared armor bonuses are forbidden');
  }
  const weaponItems=new Set(weapons.map(w=>w.itemId));
  for(const armor of armors){
    if(!exact(armor,['id','itemId','ownerId','worn'])||
       !key(armor.id)||!key(armor.itemId)||!key(armor.ownerId)||
       typeof armor.worn!=='boolean'||!actorIds.has(armor.ownerId)||
       armorIds.has(armor.id)||carriedIds.has(armor.itemId)||
       weaponItems.has(armor.itemId))
      fail('invalid or duplicate armor source declaration');
    armorIds.add(armor.id);carriedIds.add(armor.itemId);
    const type=sourceArmorTypes[armor.itemId];
    if(!has(sourceArmorTypes,armor.itemId)||!has(SOURCE_BODY_ARMOR,type))
      fail('missing or unsupported source armor type');
    let count=0,ownerCount=0;
    for(const actor of actors){
      const n=[...actor.inventory,...(actor.gear??[])]
        .filter(id=>id===armor.itemId).length;
      count+=n;if(actor.id===armor.ownerId)ownerCount=n;
    }
    if(count!==1||ownerCount!==1)
      fail('armor must physically belong to exactly one declared carrier');
    if(armor.worn){
      if(wornBy.has(armor.ownerId))fail('a human can wear only one armor suit');
      wornBy.add(armor.ownerId);
    }
  }
  for(const itemId of Object.keys(sourceArmorTypes))
    if(!carriedIds.has(itemId))fail('fabricated source armor binding');
  return true;
}

function validateInjuries(target){
  if(!Array.isArray(target.criticalInjuries??[]))
    fail('invalid existing injury list');
  const seen=new Set();
  for(const wound of target.criticalInjuries??[]){
    if(!object(wound)||!Number.isSafeInteger(wound.code)||
       !has(TRAUMA,wound.code)||(
         has(wound,'healed')&&typeof wound.healed!=='boolean'))
      fail('invalid critical injury contract');
    if(wound.code>=14&&!wound.healed){
      if(seen.has(wound.code))fail('duplicated active critical injury');
      seen.add(wound.code);
    }
  }
}

function replayAttack(input){
  if(!object(input)||Object.keys(input).some(k=>![
    'kind','meleeInput','rangedState','rangedStock','rangedAction',
    'rangedTargets','attackResult','armors','sourceArmorTypes',
  ].includes(k)))fail('unknown damage request field');
  if(input.kind==='melee'){
    if(['rangedState','rangedStock','rangedAction','rangedTargets']
      .some(k=>has(input,k))||!object(input.meleeInput))
      fail('unsupported melee declaration');
    const expected=resolveMeleeAttack(input.meleeInput);
    if(!object(input.attackResult)||JSON.stringify(expected)!==
      JSON.stringify(input.attackResult))
      fail('melee replay divergence or unverified attack result');
    return {expected,actors:input.meleeInput.actors,
      weapons:input.meleeInput.weapons};
  }
  if(input.kind==='ranged'){
    if(has(input,'meleeInput'))fail('mixed melee/ranged declaration');
    // DHR-011 explicitly produces a check/proposal (hit:null). It cannot
    // authorize damage even when the Evolved dice show successes. DHR-012
    // owns authoritative physical hits and must integrate before any ranged
    // world consequence can be accepted.
    const expected=resolveRangedAttack(input.rangedState,input.rangedStock,
      input.rangedAction,input.rangedTargets);
    if(!object(input.attackResult)||JSON.stringify(expected)!==
      JSON.stringify(input.attackResult))
      fail('ranged replay divergence or unverified shot');
    if(!expected.accepted||expected.hit!==true||
       !Number.isSafeInteger(expected.raw)||expected.raw<0)
      fail('ranged shot has no authenticated eligible hit/damage');
    fail('ranged physical damage requires the DHR-012 hit adapter');
  }
  fail('unknown attack type');
}

/**
 * Authenticate a fully source-resolved DHR-010 melee result against its
 * original world/seed declaration, then apply the target's carried armor and
 * existing Evolved D66 injury/clinical contract. No other action is created.
 * Inputs and the world RNG/history are NEVER mutated or committed.
 *
 * DHR-011 ranged proposals are deliberately denied (rather than converting a
 * skill success into a phantom shot/hit); physical ranged adjudication belongs
 * to DHR-012. No weak-spot, cover, stun, species damage, armor stacking or
 * runtime attack wiring is silently approximated in this adapter.
 */
export function resolveHumanAttackDamage(input){
  const {expected,actors,weapons}=replayAttack(input);
  validateCarriedArmor(input.armors,actors,input.sourceArmorTypes,weapons);
  const {attackerId,targetId,seed}=expected;
  if(!key(attackerId)||!key(targetId)||attackerId===targetId)
    fail('impossible attacker or target');
  const target=actors.find(a=>a.id===targetId);
  if(!target||target.dead===true||target.broken===true||
     !Number.isSafeInteger(target.health)||target.health<1||
     !Number.isSafeInteger(target.healthMax)||target.healthMax<1||
     target.health>target.healthMax)
    fail('human target is absent or incapable of receiving this hit');
  validateInjuries(target);
  const worn=input.armors.find(a=>a.ownerId===targetId&&a.worn);
  const armorType=worn?input.sourceArmorTypes[worn.itemId]:null;
  const level=armorType?SOURCE_BODY_ARMOR[armorType]:0;
  const piercing=expected.weaponType==='fire_axe'; // DHR-010 authoritative profile
  const effectiveArmor=Math.max(0,level-(piercing?1:0));
  const raw=expected.raw;
  if(!Number.isSafeInteger(raw)||raw<0||expected.remaining<0)
    fail('unvalidated raw damage');
  const damage=Math.max(0,raw-effectiveArmor);
  let targetAfter=clone(expected.defense?.after??target);
  const originalHealth=targetAfter.health;
  targetAfter.health=Math.max(0,originalHealth-damage);
  const broken=damage>0&&originalHealth>0&&targetAfter.health===0;
  const outright=damage>0&&damage>=2*target.healthMax;
  const critical=broken?
    rollCriticalInjury((seed^0xf1771ae1)>>>0,targetAfter.criticalInjuries??[]):null;
  if(critical) targetAfter=applyNewCritical(targetAfter,critical,
    {time:input.meleeInput.time??0,seed});
  targetAfter.broken=Boolean(targetAfter.broken||broken);
  targetAfter.dead=Boolean(targetAfter.dead||outright||
    critical?.deadline==='instant');
  if(targetAfter.dead)targetAfter.health=0;
  return {
    kind:'human_attack_damage',sourceKind:'melee',
    attackerId,targetId,seed,weaponId:expected.weaponId,
    rollSuccess:expected.strike.success,remaining:expected.remaining,
    raw,armor:level,armorType,armorItemId:worn?.itemId??null,
    armorPiercing:piercing,effectiveArmor,damage,broken,critical,
    dead:targetAfter.dead,attackerAfter:expected.attackerAfter,targetAfter,
    attackerBudgetAfter:expected.attackerBudgetAfter,
    defenderBudgetAfter:expected.defenderBudgetAfter,
  };
}
