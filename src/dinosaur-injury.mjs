// DHR-014 / #110: pure, source-limited animal injury and withdrawal proposal.
// No action handler, creature registry, adventure definition or save is altered.
// Private ALIEN Evolved Edition: combat, damage and creature turns pp. 59-71.
// These are ORIGINAL dinosaur adaptations, not published alien critical tables.
import {validateCompiledAdventure,validAdventureBinding} from './adventure-definition.mjs';
import {validateCreatureContinuity} from './adventure-creatures.mjs';
import {DINO_SPECIES} from './evolved-encounters.mjs';
import {validateCarriedWeapons} from './carried-weapons.mjs';
import {validateCharacter} from './characters.mjs';
import {SOURCE_MELEE_PROFILES} from './melee-attack.mjs';
import {resolveSkillCheck,createDiceStream} from './evolved-checks.mjs';
import {woundModifiers} from './evolved-injuries.mjs';
import {validAdventureCombat,activeAdventureCombatSlot,
  spendAdventureCombatAction} from './adventure-combat-scheduler.mjs';

const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
  Object.getPrototypeOf(x)===Object.prototype;
const id=x=>typeof x==='string'&&/^[a-z][A-Za-z0-9_-]{1,63}$/.test(x);
const uint=x=>Number.isSafeInteger(x)&&x>=0&&x<=0xffffffff;
const clone=x=>structuredClone(x);
const fail=why=>{throw new RangeError('Invalid dinosaur injury: '+why);};
const allowed=(x,keys)=>record(x)&&Object.keys(x).every(k=>keys.includes(k));
const deny=reason=>Object.freeze({accepted:false,reason});
const edge=(a,b)=>[a,b].sort().join('|');

/** Recheck physical exits and an independently engine-certified blocker snapshot.
 * The caller MUST derive blockedEdges from real barriers; empty is valid only
 * when the engine has verified that no passage is currently obstructed.
 */
