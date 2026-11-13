// DHR-027 — one source-verified Evolved panic consequence: Freeze (result 7).
// Private ALIEN RPG Evolved Edition, Stress & Panic, printed pp. 72–73.
// This adapter is deliberately NOT wired into historical saves or live combat.
import {validateCharacter} from './characters.mjs';
import {createDiceStream, resolvePanic} from './evolved-checks.mjs';

export const FREEZE_CONSEQUENCE_VERSION = 'dhr-027-freeze-1';
const clone = value => JSON.parse(JSON.stringify(value));
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const named = value => typeof value === 'string' && value.length > 0 && value.length <= 120;
const rejected = (reason, ledger) => ({accepted:false, reason, ledger});

export function createFreezeLedger() {
  return {version:FREEZE_CONSEQUENCE_VERSION, entries:[]};
}

/**
 * The ledger is a standalone opt-in extension, not part of legacy saved games.
 * Recompute every persisted die from its original seed; never accept a claimed
 * result 7, substituted actor, duplicate event, or already-spent turn.
 * A trusted runtime must separately authenticate its own event log and dice seed.
 */
export function validateFreezeLedger(ledger) {
  if (!ledger || ledger.version !== FREEZE_CONSEQUENCE_VERSION ||
      !Array.isArray(ledger.entries) || ledger.entries.length > 512)
    throw new RangeError('Invalid Freeze consequence ledger.');
  const events = new Set(), pending = new Set();
  for (const entry of ledger.entries) {
    if (!entry || !named(entry.eventId) || !named(entry.actorId) ||
        !integer(entry.triggerSequence, 0, Number.MAX_SAFE_INTEGER) ||
        !integer(entry.seed, 0, 0xffffffff) ||
        !integer(entry.stress, 0, 30) || !integer(entry.resolve, 1, 10) ||
        !integer(entry.d6, 1, 6) || entry.value !== 7 ||
        (entry.skippedAt !== null &&
          (!integer(entry.skippedAt, entry.triggerSequence + 1, Number.MAX_SAFE_INTEGER))) ||
        createDiceStream(entry.seed).rollD6() !== entry.d6 ||
        entry.d6 + entry.stress - entry.resolve !== 7 ||
        events.has(entry.eventId))
      throw new RangeError('Forged, repeated, or invalid Freeze ledger event.');
    events.add(entry.eventId);
    if (entry.skippedAt === null) {
      if (pending.has(entry.actorId))
        throw new RangeError('An actor cannot have two pending Freeze turns.');
      pending.add(entry.actorId);
    }
  }
  return true;
}

function activeLedger(ledger) {
  // An absent ledger is not an empty ledger: otherwise a caller can replay
  // a spent panic event by omitting its history.
  validateFreezeLedger(ledger);
  return ledger;
}

function validWitnessedBreak(character, encounter, eventId) {
  if (!encounter || encounter.phase !== 'combat' ||
      !encounter.turn || !integer(encounter.turn.sequence, 0, Number.MAX_SAFE_INTEGER) ||
      !named(encounter.turn.actorId) ||
      !Array.isArray(encounter.actors) || !Array.isArray(encounter.events) ||
      !named(eventId) || encounter.events.length > 1024 ||
      new Set(encounter.events.map(e => e?.id)).size !== encounter.events.length)
    return false;
  const actors = encounter.actors;
  if (actors.length < 2 || actors.length > 32 ||
      actors.some(a => !a || !named(a.id)) ||
      new Set(actors.map(a => a.id)).size !== actors.length)
    return false;
  const observer = actors.find(a => a.id === character.id);
  const event = encounter.events.find(e => e?.id === eventId);
  const victim = actors.find(a => a.id === event?.actorId);
  if (!observer || !victim || observer.id === victim.id ||
      !victim.id.startsWith('pc-') ||
      !named(observer.zone) || observer.zone !== victim.zone ||
      observer.health <= 0 || observer.dead !== false || observer.broken !== false ||
      !integer(observer.health, 1, character.healthMax) ||
      victim.health !== 0 || victim.broken !== true || victim.dead !== false ||
      event?.type !== 'pc_broken' || event.zone !== observer.zone ||
      event.turnSequence !== encounter.turn.sequence ||
      event.previousHealth <= 0 || !integer(event.previousHealth, 1, 100) ||
      event.currentHealth !== 0 ||
      !Array.isArray(event.witnessedBy) || !event.witnessedBy.includes(character.id) ||
      encounter.events.at(-1)?.id !== eventId)
    return false;
  return true;
}

/**
 * Only a committed, locally witnessed transition of another living PC into
 * Broken can trigger this narrow path. The source of witness visibility, world
 * state, event chronology and seeded RNG must be trusted engine-owned data.
 * Other panic outcomes are deliberately not implemented by this adapter.
 */
