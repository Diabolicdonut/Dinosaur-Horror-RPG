# Checkpoint 007-D — Dynamic control and spectator simulation

**Accepted:** 2026-10-22. **Release scope:** dynamic control over the independently saved Dinosaur Horror **party incident**, not the legacy 006.2 solo game.

## What now works

The same scenario, roster, dice, inventory, objective flags, dinosaur positions and round-robin action clock support three interchangeable **decision ownership** modes.

| Mode | Who chooses each playable actor's next legal action? | User experience |
| --- | --- | --- |
| **Party** | Human player, for all survivors | Choose each survivor's move, interaction, investigation or pause |
| **Character** (internal `focus`) | Human player for the currently focused survivor; AI for every other survivor | Change focused character at any time; AI companions progress other turns |
| **Spectator** | Autonomous companion director for every playable survivor | Watch the simulation, pause, advance exactly one actor action, resume at selectable pace, take over |

**Control is separate from camera.** Player may follow the active actor or fix the camera to a selected survivor without changing control of any character or advancing time. Views render authored local rooms/items, personal observation logs and locally visible dinosaur threats. Remote actors are not automatically shown with full status in Character/Spectator modes. A spectator can switch the viewed survivor; there is no hidden-world omniscient director camera by default.

**Switching** is atomic at action boundaries. It changes future control ownership and appends a control history record with current beat, action index, selected character and control epoch. It never rerolls a past check, spends an action, resets talent/stress/items, moves dinosaurs, or changes the existing RNG state. A player can take over any eligible survivor even if it is not their turn; when their turn is next, they may issue their action. Playback pauses automatically upon changing control or focus.

## Computer-controlled survivors — current implementation

`src/party-director.mjs` provides an **offline deterministic companion policy**, not a generative or conversational LLM. It takes a restricted *actor observation* rather than the hidden game state. Its inputs are the actor's career, agenda, local observations, visited places, attempted investigations, immediate visible dinosaurs, inventory, openly available park map exits and mission milestone flags.

The director proposes intentions appropriate to the current situation: investigate local environmental clues when relevant, recover the visible staff keycard, attempt to restore power, send the distress call, navigate toward the helipad beacon, and take shelter from a visible dinosaur. Other characters may wait when they lack permission/equipment rather than teleporting or manufacturing items. Intended task, goal, reason, decided action, actor ID and action index are saved in `aiDecisions` for deterministic reproducibility.

Only the existing deterministic party engine may validate an action, roll seeded Evolved-style dice, apply its physical consequences, move dinosaurs or record irreversible state changes. If an AI proposal is unavailable, the director falls back to a validated wait and records that fallback. It cannot invent inventory, learn unknown predator coordinates, or skip door access requirements. AI autonomy has role-sensitive behavior but **does not yet implement a complete personality, relationship, or dialogue model**.

**Scenario-completion test:** a single spectator run from the standard 3-survivor seed is tested for physical access-card recovery, auxiliary generator activation, transmitted radio distress call and successful helipad beacon activation, within 400 committed legal actions. This is a computational integration test, not a claim of complete campaign storytelling or dinosaur survival lethality.

## Playback and interruption safety

- **Pause:** no game-world effect, RNG draw or action; stop scheduling new decisions.
- **Step one:** while paused, commit at most one autonomous character action under the same rule engine as a human action. If a human-controlled character is due, stepping does nothing.
- **Resume:** schedule actions at 400 / 800 / 1200 / 2000 ms visual pacing, never changing the in-game time cost of an action; automatically stop at a human-owned turn or scenario outcome.
- **Background tab:** page visibility cancels pending advancement and persists the paused state. No unattended server or background work.
- **Stale intention:** each scheduled decision includes expected simulation beat and control epoch. Changing modes, viewing actor, or pausing invalidates previous pending proposals. The accepted decision log is replayable independently of model randomness.
- **Atomic action:** mode changes are synchronous outside individual `partyStep` state transitions; no partially resolved action can be retconned.

## Save migration, compatibility and isolation

- **Party v3:** `src/party-engine.mjs` now stores `control`, `controlHistory`, `aiDecisions`, and each character's visited rooms/attempted investigations. Save ID remains `dinosaur-party-incident-007c` so an existing Party v2 can be upgraded in place on load. The explicit `upgradePartySave` function validates data, upgrades only the previous party schema, reconstructs limited actor memory from prior actions, and preserves all committed world/RNG/action history. Replay tests ensure this.
- **Original 006.2:** No changes to `src/engine.mjs`, legacy singleton game save, Cloudflare Worker v006, token setup or original project isolation. There is **no** automatic migration of old solo saves.
- **Rosters:** Manual, seeded automatic and hybrid Personnel Registry characters continue to launch through the same validated party transfer; all newly launched incidents default to Party Control, paused AI and follow-active camera.

## Mechanics fidelity / intentionally pending

This milestone implements a new *control and decision scheduling layer*, **not** additional Alien RPG Evolved rules. The existing party incident still uses its **simplified one-action-per-actor round-robin exploration clock**, rather than the Evolved rulebook's complete time and initiative system.

Full cinematic character simulation remains incomplete: actual dinosaur attacks, critical injuries, combat action economy, panic-induced fleeing/dropped items, end-to-end 27 talent effects, multi-party conversations, and general natural-language LLM-refereed actions. Current dinosaurs cause stress on proximity; the UI must not call that complete survival combat. The AI uses a bounded offline policy and public mission flags; detailed per-character communication/mission knowledge will need richer modeling before full horror simulation fidelity.

## Code and tests

- `src/party-engine.mjs`: upgraded party v3, save migration, control ownership enforcement, persistent per-actor memories.
- `src/party-director.mjs`: control modes, focus, camera, playback controls, restricted observations, grounded AI policy, stale-turn prevention.
- `party.html`, `src/party-app.mjs`, `src/party.css`: interactive mode selector, independent camera, focus selection, pause/step/resume and pace controls, separate save/load/export.
- `tests/party-director.test.mjs`: non-temporal control/camera changes, correct AI/human ownership, pause/step, no stale requests, hidden dinosaur knowledge isolation, deterministic journaling, full objective simulation, migration, browser integration and malformed saves.
- Legacy `tests/party-engine.test.mjs` remains, retaining all previous shared-world and source-mechanic assertions.

**Acceptance:** final GitHub CI and GitHub Pages deploy must succeed; live graphical browser smoke-testing has not been claimed solely on the basis of automated tests.

## Next milestone

**Checkpoint 007-E:** move from the simplified exploration beat toward source-faithful Evolved combat and stealth timing; make dinosaurs dangerous through real perception, pursuit, damage, injury, and panic; support scenario-grounded character relationships and richer AI decision plans. Preserve all three modes and backward-compatible saves while introducing these procedures in validated increments.
