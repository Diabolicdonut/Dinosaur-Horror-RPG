# DHR-010 — Source-authorized pure melee strike (Issue #81)

**Status:** isolated worker implementation submitted for integration review. **Roadmap mapping:** weighted gate 8 (partial). No accepted gameplay checkpoint, save schema, scenario, live action handler, site progress or 38/100 whole-product score changes.

## Authority and scope

- **Primary:** private *ALIEN RPG — Evolved Edition*, printed Close Combat pp. 62–64, equipment table p. 309, Damage/Broken pp. 67–70. The private book is not stored or reproduced here.
- **Already-adopted engine modules:** `src/evolved-checks.mjs` (individual base/stress d6 faces, pushes/Resolve), `src/evolved-encounters.mjs` (full/quick budget and D66 injuries), `src/evolved-injuries.mjs` (wound modifiers and existing clinical metadata), `src/carried-weapons.mjs` (physical item identity and possession).
- **New pure adapter:** `src/melee-attack.mjs`, with `resolveMeleeAttack(input)`. It does not add a combat action to Party, Focus or Spectator, move an enemy, create an item, spend a world seed/clock, or update save files.
- **Source-backed supported profiles:** `blunt_instrument` (attack modifier +1, damage 1), `combat_knife` (+1, damage 2), and `fire_axe` (modifier 0, damage 2, armor-piercing trait). The profile registry only describes mechanics of source-known categories, **not** newly invented park gear or permission to carry them. No arbitrary numeric bonus, damage or stats are accepted. Stun/torch/power tools and unarmed/special attacks are deliberately rejected rather than approximated.

## Input contract and trust boundary

The caller provides **real** `actors` and `weapons` under the existing physical carrier validator; distinct `attackerId`, `targetId`, `weaponId`; `sourceWeaponTypes` binding physical melee item IDs to one of the three profiles from a **trusted authored equipment catalog**; `attackerBudget` from the authoritative combat scheduler; `adjacent:true` only after a **trusted physical Adjacent-range adjudication**; and an explicit unsigned 32-bit `seed`. An optional `time` is an already authenticated world timestamp. Optional `push` uses the normal Evolved resolver. If a defender **already declared** defense before the strike, pass `defend:true`, a valid `defenderBudget` with a spare quick action, and optionally `defenderPush`. Passing an unverified player/model-supplied catalog, proximity assertion, initiative ownership or defense declaration does **not** become safe by calling this function.

The resolver checks weapon uniqueness and actual carrier, valid human character sheets and Health, same-room proximity *in addition* to the caller's Adjacent assertion, unspent full/quick action counters, known source profiles, seed and exact option names. It rejects unknown equipment stats, non-melee/ammo-bearing weapons, fabricated items, missing/spoofed carriers, dead/broken targets, forged budgets, out-of-range attacks, unverified armor, special posture/condition flags and unsolicited defense. **It cannot authenticate a catalog or spatial truth supplied by a hostile caller**; future integrated runtime must supply these values exclusively from immutable source/world state, not public JSON.

## Resolution

After authorization, the attacker spends one **full action**. Close Combat rolls existing seeded base and stress d6 pools with the fixed source weapon modifier and currently applicable critical-wound modifiers. An optional already-declared defense spends a **quick action** and rolls its own separately seeded Close Combat check. Remaining attacker successes determine whether a hit occurs; damage is the source-listed weapon base plus additional net successes, or zero on a miss. For this bounded unarmored-human slice, apply the pre-existing Health, Broken and D66 critical injury conventions with seeded medical metadata, including the project's already-adopted one-strike severe-damage convention.

The outcome includes complete check/die records, Health/injury effects, and updated action budgets and actors as *copies*. The caller must separately validate any eventual world-state commit, chronicle and legitimate action ownership; the resolver cannot be invoked directly by client narrative requests.

## Deferred, not silently approximated

Armored entities, verified armor equipment, weak-spot modifiers, unwary/restrained bonuses, reaction consent and adjacency proof, dinosaur stats/health/retreat/critical physiology, stun, special attacks, alternate wielding/damage, clinical clock advancement and multi-adventure live integration are **outside Issue #81**. Follow the dependent assigned gates rather than treating this isolated adapter as completed offensive creature combat. No new encounter is made mandatory.

## Focused verification

`node --test tests/melee-attack-dhr010.test.mjs tests/melee-attack-historical-dhr010.test.mjs`, `node --check src/melee-attack.mjs`, `npm test`. Cases cover valid attacks, source modifier and damage, ordinary misses, stress and opposed defense, budget exhaustion, weapon and ammo forgery, dead/remote/invalid targets, source wounds, D66 injury, deterministic seeds, frozen inputs, and unchanged historical Party incidents.

**Manual QA:** none claimed; no scenario or browser UI was modified. The Integration Director must review the adapter's source boundaries, verify CI on exact PR head, and independently validate merged-main only if separately approved for merge. 
