# 009-B2b2c2c2b — Live research encounter rounds (revision 8)

**Accepted, October 26, 2026; merged main `eed9f2ab29c9991ab00c76172dbf45440ce69d9c`.** *The Long Count* revision 8 introduces playable, persisted, source-style 10-second combat rounds after a real seed-conditioned predator contact and explicit opening defense. It does not change any historical rev1–7 manifest, the Nublar rescue combat pipeline, the legacy solo browser, or the AI Worker.

## Mechanics and boundaries

- Uses the independent `adventure-combat-scheduler.mjs` for ten-card Evolved numbered initiative, a physical predator's actual speed, and per-human full/quick costs. Only actual survivors colocated with an instantiated predator enter the combat order; source seeded random draws determine initiative each round.
- The player's initial *Defend / Decline* reaction remains the original rev7 committed strike procedure. After it, surviving eligible colocated actors enter `src/adventure-combat-live.mjs`. Ordinary exploration actions are blocked while the encounter is live.
- Predator initiative slots are autonomous. A strike is staged with a persistent `combatReaction` **before** attack/defense RNG is resolved; the threatened survivor or their AI controller then chooses defend/decline. The existing source Evolved creature dice and Close Combat defense resolver commit genuine misses, injuries and critical wounds. No forced hit or fictitious spawn.
- Human source action budgets govern a *real* adjacent retreat, stealth check, carrying/handing off finite objects, first aid, or ending the initiative card. Attempted movement cannot teleport through unconnected rooms. Combat closes on physical separation; future contact requires a new eligible encounter, not an arbitrary drama trigger.
- At completed 10-second round boundaries, draw new initiative, record the elapsed time, and call the existing clinical injury-clock service on actual survivors. No duplicate exploration beat or stealth patrol step is added for combat actions. Underlying dice and character state are deterministic.
- Party, Focus and Spectator modes route all human and predator turns via the same validated state engine. The browser displays initiative/order/budgets and the attack reaction panel. AI can respond to a pending real strike without changing the committed attack seed.
- The new `ridge-survey-rev7.mjs` preserves the original revision 7 definition and its fingerprint for old saves; rev8 state stores `combat`, `combatReaction`, `combatRoundRecords` and `combatDamageRecords` only in newly launched rev8 incidents. The earlier Nublar combat version remains unchanged.

## Scope intentionally not completed

This is **live survival and escape combat**, not full offensive tactical combat parity. Player weapon strikes against the research predator, weapon/armor profiles, an expanded combatant roster, independent human NPC aggression, hiding/cover depth, rulebook signature attacks and medical gameplay balance require subsequent milestones. The generic scheduler presently models one physically present predator per encounter and at most eight survivors. An unarmed survivor is not granted an imaginary way to defeat a velociraptor; escape, protection, and survival are real choices. Manual graphical desktop and mobile smoke tests are still pending. Procedurally generated adventures and campaign continuity remain later objectives after additional gameplay parity.

## Acceptance tests

Use `npm test` (Node 20+), GitHub Actions on the exact PR head, and independent merged `main` Actions + Pages verification. Focused regressions: `tests/live-research-combat-009b2b2c2c2b.test.mjs` and preceding rev7/reactive-defense/scheduler suites. Verify actual UI travel, defense, focus and spectator turns on both desktop and mobile separately. **Accepted verification:** PR #42 final head Actions 40335113980 succeeded (600/600); independent merged-main Actions 40335353051 and Pages 40335351681 succeeded. Manual desktop/mobile graphical smoke testing remains outstanding.
