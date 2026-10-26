# Adventure Package / Game Engine Separation — Authoritative Architecture Contract

**Status (2026-10-25):** Approved direction; **not yet implemented**. GitHub main at adoption: `1cd360a732982189130c8381ee17d1ca980bbf73` (007-M1, v0.7.20, 454/454 tests, Actions/Pages passed). This document explicitly supersedes any roadmap implication that continued *After the Storm*-specific logic belongs in shared mechanics.

**Current partial implementation note (009-C1, October 26, 2026):** Authored Cinematic packages can now have one to five optional acts; a standard three-act book structure is not required by the generic engine. The Long Count has a playable independent selected-adventure runtime with Evolved predator combat and a newly versioned `scenarioMaterial` dossier for player briefing, seat/act agendas, triggered Story Cards and earned documents. Rev1–8 manifests remain bound and intact. `After the Storm` still has some named assumptions in `src/party-engine.mjs`; the full universal runtime and AI generator remain unimplemented. Official Alien RPG scenarios are private structural references only, never content to copy to GitHub.

**009-C2 refinement (2026-10-26):** The optional authored `supportingCast` field is compiled/fingerprinted like other content. It defines stable NPC roles, source-fixed positions, private motives and variant/evidence-gated local conversation topics; a pure generic interpreter and action journal enact only voluntary talk. This is not autonomous NPC behavior and does not alter source Evolved rules. Original scenario data and all historical revisions remain separate; browser delivery does not securely conceal GM notes.

## Product requirement

**The game engine must not be designed around one adventure.** The long-term game is an *Alien RPG Evolved Edition*-inspired dinosaur-survival RPG, with its adventures, NPCs, creatures, places, goals, dangers, Wonder and prose supplied as **replaceable, validated content**. The eventual AI Game Mother can build and run new adventures so that opening scenes, objectives, discoveries, emotional beats and resolutions are genuinely varied; characters' choices and seeded Evolved checks, not fixed scripts, determine what occurs.

**Replayability requirement (2026-10-25):** Include multiple excellent *pregenerated authored adventure templates* **whose individual playthroughs vary meaningfully**, plus an **open-ended procedural Cinematic and Campaign generator**. Variation includes causal secrets, NPC agendas, creature situations, routes, clues, optional scenes, resources and consequences; it must not be cosmetic shuffling or random retconning. Authored content and generated content obey the exact same schema and Evolved rules. See [Procedural Adventures and Replayability](PROCEDURAL-ADVENTURES-REPLAYABILITY.md).

*After the Storm* is a **sample/test adventure**, not the engine, the default adventure template for all future generations, a mandatory rescue plot, or an archetype into which generated adventures must fit. Use it to preserve the existing 454 regressions, not to determine the shape of all future stories.

## Layers and ownership

1. **Rules and deterministic game engine:** Evolved attributes/skills/dice, stress, panic, initiative, injuries, equipment/inventory, action time, movement/path legality, visibility, sound, awareness, exploration pressure when enabled, NPC/animal encounter participants, actor knowledge, saves, control modes, event validation and repeatable effect application. Rules never assume a named island, physical zone ID, particular career, specific repair, creature instance, NPC, rescue stage or ending. Optional mechanics are generic typed capabilities.
2. **Adventure package (declarative content):** Stable ID/revision/setting; locations, exits, properties, light/weather; physical items, finite stock, props, systems; named NPC identities, starting positions, goals, personalities, known information; creature **instances** and encounter dispositions; initial world state and character placements; clues, investigations and scene opportunities; ordinary and exceptional outcomes; objectives and ending conditions; optional acts/chapters, suspense and wonder. Named dialogs and prose live here.
3. **Validated runtime adventure instance:** Frozen adventure ID/revision/content hash plus seeded instantiated content, full state, event ledger, actor knowledge and independently committed random rolls. Loading resolves the **exact original adventure revision**, not whatever template currently happens to be the default.
4. **Adventure generator / AI Game Mother:** May generate the package, instantiate a world, suggest scenes/complications/dialogue and parse players' natural language. It cannot write raw game state, invent owned inventory retroactively, grant abilities, contradict visibility, change Evolved results, force combat or overwrite accepted causal history. Proposed changes must use a finite, typed, validator-approved effect vocabulary passed to the deterministic engine.

**Dependency direction:** `engine → generic schemas/interfaces`; `adventure content → schema`; `runner → engine + chosen adventure`. The core engine must **not import a specific adventure module**. UI labels and valid action affordances are derived from the selected adventure instance and the current actor's knowledge.

## Minimum manifest vocabulary (example shape, not an implemented schema)

```json
{
  "id": "nublar-after-storm",
  "revision": 1,
  "setting": "island-park",
  "premise": "An emergency interrupts a routine day",
  "locations": {},
  "connections": [],
  "physicalEntities": [],
  "characters": [],
  "creatures": [],
  "initialState": {},
  "clues": [],
  "interactions": [],
  "scenes": [],
  "objectives": [],
  "endings": [],
  "directorGuidance": {
    "themes": ["dinosaur-horror", "sci-fi-action", "wonder"],
    "escalation": "responsive-not-scripted"
  }
}
```

