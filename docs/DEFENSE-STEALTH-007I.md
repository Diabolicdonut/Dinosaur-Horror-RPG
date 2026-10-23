# Checkpoint 007-I — Deliberate Defensive Reactions and Grouped Stealth

**Date:** October 22, 2026  
**Rules reference:** the user's privately supplied *Alien RPG — Evolved Edition*, printed pp. 55–58 (stealth groups, passive spotting and hiding searches), p. 62 (interrupting close-combat defense), and p. 65 (ranged dodging). The source PDF, its art, and its tables remain private; this repository contains separately authored implementation code and an original dinosaur scenario.

## Playable defensive interruption

An exposed survivor targeted by a Velociraptor's **close-combat attack** can now make a decision **after the target is declared but before the attacker rolls**:

- **Defend — spend one quick action:** make a seeded opposed **CLOSE COMBAT** roll. Each defender success cancels an attacking success. Only remaining attack successes can inflict damage and trigger the existing armor, injury, panic and medical procedures.
- **Do not defend:** allow the same announced creature attack to resolve without expending any defense action.
- **Not eligible:** no choice is offered if the victim has no legal quick action remaining, is broken/dead/concealed or is the target of a surprise ambush. An ambush still gives its one-time +2 attack dice bonus and cannot be defended.

The declaration **selects and saves the target first**. Its persisted `combat.pendingReaction` includes that survivor, the active card, combat round, and declaration beat. Creating this decision consumes random state **only for target selection**, not for the attack dice, damage, medical consequences or game time. No attack action is logged before the response. The pre-roll state can be saved and restored without duplicate strikes or target reselection; an invalid responder, duplicate attempt or forged card/target is rejected.

The defender controls their own reaction. In **Party mode**, all human survivors receive their choice. In **Character mode**, a human receives a choice only when their currently focused survivor is targeted; other survivors use the companion's bounded automatic policy. In **Spectator mode**, survivors automatically defend when permitted. Switching control modes while a reaction is pending updates the decision owner without rewinding anything. The game's animal acts on its scheduled Speed card; the action completes after the reaction and remains a single logged creature attack.

The original automatic **Mobility dodge** remains a legacy fallback for direct engine callers that do not request interactive reaction handling, keeping previous deterministic checkpoints and tests compatible. The **live browser and autonomous director** explicitly request the new Close Combat defense procedure. This is intentional incremental compatibility, not two simultaneous defenses.

## Group and concealed-survivor stealth

- **Group spotting:** When several exposed survivors come into the same Velociraptor's line of sight in one zone, each receives their own passive, unpushable, stress-response-free OBSERVATION roll. The **highest individual success count** is compared with one observation roll for the creature. The party does **not** add everyone's successes together. The ordinary +2 keeping-watch modifier applies only to the character who was guarding.
- **Active search:** Simply entering a room containing a hidden survivor never automatically exposes them. When an alerted dinosaur searches the occupied zone, it rolls OBSERVATION **once**, revealing at most one concealed survivor per successful die. Survivors left concealed by a failed or insufficient search remain hidden. There are no fabricated sightings through walls or knowledge of remote actors' locations.
- **Group/world limitation:** The current seven-room scenario resolves a group as exposed survivors currently together in the same room at detection time. It does not yet provide a configurable shared-party movement order, multiple active predators, exact crawlspace/lighting checks, or movement-mode encounter timer. These remain separate future mechanics.

## Save and UI

- The game continues using existing **party schema v3** and browser key `dinosaur-party-incident-007c`. The optional `combat.pendingReaction` is validated against the current animal initiative slot and real living target; no migration or reset is needed for previous 007-C through 007-H party saves.
- `party.html` and `src/party-app.mjs` expose a prominent **Defend** / **Do not defend** panel only to the current human defender. The normal command field is locked during an unresolved attack. The camera follows the targeted survivor unless the player explicitly selected a fixed camera.
- Module imports and entrypoint assets are revised to `007i` to prevent stale browser caches from mixing new encounter and control code.
- The existing legacy solo `src/engine.mjs` / checkpoint 006.2 save and the deployed Cloudflare Worker v006 are completely untouched. **No Worker redeployment is necessary.**

## Testing and limits

The milestone adds `tests/defensive-reactions.test.mjs` (13 tests) and `tests/grouped-stealth.test.mjs` (7 tests) to 221 prior automated regressions, targeting **241 tests total**. Tests cover pre-roll timing, no-damage declarations, quick-action payment, declined defense, ambush/exhaustion restrictions, wrong responder rejection, Party→Spectator transfer, computer-only resolution, deterministic mid-reaction save/load, browser UI contracts, group best-of detection and active search success limits. CI and Pages results on the final commit are authoritative; graphical manual gameplay QA is still outstanding.

**Remaining source differences:** player-declared defensive reactions against *ranged* attacks, manual selection between other legal counterattack/guard options, more intricate positioning and lighting modifiers, coordinated multi-actor ambushes, a truly source-exact stealth stretch movement/active pursuit model, fully populated dinosaur species signature actions, injury infection complications, and full freeform Game Mother adjudication. Defending a Velociraptor's present close attack uses **CLOSE COMBAT**, not a ranged **MOBILITY** dodge.

**Next milestone recommendation:** 007-J, physically grounded stealth movement and chase with an encounter timer, ranger/animal awareness, group movement choices and richer dinosaur actions, together with manual browser smoke testing of saved reaction boundaries.