export function applyFreezeConsequence({character, encounter, eventId, seed, ledger} = {}) {
  const current = activeLedger(ledger);
  if (validateCharacter(character).length)
    return rejected('invalid_character', current);
  if (!integer(seed, 0, 0xffffffff)) return rejected('invalid_seed', current);
  if (!Array.isArray(character.panicResponses || []) ||
      (character.panicResponses || []).some(v => typeof v !== 'string'))
    return rejected('invalid_panic_state', current);
  if (!validWitnessedBreak(character, encounter, eventId))
    return rejected('unverified_witness_event', current);
  if (current.entries.some(e => e.eventId === eventId))
    return rejected('event_already_applied', current);
  if (current.entries.some(e => e.actorId === character.id && e.skippedAt === null) ||
      (character.panicResponses || []).length > 0)
    return rejected('panic_overlap_requires_escalation', current);
  const panic = resolvePanic(character, {seed});
  if (panic.kind !== 'freeze' || panic.value !== 7)
    return rejected('not_a_freeze_result', current);
  const entry = {
    eventId, actorId:character.id, triggerSequence:encounter.turn.sequence,
    seed, stress:character.stress || 0, resolve:character.resolve,
    d6:panic.d6, value:panic.value, skippedAt:null
  };
  const next = clone(current);
  next.entries.push(entry);
  validateFreezeLedger(next);
  return {accepted:true, kind:'freeze', panic, afterCharacter:panic.after,
    ledger:next, entry, draws:panic.draws};
}

/** This must be called at the scheduler's action authorization boundary. */
export function authorizeFreezeAction({ledger, actorId, kind, turnSequence} = {}) {
  const current = activeLedger(ledger);
  if (!named(actorId) || !['interrupt','quick','full'].includes(kind) ||
      !integer(turnSequence, 0, Number.MAX_SAFE_INTEGER))
    return {allowed:false,reason:'invalid_action'};
  const entry = current.entries.find(e => e.actorId === actorId && e.skippedAt === null);
  if (!entry) return {allowed:true,reason:null};
  if (turnSequence < entry.triggerSequence)
    return {allowed:false,reason:'retroactive_action'};
  if (kind === 'interrupt')
    return {allowed:false,reason:'freeze_blocks_interrupt'};
  if (turnSequence > entry.triggerSequence)
    return {allowed:false,reason:'freeze_requires_skipped_turn'};
  return {allowed:true,reason:null};
}

/**
 * Consume exactly the next actual actor turn, verified using a consecutive
 * engine-owned turn history. No synthetic turn or late/duplicate skip is valid.
 */
export function consumeFreezeTurn({character, encounter, ledger} = {}) {
  const current = activeLedger(ledger);
  if (validateCharacter(character).length)
    return rejected('invalid_character', current);
  const entry = current.entries.find(e => e.actorId === character.id && e.skippedAt === null);
  if (!entry) return rejected('no_pending_freeze', current);
  const turn = encounter?.turn;
  const observer = encounter?.actors?.find(a => a?.id === character.id);
  if (encounter?.phase !== 'combat' || !turn || turn.actorId !== character.id ||
      !integer(turn.sequence, entry.triggerSequence + 1, Number.MAX_SAFE_INTEGER) ||
      !observer || observer.dead !== false || observer.broken !== false ||
      !integer(observer.health, 1, character.healthMax) ||
      !(character.panicResponses || []).includes('freeze'))
    return rejected('invalid_freeze_turn', current);
  // The history must cover every slot after the triggering slot, not just a
  // hand-picked late turn. This detects a skipped earlier opportunity.
  const history = encounter.turnHistory;
  const gap = turn.sequence - entry.triggerSequence;
  if (!Array.isArray(history) || gap > 512 || history.length !== gap ||
      history.some((slot, i) => slot?.sequence !== entry.triggerSequence + i + 1 ||
        !named(slot.actorId) ||
        (i === history.length - 1 ? slot.actorId !== character.id : slot.actorId === character.id)))
    return rejected('unverified_next_turn', current);
  const nextLedger = clone(current);
  nextLedger.entries.find(e => e.eventId === entry.eventId).skippedAt = turn.sequence;
  validateFreezeLedger(nextLedger);
  const afterCharacter = clone(character);
  const responses = [...(afterCharacter.panicResponses || [])];
  responses.splice(responses.indexOf('freeze'), 1);
  afterCharacter.panicResponses = responses;
  return {accepted:true, kind:'freeze_turn_skipped', actorId:character.id,
    turnSequence:turn.sequence, afterCharacter, ledger:nextLedger, actionCost:'entire_turn'};
}