function blockers(compiled,blockedEdges) {
  if(!Array.isArray(blockedEdges)||blockedEdges.length>200)
    fail('verified blocked passage roster required');
  const blocked=new Set(),rooms=compiled.definition.rooms;
  for(const pair of blockedEdges) {
    if(!Array.isArray(pair)||pair.length!==2||!pair.every(id)||
       !rooms[pair[0]]?.exits.includes(pair[1])||
       !rooms[pair[1]]?.exits.includes(pair[0])||
       blocked.has(edge(...pair)))fail('invented or duplicate blocked passage');
    blocked.add(edge(...pair));
  }
  return blocked;
}
function preflight(input) {
  if(!allowed(input,['compiled','state','attack','sourceWeaponTypes','contact',
     'blockedEdges'])||!validateCompiledAdventure(input.compiled))
    fail('validated, source-compiled adventure required');
  const {compiled,state,attack,sourceWeaponTypes,contact}=input;
  if(!record(state)||!Array.isArray(state.actors)||!Array.isArray(state.weapons)||
     !Array.isArray(state.dinosaurs)||!record(state.rooms)||
     !validAdventureBinding(state.adventureBinding,compiled)||
     !validateCreatureContinuity(compiled,state))
    fail('inconsistent creature continuity or adventure save binding');
  if(Object.keys(state.rooms).sort().join('|')!==
     Object.keys(compiled.definition.rooms).sort().join('|'))
    fail('room graph does not match source adventure');
  if(!allowed(attack,['actorId','creatureId','weaponId','seed','push'])||
     !id(attack.actorId)||!id(attack.creatureId)||!id(attack.weaponId)||
     !uint(attack.seed)||(own(attack,'push')&&![0,1,2].includes(attack.push)))
    fail('attacker, target, seed, or unsupported manual damage declaration');
  if(!allowed(contact,['a','b','range'])||!id(contact.a)||!id(contact.b)||
     contact.range!=='adjacent'||edge(contact.a,contact.b)!==
       edge(attack.actorId,attack.creatureId))
    fail('trusted adjacent contact certificate required');
  if(!validAdventureCombat(state.combat))fail('valid Evolved initiative required');
  const slot=activeAdventureCombatSlot(state.combat);
  if(slot?.kind!=='human'||slot.actorId!==attack.actorId)
    fail('only active human combatant may strike');
  if(state.combat.predatorId!==attack.creatureId)
    fail('target is not the validated combat creature');
  const creature=state.dinosaurs.find(d=>d.id===attack.creatureId);
  const source=compiled.definition.initialCreatures.find(d=>d.id===attack.creatureId&&
    (!d.when||compiled.hiddenFacts[d.when.slot]?.id===d.when.choice));
  if(!creature||!source||creature.kind!==source.species||
     creature.disposition!==source.disposition||creature.defeated!==false||
     own(creature,'health')||own(creature,'injured')||own(creature,'dead')||
     own(creature,'criticalInjuries'))
    fail('absent, already disabled, or unsourced creature physiology');
  // Do not invent grazer statistics or graft human D66 injuries onto wildlife.
  const physiology=DINO_SPECIES[source.species];
  if(!physiology||!Number.isSafeInteger(physiology.health)||
     !Number.isSafeInteger(physiology.armor)||
     state.combat.predatorSpeed!==physiology.speed)
    fail('species has no approved injury physiology and combat speed');
  const actor=state.actors.find(a=>a.id===attack.actorId);
  if(!actor||actor.dead||actor.broken||actor.pendingSkip||
     !Number.isInteger(actor.health)||actor.health<1||
     !id(actor.location)||actor.location!==creature.location||
     validateCharacter(actor).length)
    fail('attacker is not a capable colocated Evolved human');
  validateCarriedWeapons(state.weapons,state.actors);
  const melee=state.weapons.filter(w=>w.class==='melee');
  if(!record(sourceWeaponTypes)||Object.keys(sourceWeaponTypes).length!==melee.length||
     melee.some(w=>!own(sourceWeaponTypes,w.itemId)||
       !own(SOURCE_MELEE_PROFILES,sourceWeaponTypes[w.itemId]))||
     Object.keys(sourceWeaponTypes).some(k=>!melee.some(w=>w.itemId===k)))
    fail('inexact or invented source weapon types');
  const weapon=state.weapons.find(w=>w.id===attack.weaponId);
  if(!weapon||weapon.class!=='melee'||weapon.ownerId!==actor.id||
     !compiled.definition.itemNames[weapon.itemId])
    fail('attack requires an authored, physically carried melee item');
  const blocked=blockers(compiled,input.blockedEdges);
  const spent=spendAdventureCombatAction(state.combat,
    {actorId:actor.id,kind:'attack'});
  if(!spent.accepted)fail('insufficient full-action budget');
  return {compiled,state,attack,actor,creature,source,physiology,
    profile:SOURCE_MELEE_PROFILES[sourceWeaponTypes[weapon.itemId]],
    blocked,spent,weapon};
}

/**
 * Authenticate a first melee contact with source-known weapon profile,
 * Evolved dice, actual carried item, adjacent geometry, live creature and
 * full-action initiative. The optional withdrawal is an INTENT only: it may
 * not relocate the animal on the attacker's turn.
 *
 * No prior injury ledger exists in the accepted v3 save format. This isolated
 * primitive fails closed for pre-injured creatures; multi-hit persistent state,
 * firearm integration and transaction replay belong to DHR-016.
 */
