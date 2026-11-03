// DHR-007: pure, adventure-independent specification boundary for physically
// carried weapons. This module does NOT resolve attacks, assign Evolved weapon
// stats, consume ammunition, modify inventory, or extend existing save schemas.
//
// A weapon definition binds one unique physical item ID to one real actor.
// The item must exist exactly once in that actor's inventory or starting gear.
// Ranged weapons describe only an ammunition identity and a magazine count;
// spare-round conservation and combat resolution are separate later gates.
export const WEAPON_CLASSES = Object.freeze(['melee', 'ranged']);

const key = value => typeof value === 'string' &&
  /^[a-z][A-Za-z0-9_-]{1,63}$/.test(value);
const own = (record, field) => Object.prototype.hasOwnProperty.call(record, field);
const record = value => value !== null && typeof value === 'object' &&
  !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const keysAre = (value, allowed) => Object.keys(value).every(field => allowed.includes(field));
function reject(detail) { throw new RangeError('Invalid carried weapon: ' + detail); }

// Structural validation is deliberately separate from physical ownership, so
// future adventure compilers can reject invalid authored data before runtime.
export function validateCarriedWeaponDefinition(weapon) {
  if (!record(weapon) || !keysAre(weapon, ['id', 'itemId', 'ownerId', 'class', 'ammo']) ||
      !key(weapon.id) || !key(weapon.itemId) || !key(weapon.ownerId) ||
      !WEAPON_CLASSES.includes(weapon.class)) reject('identity, class or unknown field');
  if (weapon.class === 'melee') {
    if (own(weapon, 'ammo')) reject('melee weapon cannot carry ammunition');
  } else {
    const ammo = weapon.ammo;
    if (!record(ammo) || !keysAre(ammo, ['itemId', 'capacity', 'loaded']) ||
        !key(ammo.itemId) || ammo.itemId === weapon.itemId ||
        !Number.isSafeInteger(ammo.capacity) || ammo.capacity < 1 ||
        !Number.isSafeInteger(ammo.loaded) || ammo.loaded < 0 ||
        ammo.loaded > ammo.capacity) reject('ranged ammunition identity or capacity');
  }
  return true;
}

// Weapon specifications may be omitted for pre-weapon historical incidents.
// This does not add a weapon field to, or rewrite, those saves. Null and
// invalid values still fail rather than silently becoming empty definitions.
export function validateCarriedWeapons(weapons, actors) {
  if (weapons === undefined) weapons = [];
  if (!Array.isArray(weapons) || !Array.isArray(actors))
    reject('weapon and actor collections must be arrays');
  const owners = new Map();
  for (const actor of actors) {
    if (!record(actor) || !key(actor.id) || !Array.isArray(actor.inventory) ||
        (own(actor, 'gear') && !Array.isArray(actor.gear)) || owners.has(actor.id))
      reject('invalid or duplicate actor');
    owners.set(actor.id, actor);
  }
  const ids = new Set(), items = new Set();
  for (const weapon of weapons) {
    validateCarriedWeaponDefinition(weapon);
    if (ids.has(weapon.id) || items.has(weapon.itemId))
      reject('duplicate weapon identity or physical item');
    ids.add(weapon.id);
    items.add(weapon.itemId);
  }
  for (const weapon of weapons) {
    if (weapon.class === 'ranged' && items.has(weapon.ammo.itemId))
      reject('ammunition cannot be another weapon identity');
    const actor = owners.get(weapon.ownerId);
    if (!actor) reject('weapon owner does not exist');
    const occurrences = actors.reduce((total, carrier) => total +
      carrier.inventory.filter(item => item === weapon.itemId).length +
      (carrier.gear || []).filter(item => item === weapon.itemId).length, 0);
    const local = actor.inventory.includes(weapon.itemId) ||
      (actor.gear || []).includes(weapon.itemId);
    if (!local || occurrences !== 1)
      reject('weapon must be held exactly once by its declared owner');
  }
  return true;
}

// Boolean form for consumers that validate untrusted candidate records.
export function validCarriedWeapons(weapons, actors) {
  try { return validateCarriedWeapons(weapons, actors); }
  catch (error) { if (error instanceof RangeError) return false; throw error; }
}
