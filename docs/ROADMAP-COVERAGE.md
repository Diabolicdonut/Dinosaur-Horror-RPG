# Dinosaur Horror RPG — Current Approved Roadmap Coverage

**Reviewed against accepted main:** October 27, 2026 · Game v0.7.35 · checkpoint **009-C3**, commit `e4690b34c3da493445d8032296d4c5c3c84fb21d`. The accepted gameplay milestone is backed by **626 automated tests**, GitHub Actions and Pages success. This document reviews product scope; it does not introduce game mechanics.

## Authoritative scope and priority

This is a **full approved bounded delivery roadmap**, not merely the eight first-playable checkpoints and not an assertion that an indefinitely generated collection of adventures can be 100% exhausted. The core game remains a cinematic, Jurassic Park-inspired dinosaur survival-horror RPG **faithful to Alien RPG Evolved Edition mechanics behind a natural-language player interface**. Party, Focus and Spectator modes remain switchable; players can generate or customize any/all survivors. The same scenario-agnostic deterministic engine must run authored adventures, widely varied replays, AI-created Cinematic adventures and persistent Campaign chapters. A Game Mother can handle interpretation, grounded adjudication, narrative, uncertainty and conversation **without changing fixed facts or inventing mechanical outcomes**. Dinosaur encounters alternate terror with credible calm, wonder and beauty; herbivores are animals, neither unconditional friends nor mandatory combatants. This is not a park-management simulator.

**Governing contracts:** `docs/EVOLVED-RULES-AUTHORITY.md`, `docs/ADVENTURE-ENGINE-SEPARATION.md`, `docs/PROCEDURAL-ADVENTURES-REPLAYABILITY.md`, `docs/REFEREE-CONTRACT.md`, `docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md`. Official Free League material remains private mechanical/structural authority only; the public repository uses original adventure content.

## Measured status

The complete accepted-deliverable roadmap contains **100 weighted planning points**. Only fully accepted, source-backed gates earn points. A partially implemented gate is displayed but earns **zero** until its explicit acceptance is satisfied. This is a conservative roadmap completion indicator, not a scientific fraction of hours worked. Reweighting requires an explicit roadmap revision and audit record.

| Gate | Weight | Current | Source / remaining acceptance |
|---|---:|---|---|
| Evolved rules baseline | 8 | Accepted | Validated source-faithful dice, stress, injury and rule foundations; full remaining Evolved parity appears separately |
| Party, Focus and Spectator | 7 | Accepted | `src/party-director.mjs` and regression tests |
| Compiled adventure packages and seeded variation | 8 | Accepted | `src/adventure-definition.mjs`, rev-bound manifests; does **not** claim Nublar engine fully generalized |
| Wildlife and defensive peril | 7 | Accepted | Local animals, real approach, predator reaction and research defensive combat |
| Cinematic adventure dossier materials | 4 | Accepted | `docs/SCENARIO-MATERIAL-009C1.md` |
| Supporting cast and bounded autonomous return | 4 | Accepted | `docs/ADVENTURE-NPC-AUTONOMY-009C3.md` |
| Carried-gear offensive survivor combat | 8 | Partial | Real gear, ammo, attacking Evolved rolls, damage/armor and creature reactions across scenarios |
| Human NPC independent agency | 9 | Partial | Sight/knowledge, motives, choices, danger responses, Evolved action economy, wounds and combat |
| One scenario-independent Party engine | 9 | Partial | Remove remaining named Nublar branches, same safe saves/actions/physics in both adventures |
| AI Game Mother, grounded adjudication | 8 | Partial | Extend current bounded AI proxy/intent/narration to original safe scenario-independent improvisation, legitimate dialogue and exception ruling |
| Procedural Cinematic adventures | 8 | Planned | Original coherent packages, seed variation, discoverable clues, multiple plausible conclusions |
| Continuing generated Campaigns | 7 | Planned | Persistent facts, characters, relationships, injury, episodic pacing, unresolved threads |
| Desktop/mobile complete graphical QA | 7 | Planned | Real player UX, control-mode smoke, accessibility, both seed variants and recovery |
| Server-authoritative GM secrecy | 6 | Partial | Protect unrevealed secrets, AI tokens, save integrity and future game state against player-side inspection |

**Overall accepted progress: 38/100 = 38%.** The separate first-playable foundation remains **5/8 = 63% (rounded)**. Neither number is a probability of release or an estimate of remaining work time.

## Reconciled work sequence

1. Continue from accepted 009-C3 v0.7.35. Next: independent NPC local perception and responses; offensive Evolved combat, truthful defensive consequences and physically grounded injuries. Never convert this into a giant free-running ecological sim or force fights.
2. Keep versioned adventures immutable and refactor away remaining `After the Storm`/Nublar-only logic, retaining `The Long Count` revision 1–11 compatibility. Validate the same mechanics with different original scenarios.
3. Strengthen the AI Game Mother to generate bounded decisions and narrative content without directly modifying state, disclosing unrevealed information, or cheating on rolls.
4. Generate original, structurally varied **Cinematic** adventures with genuinely different NPC incentives, physical layouts, mystery, wonder and endings, then connected **Campaign** episodes using persistent facts.
5. Complete server-secret boundaries, robust save/export/recovery, desktop/mobile graphical play, control mode switching and accepted end-to-end release gates.

### Change discipline and audit limitations

The canonical implementation-plan file contains an extensive chronological record, including old “current” notes. **This 2026-10-27 review and actual current `project-state.json` override historical status statements**; do not delete the valuable older audit. Source CI verifies mechanics and tests, **not** manual graphical testing. The browser-stored GM material is inspectable even if not projected in the view. The currently existing AI Worker is not yet the fully autonomous Game Mother. Neither simulated NPC itinerary nor seeded variant selection is a procedural adventure generator. Increases in progress require accepted functional evidence, not just edits to these JSON fields.

The in-page progress widget reads this fixed roadmap from `site-progress.json` and the current revision from `project-state.json`. It shows **both overall roadmap percentage and current foundation percentage** with the underlying status and weights.
