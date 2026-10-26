# 009-B2b2a — Source-Bound Seeded Situations

## Contract

- All scenario-specific complications are typed data `variantChoice.mechanic` on the validated authored package; generic `src/adventure-situations.mjs` resolves applicable mechanics from the seed-compiled hidden choice, without dice, effects or scenario hardcoding.
- Complication kinds: `passage_check` on a physical adjacent room edge with `mobility` / `survival`, `objective_check` tied to a real skill-bearing objective, and `animal_response` that flees to a validated adjacent exit only on failed close approach.
- All modifiers are explicitly bounded to -5 through +5 and applied to `resolveSkillCheck` pools. No altered dice probabilities; no free objectives or hidden action-cost bypass.
- Hidden choice descriptions may be narrated only as `localSituationCues` when the observing character is physically in that clue room. Do not expose hidden choices, seed, facts or remote evidence in player presentation.
- Passages with conditions must still have a connected nonhazard alternate route in the authored adventure to avoid a forced bottleneck; the *Long Count* ford can be avoided through the rocky ridge.
- A neutral animal is not automatically attacking, stalking or fleeing. Cautious watching remains a legitimate peaceful choice. This code models a **single voluntary close approach** and optional adjacent withdrawal, not ecology, an always-active encounter director or lethal herbivore combat.
- Scenario seed now decides mechanically meaningful *situation-level variations*. This does not yet vary primary maps, cast motivations, objectives or endings, and so it does NOT meet full authored-replayability acceptance criteria.

## Validation and limits

Accepted baseline: 009-B2b1 508/508 with both main Actions and Pages green. Candidate 009-B2b2a: 518 automated regression cases in PR #27. Browser module identity changes across the relevant catalog, adventure and Party app to prevent cached gameplay logic from mixing old source definitions.

Future work: three-act Setup/Tilt/Showdown event definitions and actor-local optional scene opportunities; persistent noncombat NPCs; mobile graphical smoke; real credible predator encounters, injury/medical source mechanics for all scenarios; eventually dynamic Cinematic/Campaign generation and bounded typed Game Mother.

## Compatibility follow-up — immutable story revision

The first mechanics addition changed an accepted authored manifest in place, which would invalidate the research saves bound to revision 1. PR #28 instead preserves `adventures/ridge-survey-rev1.mjs` as the exact prior definition; all newly generated research adventures bind to **revision 2**. When loading a saved revision 1 incident, the engine compiles and validates the previous definition with its stored seed; it does not apply revision 2 passage checks, revised clues or animal approach options. New revisions keep the seeded physical consequences. Four new tests cover the exact fingerprints, prior-rules safe crossing, original wildlife behavior and forged cross-revision bindings. Total candidate gate: **522/522** automated regressions. No full procedural replayability or live graphical QA is claimed.
