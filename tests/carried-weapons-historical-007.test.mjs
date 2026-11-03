import test from 'node:test';
import assert from 'node:assert/strict';
import {newPartyIncident,isPartySave,upgradePartySave} from '../src/party-engine.mjs';
import {validateCarriedWeapons} from '../src/carried-weapons.mjs';

test('DHR-007 validator accepts unchanged historical Party v3 state without adding weapon fields', () => {
  const old=newPartyIncident({seed:1993});
  delete old.adventureBinding; // accepted historical save without later binding
  assert(isPartySave(old));
  const before=JSON.stringify(old),rng=old.rng;
  assert(validateCarriedWeapons(undefined,old.actors));
  assert.equal(JSON.stringify(old),before);
  assert.equal(old.rng,rng);
  const migrated=upgradePartySave(old);
  assert(isPartySave(migrated));
  assert(validateCarriedWeapons(undefined,migrated.actors));
  assert.equal(old.rng,rng);
});
