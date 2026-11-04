# DHR-009 — Finite Ammunition and Physical Stock Contract (Issue #75)

**Status:** Proposed isolated implementation; not an accepted gameplay checkpoint or roadmap gate. Depends on the accepted pure weapon definition/ownership validator from DHR-007. No existing adventure, save, combat turn, Evolved dice or browser affordance is changed.

## Source-owned ammunition total

An adventure compiler supplies a **trusted external** plain-object `stock` mapping each declared ranged weapon's `ammo.itemId` to its initial finite round count. It must be derived from the immutable, fingerprinted adventure source—not from a candidate client save or an AI suggestion. A candidate with weapon data additionally supplies a `weapons` array validated by DHR-007 and a per-ammo-type `ammoSpent` plain object. Rooms are an ID-keyed map of physical `items`; actors have the existing `inventory`, optional `gear`, physical `location`, and a unique `id`.

For **each** ranged ammo type, `stock[type]` must equal the sum of loaded rounds in *all* compatible weapons, rounds in all actor inventories and starting gear, rounds left in room stock, and permanently spent rounds. All counts are nonnegative safe integers; all declared types must have exact ledger keys. Extra types, missing types, duplicate weapon identities and any mismatch are rejected. This checks both disappearance and creation, whereas the older lamp-cell rule only bounded an upper limit. Non-ammunition items are not in this ledger. The conserved round IDs are quantity identifiers, not serial numbers for individual cartridge objects.

```js
import {validateAmmunitionConservation, applyAmmunitionAction} from './src/weapon-ammunition.mjs';
const authorizedStock = {signal_cartridge: 3}; // authoritative authored quantity
validateAmmunitionConservation(state, authorizedStock);
const {state:next, receipt} = applyAmmunitionAction(state, authorizedStock,
  {kind:'reload', actorId:'pc-1', weaponId:'signal_launcher_01', quantity:1});
```

`validateAmmunitionConservation` throws `RangeError` for invalid candidates; `validAmmunitionConservation` returns a boolean. `applyAmmunitionAction` first validates its input, performs one atomic, deterministic copy-on-write transaction, validates the proposed result, and returns `{state, receipt:{kind, ammoId, quantity}}`. Rejection throws without altering the original. It never draws random numbers, advances a clock, applies a skill roll, or pretends to resolve an attack.

| Operation | Source and restriction | Destination |
|---|---|---|
| `pickup` | Actor must be physically in `roomId`, with enough matching `room.items`; positive integer `quantity` | Same actor's inventory |
| `drop` | Actor and room colocated; only real carried rounds in inventory/gear | Same physical room's item list |
| `transfer` | Two distinct, colocated real actors and enough rounds carried by giver | Receiver's inventory |
| `reload` | Actor owns actual ranged weapon; enough carried rounds, respects magazine capacity | That weapon's `ammo.loaded` |
| `spend` | Actor owns actual loaded ranged weapon; exactly one round | Increments `ammoSpent[ammo.itemId]` by one |

Only the above exact action shapes are permitted. `spend` is a **resource primitive**, not permission to attack or hit; future source-valid ranged attack adjudication must authorize and couple it to the correct combat-time and dice outcome. Similarly the caller must apply the existing legal exploration or combat action cost before committing pickup/drop/transfer/reload. Neither a local AI prompt nor a player-visible inventory value is a trustworthy source of initial stock.

## Saves, replays and limits

Legacy Party saves with **neither** `weapons` nor `ammoSpent` remain accepted without mutation, schema migration, created weapons, or newly awarded stock. The new ledger is opt-in and has no effect on pre-weapon incidents. On newly tracked incidents, `weapons` and `ammoSpent` must both exist, with an externally authorized `stock`; a missing tracker fails closed. The operations preserve unrelated seed, turn, control, secret, adventure fingerprint, and journal fields byte-for-byte at the JSON-value level. The deterministic returned receipt can be journaled and re-applied to an earlier validated state; integration with the trusted save/event journal remains a later milestone.

This module does not retrofit ammunition into Nublar, Long Count, or Tidal Nursery; it does not authenticate an untrusted client-provided stock declaration; it does not implement attack rolls, reload turn costs, weapon damage, armor, ranged targeting, physical magazine removal, cross-adventure migration or UI. Those are deliberately deferred to their assigned roadmap issues. Full-suite GitHub Actions and manual graphical checks are acceptance prerequisites, not presumed from local unit tests.
