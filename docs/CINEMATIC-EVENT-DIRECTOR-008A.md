# Checkpoint 008-A — Typed Cinematic Scene Events and Bounded Exploration Pressure

**Date:** October 24, 2026. **Source grounding:** the user's private *Alien RPG Evolved Edition* source governs the existing stealth, initiative, stress, panic, injury, solo and Cinematic procedures. The scene-event registry and **pressure-clock mapping below are original Jurassic adaptation mechanisms** inspired by *Last Survivor*, **not a claim of exact Solo encounter-timer transcription**, and must not be represented as full Evolved Rules As Written parity.

## Why this checkpoint exists

Dinosaur Horror RPG is an Alien Evolved adaptation into Jurassic Park: **Dinosaur Horror, Sci-Fi Action and Sense of Wonder**. Characters should encounter relevant scenes because the Game Mother and scenario provide plausible dramatic situations, not because a simulated island breeding population happens to wander past. Quiet discovery must remain a legitimate end state. A typed, testable scene/event proposal boundary comes before generative AI can make consequential proposals.

## Seven authored conditional events

`src/cinematic-director.mjs` contains a finite registry with stable keys, *actual* scene location, theme, immutable narration and explicit requirements:
- Visitor Center control-room silence while auxiliary power is still off.
- Visitor Center lobby's monumental exhibits (wonder).
- Generator's steady return in the shed **after power is actually restored** (recovery).
- Heavy rain at the jungle service path **only during the committed squall**.
- Failed perimeter evidence at the physical paddock.
- Distant, ambient-only giants visible from the helipad (wonder; **not** a physical dinosaur in the encounter).
- Waiting for rescue at the helipad after a genuine distress signal and before activating the beacon.

The browser offers **Experience scene** actions for the selected character only when all conditions hold. Text entry also accepts `scene <event-id>`. The deterministic `partyStep` validates ID, actor, local zone, mission flags, weather, mode ownership, time-of-action status, combat exclusion, injury and one-time-per-character history **before committing**. It records `sceneRecords` and an actor-specific visible event, but—like existing Wonder observations—consumes no time or dice and **cannot** spawn creatures, invent NPCs, add inventory, change stress, set rescue flags or force a combat roll. Wonder journals are independent of event history.

## Actor-local pressure and credible encounters

The accepted world still contains only the previously modeled physical Velociraptor. A new **original bounded d6 exploration-pressure adaptation** checks only on *accepted* outdoor movement, sneaking, rushing, investigation or waiting; pure scene/wonder observations and combat actions never check. Each actor has a distinct saved pressure level from 0–5, a check count and a last committed beat.

- The dice pool normally starts at **one d6** and increases with the actor's current pressure, capped at six dice. Sneaking subtracts one die; rushing adds one. A **1 on a d6** increases the pressure one step, capped at five.
- The check is derived reproducibly from the initial scenario seed, actual exploration beat and actor ID, without consuming the existing game combat/skill PRNG state. Accepted pressure results are recorded on the corresponding action.
- This is **pressure, not a creature encounter generator**: reaching the cap never spawns, teleports, places, attacks or grants hidden knowledge of a dinosaur. Only a physically present creature on an actually traversable one-edge sound path, audible through the accepted terrain/sound system, can justify a near-heavy-footfall clue as the pressure first reaches maximum. If none can be heard, no dinosaur clue is emitted. Ordinary serene observation does not raise pressure.
- The chosen actor sees only their own abstract pressure and currently eligible local scenes. Other locations, off-camera actor histories and enemy routes remain private. No global ecosystem or random dinosaur population exists.

**Important distinction:** This checkpoint does *not* yet implement the full Solo *Last Survivor* timer, escalation tables, Campaign rules, Cinematic Acts, an autonomous generative Game Mother, a danger-event engine, or multi-scene branching campaign orchestration. The first typed proposal/pressure vocabulary is the foundation for those later verified milestones, not their substitute.

## Persistence, validation and boundaries

- Save kind `dinosaur-party-incident` remains **schema v3**; optional `sceneRecords` and `scenePressure` default to empty for compatible earlier v3 saves. New recordings validate a real authored ID and zone, genuine actor, unique actor-event pair, finite legal beat, bounded unique pressure record and nonnegative check count; invalid or duplicate data is rejected.
- Party, Character/Focus and Spectator use the same `partyStep` authority. Mode/camera switches do not spend time, dice or add secret events. Solo 006.2, Cloudflare Worker v006, preexisting 362 tests, character creation, personalized Wonder journals, physical shutter/squall and accepted Velociraptor attack rules remain intact.
- **14 new** focused tests are added, targeting **376/376** total. Candidate/main Actions and GitHub Pages must pass on their exact SHAs and remain separate from actual desktop/mobile manual graphical smoke, which is still outstanding.

**Next recommended development:** source-grounded conditional *danger* events and an actual playable connected Cinematic adventure, while developing 007-M finite physical park resources, then 007-N typed multi-actor AI Game Mother. Preserve the core Alien Evolved game experience; do not build island-wide Zoo Tycoon ecology.
