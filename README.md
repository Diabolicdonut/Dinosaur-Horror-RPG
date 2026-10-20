# Dinosaur Horror RPG — Isla Nublar Prototype

A personal-use, browser-based dinosaur survival-horror RPG prototype. Its initial *Jurassic Park* setting is deliberately isolated from the original rules engine so it can later be replaced with an original dinosaur setting.

**Status:** Initial proof of concept. This is not a complete implementation of the *Alien RPG* rules.

## Design contract

- The **deterministic engine** owns dice, character state, locations, items, predator positions, injury, stress, panic, victory and death.
- The **AI interpreter** (optional) only translates text into a bounded, structured action. The engine validates legality.
- The **AI narrator** (optional) only retells already-authoritative events. It cannot change game state.
- Every random draw uses a seeded, stored PRNG so identical seeds and player commands can be replayed.
- Browser play works without an API key. The optional AI backend keeps OPENAI_API_KEY on the server.

## Getting started

After the prototype files land, run `node --test` for engine tests, then `node server.mjs` and open `http://localhost:8787`. No dependencies or build step are required. For optional AI, provide `OPENAI_API_KEY` and (optionally) `OPENAI_MODEL` as environment variables and enable the AI Director in-game.

GitHub Pages can host the static offline game, but requires a separately hosted backend for AI calls. Never put an API key into browser code or this public repository.

## Development priorities

1. Playable incident, reproducible rule outcomes and saves.
2. Formalize the dice/stress/panic rules against the supplied reference PDFs, recording any deviations.
3. Add predator sight, scent, hearing, weather, tactical distance and richer survival.
4. Expand the island map, persistent NPCs, mission logic and testing.
5. Move Jurassic Park-specific canon into replaceable scenario data and retheme before broader release.

## Rights and references

*Alien RPG* (Free League) and *Year Zero Mini* by Matt Kay / 3 Skulls Pub are design references supplied privately in the user's Library; neither PDF is included in this repository. This repository is a personal technical prototype, with original code and paraphrased mechanics rather than copied rulebook text. *Jurassic Park* and its setting belong to their respective rights holders.
