# 009-C1 — Adventure-owned scenario material, agendas and field documents

**Candidate — October 26, 2026** · *Alien RPG Evolved Edition* continues to govern rules; the three separately owned official Free League scenarios **Chariot of the Gods**, **Destroyer of Worlds**, and **Heart of Darkness** were reviewed as private **structural references**, not source material to transcribe.

## What those references demonstrate

A Cinematic adventure is not the mechanical engine or just an ordered set of mandatory encounters. Its authored package can contain a situation overview, the GM's initial state of the world, a player-facing premise, locations/maps and resources, character and non-player character roles, conflicting goals, optional acts, handouts, secrets, event triggers, contingent consequences, and different plausible endings. The three official books vary in length, pace, cast and intensity. Their contents are **not** implemented or adapted into the public game.

The Evolved engine, independently, determines skill checks, dice, stress, movement, wounds, initiative, player agency, perception/privacy and legal state changes. A scenario must never add a custom effect handler or quietly override those procedures.

## New reusable content contract

A versioned `AdventureDefinition` can now carry an optional, strictly JSON-only `scenarioMaterial`:

- **`briefing`**: public title and introduction, no secrets or forced outcome.
- **`gmOnly`**: authored GM situation, bounded secrets and plausible alternate developments. This is excluded from the player's view, action/events and individual agendas. **Caveat:** locally shipped JavaScript content is inspectable in browser source; this is a UI/privacy boundary, not cryptographic confidentiality. A later trusted server-side Game Mother can hold genuinely private authoring truth.
- **`agendas`**: seat-indexed (0–7), act-indexed (1–3) authored personal objectives, optional seeded variant. A player-controlled character may see their own current agenda; camera control in Focus cannot access someone else's agenda; Spectator receives none.
- **`storyCards`**: seat-indexed text issued **only** when a compiled and validated scene or objective trigger was committed to the event ledger. Cards can be conditional on an existing seeded variant. They do not award Story Points or force roleplay; such a mechanic must be added later with faithful Evolved source checks.
- **`handouts`**: public original documents triggered at `start`, an authored scene event, or an actual completed objective. An optional seed-variant gate lets one adventure have substantively different documents without retconning truth.

The generic compiler rejects unknown fields, duplicate/ambiguous IDs, forged triggers, nonexistent variant choices, non-JSON callbacks and out-of-range character seats. Scenario material participates in the deterministic manifest fingerprint; historic saves bind the original document content by revision.

The pure projector `src/adventure-scenario-material.mjs` reads authoritative committed scene/objective records without RNG or state mutation. A revision 9 research save additionally requires a recorded scene action for any cinematic scene journal used to reveal content, so inserting a fabricated journal entry does not create a valid save.

## Concrete playable content

New **The Long Count revision 9** is the only scenario currently supplied with this optional package. It adds an original ecological-survey field briefing, GM alternate-truth notes, six act-linked agendas for first and second party seats, three event-triggered Story Cards, and four handouts including seed-correct track reports. The original cinematic scenes and Evolved gameplay continue unchanged from revision 8; no new Alien enemies, company names, copyrighted scenario prose or original source artwork have entered the repository.

`adventures/ridge-survey-rev8.mjs` preserves exactly the accepted revision 8's authored data and fingerprint, while `adventures/ridge-survey-rev1.mjs` through `rev7` remain immutable. Historical rev1–8 incidents show **no** new briefing, story cards or GM notes, and do not change their prior encounter rules.

The Party browser now presents the public and owned contents in the Local Scene panel. The Nublar rescue and legacy solo/Worker were not extended or modified for this specific feature.

## Scope and future milestones

This is a **scenario information and presentation contract**, not a full Game Mother, scene generator, independent NPC simulator, playable role agenda reward system, or second authored procedural scenario. Each generated scenario later can submit identical validated data; nothing in the interpretation logic requires a specific plot, three mandatory fights or a fixed rescue sequence. A separate future initiative should migrate authored NPC cast/background dossiers into typed entities and support genuinely private server-side secrets, then implement source-consistent agenda rewards and AI-controlled NPC agency.

Continue combat parity separately: actual carried weapons, offensive action resolution, species-aware reactions and the missing Nublar/research common gameplay rules remain outstanding.

## Verification

Run `npm test` including `tests/adventure-scenario-material-009c1.test.mjs`, confirm a **607-test** baseline after the first seven new focused tests, verify historical bound saves, Focus/Spectator privacy and live scene triggers, then check **exact PR head** Actions before merge and **independent main** Actions/Pages after merge. Desktop and mobile graphical smoke tests are still a separate pending gate.
