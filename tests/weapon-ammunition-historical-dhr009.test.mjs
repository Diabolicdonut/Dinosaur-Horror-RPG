import test from 'node:test';
import assert from 'node:assert/strict';
import {newPartyIncident, isPartySave, upgradePartySave} from '../src/party-engine.mjs';
import {validateAmmunitionConservation} from '../src/weapon-ammunition.mjs';

for(const adventureId of [undefined,'ridge-survey','tidal-nursery']) {
  test(`DHR-009 preserves existing ${adventureId??'Nublar'} Party saves without weapon/ammo migration`,()=>{
    const old=newPartyIncident({seed:1993,...(adventureId ? {adventureId} : {})});
    assert(isPartySave(old));
    const before=JSON.stringify(old),rng=old.rng;
    assert(validateAmmunitionConservation(old,{}));
    assert.equal(JSON.stringify(old),before);
    assert.equal(old.rng,rng);
    const migrated=upgradePartySave(old);
    assert(isPartySave(migrated));
    assert(validateAmmunitionConservation(migrated,{}));
    assert.equal(old.rng,rng);
    assert.equal(Object.hasOwn(old,'weapons'),false);
    assert.equal(Object.hasOwn(old,'ammoSpent'),false);
  });
}
