// DHR-009: adventure-independent, deterministic conservation of carried rounds.
// An authoritative adventure manifest supplies `stock` outside the candidate
// save. No weapon attacks, Evolved rolls, scene clocks, or save migration here.
import {validateCarriedWeapons} from './carried-weapons.mjs';

const own = (object, field) => Object.prototype.hasOwnProperty.call(object, field);
const record = value => value !== null && typeof value === 'object' &&
  !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const key = value => typeof value === 'string' && /^[a-z][A-Za-z0-9_-]{1,63}$/.test(value);
const count = value => Number.isSafeInteger(value) && value >= 0;
const fail = message => { throw new RangeError('Invalid ammunition: ' + message); };
const exactKeys = (value, keys) => Object.keys(value).length === keys.length &&
  keys.every(key => own(value, key));
const quantityOf = (items, id) => items.filter(item => item === id).length;
function add(total, next) {
  if (!count(next) || !Number.isSafeInteger(total + next)) fail('unsafe total');
  return total + next;
}

// `stock` is source-authorized total ammunition per type, not a mutable field
// read from the save itself. Loaded + carried + on-floor + spent must equal it.
// Old Party saves omit both weapons and ammoSpent; they remain unchanged.
export function validateAmmunitionConservation(state, stock = {}) {
  if (!record(state) || !record(stock)) fail('state or authoritative stock');
  if (Object.keys(stock).some(id => !key(id) || !count(stock[id])))
    fail('invalid stock identity or count');
  if (!own(state, 'weapons') && !own(state, 'ammoSpent')) {
    if (Object.keys(stock).length) fail('historical save has no ammunition specification');
    validateCarriedWeapons(undefined, state.actors);
    return true;
  }
  if (!Array.isArray(state.weapons) || !record(state.ammoSpent) ||
      !record(state.rooms)) fail('weapons, spent ledger or rooms');
  validateCarriedWeapons(state.weapons, state.actors);
  const types = new Set(state.weapons.filter(w => w.class === 'ranged').map(w => w.ammo.itemId));
  if (!exactKeys(stock, [...types]) || !exactKeys(state.ammoSpent, [...types]))
    fail('stock and spent must match declared ranged ammunition types');
  for (const type of types) {
    if (!count(state.ammoSpent[type])) fail('invalid spent counter');
    let total = state.ammoSpent[type];
    for (const weapon of state.weapons) {
      if (weapon.class === 'ranged' && weapon.ammo.itemId === type)
        total = add(total, weapon.ammo.loaded);
    }
    for (const actor of state.actors) {
      total = add(total, quantityOf(actor.inventory, type));
      total = add(total, quantityOf(actor.gear || [], type));
    }
    for (const room of Object.values(state.rooms)) {
      if (!record(room) || (own(room, 'items') && !Array.isArray(room.items)))
        fail('invalid room item list');
      total = add(total, quantityOf(room.items || [], type));
    }
    if (total !== stock[type]) fail('unaccounted, duplicated or created rounds: ' + type);
  }
  return true;
}

export function validAmmunitionConservation(state, stock = {}) {
  try { return validateAmmunitionConservation(state, stock); }
  catch (error) { if (error instanceof RangeError) return false; throw error; }
}

