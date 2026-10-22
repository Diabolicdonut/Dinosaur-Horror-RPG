# Checkpoint 007-C — Multi-Character Party Incident (playable alpha)

**Decision:** 2026-10-22. **Primary reference:** the user's privately supplied *Alien RPG — Evolved Edition* for actor attributes, skills, talents, stress and seeded dice. **Runtime:** experimental party simulator, separate from original live browser incident 006.2.

## What is available now

**[Party Incident](../party.html)** can launch from the [Personnel Registry](../characters.html). The validated roster (1–8 manual/automatic/hybrid survivors) is transferred through an isolated browser session key, or the party simulator may load an existing valid Character Lab draft. It can also generate its own legal three-survivor default party.

- All selected survivors exist in **one saved authoritative state**. Every actor has a stable ID, separate career/attributes/12 skills/talent, health, Resolve, stress, inventory, location, concealment and personally discovered observations.
- **One human-controlled Party mode**, in a deterministic round-robin sequence. The highlighted actor takes exactly one accepted action before another becomes active. Inspecting a scene or attempting an illegal action does **not** consume a turn. All actors advance a **single shared action-beat counter**; the counter is an intentionally simplified exploration clock, not yet Evolved combat rounds or turns.
- The seven existing scenario rooms, one persistent velociraptor, keycard, generator, radio, beacon, starting flashlight, and authored room descriptions are reused from `src/scenario.mjs`. Rooms share item supplies; an actor must actually carry the staff card to pass the shed door. Survivors may hand off items when colocated.
- Supported authoritative actions: move between real adjoining rooms; pick up an available item; give one possessed item to a colocated survivor; attempt concealment; investigate an authored observation; operate the generator, radio or beacon when the actual prerequisite flags are satisfied; or wait/listen. Actions are translated by a deliberately bounded phrase parser. Unsupported actions cannot fabricate persistent changes.
- Skill-dependent actions call `src/evolved-checks.mjs` with **the actual acting character's** attributes, trained skills, talents, current stress and seeded, individual d6 rolls. Rolls are included in the action journal for debugging/replay but hidden by default in normal presentation.
- The dinosaur is a single persistent entity moving only along connected exits in a deterministic **interim patrol/hearing model**. Noise is heard only within a graph-distance window. Close proximity produces stress, **not yet full attacks/injuries**. Do not claim species-specific Evolved combat fidelity for the current dinosaur AI.
- The player may choose any character to **view**, but the information feed only shows that character's events and global incidents. Viewed actor and acting actor are distinct; changing views is free, does not change who may act, and never changes world time.
- Save/load locally under `dinosaur-party-incident-007c`. Export a full JSON party incident separately. Existing solo saves and Cloudflare Worker are not touched.

## Known restrictions and intentionally deferred behavior

This is **not** a finished 3-mode game. Party control is usable, but switching to Character mode (human selects one character; AI decides the others' actions) and full Spectator simulation remain later milestones, dependent on a robust turn scheduler and validated AI-companion proposals.

Not yet implemented: complete *Evolved* quick/full action economy and initiative; injuries/armor/critical injury; fully autonomous dinosaurs/companions; world-targeted talent powers; advanced panic effects, items dropped by panic, movement interruptions, full sensory/line-of-sight ecology, cinematic scene director, open-ended AI natural-language referee. The player can describe many common short actions in ordinary words (including `I ...`), but there is **not yet universal improvisational action execution**. Arbitrary percent chances do not replace real dice.

No automatic **migration of an existing solo incident** is performed. Solo checkpoints remain available on `index.html` and keep their original saves; to start Party Incident, select an Evolved-valid roster through the Character Lab. Converting old solo state to the new format is a distinct future migration gate with its own tests.

The party incident is not connected to the v006 Cloudflare AI Worker. It uses deterministic offline local logic only; this avoids changing the original user-configured secrets/deployment during this milestone.

## Source code

- `src/party-engine.mjs` — authoritative multi-actor world state, shared action clock, seeded Evolved check calls, item and room constraints, queued actor rotation, hidden dinosaur, character-specific view projection, save validation.
- `party.html` and `src/party-app.mjs` / `src/party.css` — the independent browser user interface; interactive roster, dynamic room actions, free-form bounded command field, progress flags, save/load/export.
- `characters.html` / `src/characters-app.mjs` — validated `Launch Party Incident 007-C` transfer.
- `tests/party-engine.test.mjs` — 18 tests for starting roster, source rule validation, different actors' turns and locations, fixed item transfer, action rejection, personal observations, seeded replay, legacy save isolation, browser page contract and module syntax.

## Acceptance and next milestone

Checkpoint 007-C is accepted when GitHub CI validates all **118 tests** and GitHub Pages deploys this commit. Automated syntax/contract tests are not a substitute for manual browser smoke testing.

Checkpoint 007-D should implement a full **actor-level scheduler and Party/Focus/Spectator decision ownership**, using the same saved scenario and rolls. Focus mode needs knowledge-bounded autonomous companion proposals; Spectator needs a reliable pause/step/resume progression. Actual full gameplay AI may then be connected only after bounded world-effect contracts and interrupted-turn tests are validated.

**Do not present 007-C as complete Evolved RAW or finished AI/spectator play.**