export function resolveDinosaurInjury(input) {
  const c=preflight(input);
  const {state,attack,actor,creature,source,physiology,profile,blocked,spent}=c;
  const strike=resolveSkillCheck(actor,{skill:'close_combat',
    modifier:profile.modifier+woundModifiers(actor,'close_combat').modifier,
    seed:attack.seed,push:attack.push??0});
  const successes=strike.success?strike.successes:0;
  const raw=successes?profile.baseDamage+successes-1:0;
  const effectiveArmor=Math.max(0,physiology.armor-
    (profile.armorPiercing?1:0));
  const damage=Math.max(0,raw-effectiveArmor);
  const health=Math.max(0,physiology.health-damage);
  const incapacitated=damage>0&&health===0;
  const injured=damage>0&&health>0;
  // Only a successful, physically harmful hit can provoke injury behavior.
  // These thresholds are explicitly ORIGINAL Jurassic animal behavior policy,
  // not a transcription of any Alien species' critical-injury table.
  const reactionRoll=injured?
    createDiceStream((attack.seed^0x71b29a4d)>>>0).rollD6():null;
  const willing=injured&&(source.disposition==='neutral'||
    source.disposition==='wary'&&reactionRoll<=5||
    source.disposition==='defensive'&&reactionRoll<=3||
    source.disposition==='predatory'&&reactionRoll<=4);
  const exits=state.rooms[creature.location]&&
    c.compiled.definition.rooms[creature.location].exits.filter(to=>
      !blocked.has(edge(creature.location,to))&&
      !state.actors.some(a=>!a.dead&&a.location===to));
  // No forced attack, backtracking through a sealed door, teleport, or
  // displacement into a zone already occupied by another active human.
  const to=willing&&exits?.length?[...exits].sort()[0]:null;
  const reaction=incapacitated?'incapacitated':
    !injured?'unharmed':to?'withdraw':'hold';
  const creatureAfter={...clone(creature),health,healthMax:physiology.health,
    injured,defeated:incapacitated};
  const intent=to?Object.freeze({
    from:creature.location,to,requires:'creature_initiative_turn',
    movementTurns:1,immediate:false
  }):null;
  return {
    accepted:true,kind:'dinosaur_injury',actorId:actor.id,
    creatureId:creature.id,weaponId:attack.weaponId,seed:attack.seed,
    strike,raw,armor:physiology.armor,effectiveArmor,
    damage,healthBefore:physiology.health,healthAfter:health,
    injured,incapacitated,reactionRoll,reaction,withdrawal:intent,
    creatureAfter,attackerAfter:strike.after,combatAfter:spent.combat,
    // No save commit, time passage, movement or unearned creature attack.
    worldCommitted:false,combatSecondsAdvanced:0,
  };
}

/** A second, separately authorized source initiative card makes the proposed
 * withdrawal physically real. The caller must supply the engine-owned actual
 * later combat snapshot, never a player/AI-invented turn. It must contain the
 * original attack journal prefix and a free creature card in the SAME round.
 * This is a proposed transition; DHR-016 owns atomic persistence.
 */
export function resolveDinosaurWithdrawal(input,turnCombat) {
  const injury=resolveDinosaurInjury(input);
  if(injury.reaction!=='withdraw'||!injury.withdrawal)
    return deny('No mechanically warranted nonlethal withdrawal.');
  if(!validAdventureCombat(turnCombat))
    return deny('Invalid or absent creature initiative.');
  const prior=injury.combatAfter;
  if(turnCombat.round!==prior.round||turnCombat.cardSeed!==prior.cardSeed||
     turnCombat.predatorId!==prior.predatorId||
     JSON.stringify(turnCombat.order)!==JSON.stringify(prior.order)||
     turnCombat.index<=prior.index||
     JSON.stringify(turnCombat.actorIds)!==JSON.stringify(prior.actorIds)||
     JSON.stringify(turnCombat.history.slice(0,prior.history.length))!==
       JSON.stringify(prior.history))
    return deny('No later authenticated creature opportunity in this round.');
  const slot=activeAdventureCombatSlot(turnCombat);
  if(slot?.kind!=='dinosaur'||slot.actorId!==injury.creatureId||
     turnCombat.history.some(h=>h.round===turnCombat.round&&h.card===slot.card&&
       h.actorId===injury.creatureId))
    return deny('The current card cannot move this creature.');
  const next=clone(turnCombat);
  next.history.push({round:next.round,card:slot.card,actorId:injury.creatureId,
    kind:'withdraw',cost:'full'});
  if(next.history.length>400)next.history=next.history.slice(-400);
  const after={...clone(injury.creatureAfter),location:injury.withdrawal.to};
  return {accepted:true,kind:'dinosaur_withdrawal',
    creatureId:injury.creatureId,from:injury.withdrawal.from,
    to:injury.withdrawal.to,health:after.health,
    defeated:false,creatureAfter:after,combatAfter:next,
    creatureTurnsSpent:1,worldCommitted:false};
}