Declare IDs, prerequisites and *typed effects*, not arbitrary executable JavaScript in generated content. Examples: `skillCheck` with Evolved skill and legal situational modifiers; `consumeItem`; `setFlag` (declared flag only); `moveActor` (existing legal route only); `recordDiscovery`; `advanceClock`; `emitVisibleEvent`; `completeObjective`; `endAdventure` (validated outcome). An authored exception should be implemented as a composable, reusable typed action handler, not hardcoded `if (room==='shed')` branches.

Generator validation checks schema/type bounds, unique IDs, connected playable map/valid starts, reachable objectives, inventory and resource conservation, creature species definitions, legal NPC positions, mutually satisfiable prerequisites, rule affordances, ending paths (including refusal/avoidance), action-cost safety and information privacy. Generation and mechanical-play dice streams are independently seeded. A generator cannot alter source rules through an adventure package.

## Audit of coupling to remove (currently true)

- `src/party-engine.mjs` directly imports the singleton `SCENARIO` and hardcodes seven rooms, initial Velociraptor instance, `power/distress/beacon` rescue flags, shed/card constraints, radio/generator/beacon checks, NPC/creature exceptions, lamp supply count and rescue outcome.
- `src/cinematic-scenes.mjs`, `src/cinematic-director.mjs`, `src/cinematic-continuity.mjs`, `src/cinematic-danger.mjs`, `src/cinematic-encounters.mjs` and `src/cinematic-escort.mjs` embed *After the Storm* places, prose, NPC Mara Velez and its story logic. Their **generic primitives** belong in the engine; their named instances/dialogue belong in the adventure package.
- Other helpers for pursuit, sound, light, environment, director, UI and save validation must be dependency-audited too. Merely moving `scenario.mjs` into a folder while retaining singleton imports would **not** satisfy this contract.
- `src/scenario.mjs` is currently only partial data separation; it must become an importable content package. Existing history `nublar-incident-1993` and v3 saves cannot silently lose their exact scenario interpretation.

## Authored adventure templates vs compiled adventures

An *Adventure Template* has immutable creative identity plus **variation points** with permitted combinations. On **New Game**, compile the template (or a newly generated scenario) with a recorded independent generation seed into a complete, immutable **AdventureDefinition** and instantiate it. A fresh seed may alter actual mission causes, creature roles, NPC interests, routes or scene opportunities; later Game Mother events may not rewrite facts already committed by the compiler. **Continue** uses the existing locked compiled manifest and history, never compiles an old save with a newer generator version.

A procedurally generated **Campaign** compiles each new chapter against a durable continuity ledger, rather than requiring a fixed plot chain or resetting established facts. Even an authored template should pass a different-seed **structural variability** test as well as equal-seed reproducibility and hidden-information fairness checks. The spec is [Procedural Adventures and Replayability](PROCEDURAL-ADVENTURES-REPLAYABILITY.md).

## Next milestones, in required order

**A. Boundary and migration contract first.** Catalog all imports and named-zone/flag dependencies. Define `AdventureDefinition` and `AdventureInstance` validators and a generic `ScenarioContext` interface; make an explicit adapter for *After the Storm*. Do not remove previous gameplay to achieve genericity. Preserve exact source Evolved mechanics and the old solo/Worker isolation.

**B. Extract with regressions.** Relocate existing scene text, named NPC/creature configuration, finite stock, objectives, conditional scenes, repair challenges and rescue epilogue into `adventures/after-the-storm/`. Change party-engine/director/scene/action helpers to receive the selected validated adventure through runtime state or arguments (no global mutable singleton). Ensure old party-v3 saves migrate safely with locked adventure ID/revision and stable canonical actions.

**C. Second, *substantially different* playable fixture.** Add a small alternative adventure (for example a scientific field mission/rescue in a different map with different NPCs/objectives and at least one possible noncombat ending). **Without changes to core mechanics**, instantiate both packages, take legal actions, save/reload, navigate, resolve Evolved rolls and complete appropriate endings. A renamed clone of the first seven rooms fails the gate.

**D. Generation after validation.** First support **seeded variations of authored templates** so that repeat plays of a pregenerated adventure have materially different hidden causes, NPC agendas, physical dispositions, investigation paths or endings. Then generate complete, original standalone Cinematic adventures from validated roles and constraints; extend that machinery to new continuing Campaign chapters grounded in prior accepted events. Later let the AI Game Mother author original manifests and situations subject to schema validation, version-bound saves and durable causal memory. Do **not** impose a fixed threat schedule or require island-scale ecology. See [procedural/replayability contract](PROCEDURAL-ADVENTURES-REPLAYABILITY.md).

## Hard acceptance gate

The engine runs **two different adventures unchanged**, both pass deterministic/Evolved/Party-Focus-Spectator/security and resource-conservation regression suites, both have legal distinct routes and endings, and both save/reload by exact manifest version. An automated dependency check fails when a generic engine imports `after-the-storm` or hardcodes its proper-noun IDs. The existing 454 baseline tests remain passing; real desktop/mobile gameplay tests are still outstanding. **Until this gate passes, scenario independence must be described as planned, not implemented.**

### Explicit non-goals

No Zoo Tycoon animal population, no forced `T-rex breakout → rescue → helipad` template, no scripted requirement to fight, no AI bypass of Evolved checks, no massive advance simulation of all dinosaurs, no claims of complete Evolved RAW without source verification, and no irreversible migration of old accepted saves.
