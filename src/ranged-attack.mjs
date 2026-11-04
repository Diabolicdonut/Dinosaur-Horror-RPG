// DHR-011: source-bound, scenario-independent ranged attack roll proposal.
// This is NOT a world-state transaction or a confirmed hit. The calling rules
// engine must supply authoritative stock and eligible world targets, then
// separately adjudicate range/LOS, cover, dodge, damage and ammo expenditure.
// No save fields or scenario schemas are introduced by this module.
import {validateAmmunitionConservation} from './weapon-ammunition.mjs';
import {spendActionBudget} from './evolved-encounters.mjs';
import {resolveSkillCheck} from './evolved-checks.mjs';

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const record = value => value !== null && typeof value === 'object' &&
  !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const id = value => typeof value === 'string' && /^[a-z][A-Za-z0-9_-]{1,63}$/.test(value);
const deny = reason => Object.freeze({accepted:false, reason});
const fail = reason => { throw new RangeError('Invalid ranged attack: ' + reason); };

function validateDeclaration(action) {
  if (!record(action) ||
      Object.keys(action).some(key => ![
        'actorId','weaponId','targetId','seed','push','spendStoryPoint','storyPointTiming',
      ].includes(key)) ||
      !id(action.actorId) || !id(action.weaponId) || !id(action.targetId) ||
      !Number.isSafeInteger(action.seed) || action.seed < 0 || action.seed > 0xffffffff ||
      (own(action, 'push') && ![0,1,2].includes(action.push)) ||
      (own(action, 'spendStoryPoint') && typeof action.spendStoryPoint !== 'boolean') ||
      (own(action, 'storyPointTiming') && !['before','after'].includes(action.storyPointTiming)))
    fail('unrecognized declaration, identity, seed, or check option');
}

function validatedTargets(targets) {
  if (!Array.isArray(targets)) fail('authoritative target roster required');
  const known = new Map();
  for (const target of targets) {
    if (!record(target) || !id(target.id) || known.has(target.id) ||
        (own(target,'dead') && typeof target.dead !== 'boolean') ||
        (own(target,'defeated') && typeof target.defeated !== 'boolean'))
      fail('invalid or duplicate world target');
    known.set(target.id,target);
  }
  return known;
}

// The scheduler's standard full + quick OR two quick budget format. Never
// accept an internally inconsistent/fabricated budget merely because the
// permissive lower-level spending helper would accept its fields.
function validBudget(b) {
  if (!record(b) || Object.keys(b).length !== 4 ||
      !['full','quick','fullSpent','quickSpent'].every(key => own(b,key)) ||
      ![0,1].includes(b.fullSpent) || ![0,1,2].includes(b.quickSpent) ||
      (b.fullSpent === 1 && b.quickSpent === 2)) return false;
  return b.full === (b.fullSpent || b.quickSpent === 2 ? 0 : 1) &&
    b.quick === 2 - b.quickSpent;
}

function activeBudget(state, actorId) {
  const c = state.combat;
  if (!record(c) || c.active !== true || !Array.isArray(c.order) ||
      !Number.isSafeInteger(c.index) || c.index < 0 || c.index >= c.order.length ||
      !record(c.budgets) || !Number.isSafeInteger(c.round) || c.round < 1)
    return null;
  const slot = c.order[c.index];
  if (!record(slot) || slot.kind !== 'human' || slot.actorId !== actorId)
    return null;
  const budget = c.budgets[actorId];
  if (!validBudget(budget)) return null;
  return budget;
}

/**
 * Resolve a declared firing CHECK only, without mutating input or asserting
 * that any shot was physically possible or hit. Requires:
 *   - validated current state including DHR-007 gear and DHR-009 ammunition
 *   - manifest-sourced stock (never inferred from the candidate saved state)
 *   - engine-sourced target roster (never an AI/client-created target)
 *   - active human combat card and enough remaining full-action budget
 *   - independently seeded Evolved RANGED COMBAT dice.
 *
 * `check.success` is a dice success only; range, LOS, cover, dodges,
 * consequences and the actual `applyAmmunitionAction(..., 'spend')` remain
 * separate future integration responsibilities. No ammo is ever created,
 * deducted or implicitly committed here, including on failed dice checks.
 */
export function resolveRangedAttack(state, stock, action, targets) {
  if (!record(state)) fail('authoritative state required');
  validateDeclaration(action);
  const known = validatedTargets(targets);
  // This validation catches invented loaded rounds, stolen carried gear and
  // missing ledgers BEFORE a single seeded die could be drawn.
  validateAmmunitionConservation(state, stock);

  const actor = state.actors.find(a => a.id === action.actorId);
  if (!actor) return deny('Unknown attacking actor.');
  if (actor.dead === true || actor.broken === true || actor.pendingSkip === true ||
      actor.health === 0) return deny('Attacker cannot act.');
  if (action.targetId === actor.id) return deny('A ranged attack cannot target its shooter.');
  const target = known.get(action.targetId);
  if (!target) return deny('Target is absent from the authoritative target roster.');
  if (target.dead === true || target.defeated === true)
    return deny('Target is already out of action.');
  const humanTarget = state.actors.find(a => a.id === action.targetId);
  if (humanTarget && (humanTarget.dead === true || humanTarget.health === 0))
    return deny('Target is already out of action.');

  const weapon = state.weapons?.find(w => w.id === action.weaponId);
  if (!weapon || weapon.class !== 'ranged' || weapon.ownerId !== actor.id)
    return deny('Actor does not carry the declared ranged weapon.');
  if (weapon.ammo.loaded < 1) return deny('Ranged weapon is not loaded.');

  const budget = activeBudget(state,actor.id);
  if (!budget) return deny('Actor lacks the active combat initiative card or valid action budget.');
  const spent = spendActionBudget(budget,'full');
  if (!spent.accepted) return deny(spent.reason);
  const push = action.push ?? 0;
  if (push === 2 && actor.talent !== 'Quick Reflexes')
    return deny('A second Agility push requires a supporting talent.');
  if (action.spendStoryPoint === true &&
      (!Number.isSafeInteger(actor.storyPoints) || actor.storyPoints < 1))
    return deny('No earned story point is available.');

  // Never allow caller-supplied skill substitutions or fabricated gear, range,
  // aim, cover, helping or damage modifiers. DHR-012 will establish the physical
  // authorization and appropriate modifier contract separately.
  const check = resolveSkillCheck(actor,{
    skill:'ranged_combat',seed:action.seed,push,
    spendStoryPoint:action.spendStoryPoint ?? false,
    storyPointTiming:action.storyPointTiming ?? 'after',
  });
  return {
    accepted:true,kind:'ranged_attack',actorId:actor.id,weaponId:weapon.id,
    targetId:action.targetId,skill:'ranged_combat',cost:'full',
    ammoItemId:weapon.ammo.itemId,loadedAtDeclaration:weapon.ammo.loaded,
    ammoAction:Object.freeze({kind:'spend',actorId:actor.id,weaponId:weapon.id}),
    nextBudget:spent.budget,actorAfter:check.after,check,
    seed:action.seed,draws:check.draws,
    rollSuccess:check.success,
    hit:null,damage:null,worldEffects:'unresolved',
  };
}
