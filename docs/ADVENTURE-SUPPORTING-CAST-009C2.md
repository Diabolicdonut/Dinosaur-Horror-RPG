# 009-C2 — Versioned supporting cast and grounded conversations

**Candidate, October 26, 2026.** Builds on accepted 009-C1 (v0.7.33, 609/609 tests). The core principle is that NPC identity, goals, information and authored spoken words belong to replaceable adventures. Evolved Edition controls character rolls, physical encounters, injuries and consequences. No copyrighted Alien RPG scenario content, characters, or dialogue is included.

## Reusable adventure data contract

An optional `supportingCast` array (maximum twelve) on the versioned, fingerprinted `AdventureDefinition` defines original characters by stable ID, display name, role, public description, fixed authored room, disposition, private motive, and a bounded list of conversation topics. Each topic has a stable ID, prompt and spoken response, and may require an **already committed** scene/objective or a specific compiled hidden variant. NPCs can also be conditional on an existing seeded variant. Invalid rooms, duplicate IDs, invented objective/scene/variant references, unknown properties and callbacks are rejected before compilation.

`src/adventure-supporting-cast.mjs` is adventure-agnostic. It instantiates only compiled, physically present characters, validates location and conversation journals against their source revision, filters topics by committed knowledge and seed truth, and commits optional **one-time-per-survivor** dialogue to the action and event journals. The action does **not** alter dice, stress, Story Points, wounds, inventory or time. Like the existing optional Cinematic scene interactions, it is a free, explicitly selected social scene. No NPC teleportation or artificial hostility is authorized.

The existing generic text parser accepts `npc <npc-id> <topic-id>` and `talk to <npc-id> about <topic-id>`. The Party browser lists only a watched actor's physically colocated people and their currently allowed topics. In Focus/Spectator modes NPC locations and private motives are not magically exposed. NPC **private motives** are omitted from player-facing projections, but as long as authorship code ships to the browser they are not cryptographically confidential; true GM-only storage requires a trusted server.

## Concrete original example

*The Long Count* revision **10** adds Leena Harrow, a field operations coordinator at the research camp, and Tomas Wren, a field naturalist at the ridge. Their presence and talk options depend on actual location. Topics concerning recovered transect data require the corresponding objective to have been completed. The scientist's ridge observations differ between the legitimate seed-locked `quiet-range` and `raptor-territory` world truths. NPC responses are not evidence of a newly spawned predator or a mandatory combat beat. GM motives remain source metadata, not simulated offscreen actions.

The source accepted revision **9** has been frozen, unmodified, in `adventures/ridge-survey-rev9.mjs`. Previous rev1–8 manifests remain in place. Historical snapshots do not receive NPC cast/history fields, and invalid cross-revision data cannot silently merge. The first Nublar adventure and legacy solo/Worker are not changed by this package.

## Deliberately outside this milestone

This is **NPC information plus static presence and limited dialogue**, not full independently acting NPC AI or Evolved social skill contests. These supporting characters do not patrol, fight, suffer critical injuries, leave their fixed rooms, trade items, attempt scene objectives or execute agendas. No automatically generated conversations, concealed server-side truths, random cast creation, Story Point rewards or campaigns are implied. Extending their agency must use validated generic movement/effects and the existing deterministic Evolved engine, not script callbacks or a fake "director forces betrayal" system.

## Acceptance

Focused tests are `tests/adventure-cast-009c2.test.mjs` (9), plus the **609** accepted regressions. Historical revision tests construct genuine old saves without the rev10-only cast. Expected CI total: **618/618**, subject to independent verification. Require exact PR-head GitHub Actions before merge and independently merged-main Actions/Pages after merge. Real graphical desktop/mobile play is still outstanding.