function take(items, id, quantity) {
  if (quantityOf(items, id) < quantity) fail('insufficient physical rounds');
  const next = [];
  let remaining = quantity;
  for (const item of items) {
    if (item === id && remaining > 0) remaining--;
    else next.push(item);
  }
  return next;
}
function takeFromActor(actor, id, quantity) {
  const inventoryCount = quantityOf(actor.inventory, id);
  const fromInventory = Math.min(quantity, inventoryCount);
  const fromGear = quantity - fromInventory;
  if (quantityOf(actor.gear || [], id) < fromGear) fail('actor lacks rounds');
  actor.inventory = take(actor.inventory, id, fromInventory);
  if (fromGear) actor.gear = take(actor.gear, id, fromGear);
}
function actorFor(state, id) {
  if (!key(id)) fail('invalid actor id');
  const actor = state.actors.find(actor => actor.id === id);
  if (!actor) fail('unknown actor');
  return actor;
}
function roomFor(state, id) {
  if (!key(id) || !own(state.rooms, id) || !record(state.rooms[id])) fail('unknown room');
  return state.rooms[id];
}
function local(state, actor, roomId) {
  const room = roomFor(state, roomId);
  if (actor.location !== roomId) fail('actor not physically in room');
  return room;
}
function armed(state, actor, id) {
  if (!key(id)) fail('invalid weapon id');
  const weapon = state.weapons.find(w => w.id === id);
  if (!weapon || weapon.class !== 'ranged' || weapon.ownerId !== actor.id)
    fail('actor does not carry ranged weapon');
  return weapon;
}
function checkAction(action, keys) {
  if (!record(action) || !exactKeys(action, keys)) fail('unknown action fields');
}
function checkQuantity(quantity) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) fail('positive safe quantity required');
}
function ensureType(stock, id) {
  if (!key(id) || !own(stock, id)) fail('unknown ammunition type');
}
function cloneState(state) {
  return {
    ...state,
    weapons: state.weapons.map(w => ({...w, ...(w.ammo ? {ammo: {...w.ammo}} : {})})),
    actors: state.actors.map(a => ({...a, inventory: [...a.inventory],
      ...(a.gear ? {gear: [...a.gear]} : {})})),
    rooms: Object.fromEntries(Object.entries(state.rooms).map(([id,room]) =>
      [id, {...room, ...(room.items ? {items: [...room.items]} : {})}])),
    ammoSpent: {...state.ammoSpent},
  };
}

// Single atomic stock transaction. Rejection leaves the original snapshot,
// world clock and seeded RNG unchanged. Callers authorize combat/time costs.
// Supported kinds: pickup, drop, transfer, reload, spend (one loaded round).
export function applyAmmunitionAction(state, stock, action) {
  validateAmmunitionConservation(state, stock);
  if (!record(action) || !['pickup','drop','transfer','reload','spend'].includes(action.kind))
    fail('unknown ammunition action');
  let result = cloneState(state);
  let ammoId, quantity;
  if (action.kind === 'pickup' || action.kind === 'drop') {
    checkAction(action, ['kind','actorId','roomId','ammoId','quantity']);
    checkQuantity(action.quantity);
    ensureType(stock, action.ammoId);
    const actor = actorFor(result, action.actorId);
    const room = local(result, actor, action.roomId);
    ammoId = action.ammoId; quantity = action.quantity;
    if (action.kind === 'pickup') {
      room.items = take(room.items || [], ammoId, quantity);
      actor.inventory.push(...Array(quantity).fill(ammoId));
    } else {
      takeFromActor(actor, ammoId, quantity);
      room.items = [...(room.items || []), ...Array(quantity).fill(ammoId)];
    }
  } else if (action.kind === 'transfer') {
    checkAction(action, ['kind','fromId','toId','ammoId','quantity']);
    checkQuantity(action.quantity);
    ensureType(stock, action.ammoId);
    const from = actorFor(result, action.fromId), to = actorFor(result, action.toId);
    if (from.id === to.id || !key(from.location) || from.location !== to.location)
      fail('transfer requires distinct colocated actors');
    roomFor(result, from.location);
    ammoId = action.ammoId; quantity = action.quantity;
    takeFromActor(from, ammoId, quantity);
    to.inventory.push(...Array(quantity).fill(ammoId));
  } else {
    checkAction(action, action.kind === 'reload' ?
      ['kind','actorId','weaponId','quantity'] : ['kind','actorId','weaponId']);
    const actor = actorFor(result, action.actorId);
    const weapon = armed(result, actor, action.weaponId);
    ammoId = weapon.ammo.itemId;
    ensureType(stock, ammoId);
    if (action.kind === 'reload') {
      checkQuantity(action.quantity);
      quantity = action.quantity;
      if (weapon.ammo.loaded + quantity > weapon.ammo.capacity)
        fail('magazine capacity exceeded');
      takeFromActor(actor, ammoId, quantity);
      weapon.ammo.loaded += quantity;
    } else {
      quantity = 1;
      if (weapon.ammo.loaded < 1) fail('weapon is empty');
      weapon.ammo.loaded--;
      result.ammoSpent[ammoId]++;
    }
  }
  validateAmmunitionConservation(result, stock);
  return {state: result, receipt: Object.freeze({kind: action.kind, ammoId, quantity})};
}
