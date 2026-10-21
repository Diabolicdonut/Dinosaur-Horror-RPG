# Dinosaur Horror RPG — Isla Nublar Prototype

A personal-use, browser-based dinosaur survival-horror RPG prototype. Its initial *Jurassic Park* setting is deliberately isolated from the original rules engine so it can later be replaced with an original dinosaur setting.

**Status:** Checkpoint 006 — bounded AI GM adjudication for improvised investigations, distractions, cover and barricades. The new Cloudflare Worker source must be pasted/deployed manually for live Sol adjudication. This is a Year Zero-inspired proof of concept, not complete Alien RPG RAW.

## Design contract

- The **deterministic engine** owns dice, character state, locations, items, predator positions, injury, stress, panic, victory and death.
- The **AI interpreter** (optional) only translates text into a bounded, structured action. The engine validates legality.
- The **AI narrator** (optional) only retells already-authoritative events. It cannot change game state.
- Every random draw uses a seeded, stored PRNG so identical seeds and player commands can be replayed.
- Browser play works without an API key. The optional AI backend keeps OPENAI_API_KEY on the server.

## Getting started

Run `node --test` for engine and Worker mock tests, then `node server.mjs` and open `http://localhost:8787`. No dependencies or build step are required for local browser play. The browser client now points at the separately deployed Cloudflare Worker rather than the legacy local `/api/director` endpoint.

To use AI: deploy the `worker/` project to the existing Cloudflare Worker `dinosaur-rpg`; configure Cloudflare secrets `OPENAI_API_KEY` and `GAME_TOKEN`; enable **AI GAME MASTER (BETA)** and enter the token in the password field at runtime. The token is not persisted in game saves; it can optionally be remembered in this browser's localStorage. Cloudflare hosting and OpenAI API usage may incur costs. The Worker uses a 30/min rate-limiting binding; that is not a monthly spend cap.

See **[Deployment instructions](docs/DEPLOYMENT.md)**, **[AI status and diagnostics](docs/DEBUGGING.md)** and **[AI GM architecture](docs/ARCHITECTURE-AI-GM.md)** for setup and security. GitHub Pages hosts the frontend once enabled; the Worker performs AI calls. Never put either secret into browser source or this public repository.

**AI model routing (checkpoint 003):** the Worker now uses `gpt-6-luna` for natural-language intent parsing, `gpt-6.1-sol` for cinematic narration, and `gpt-6.1-sol` for the experimental NPC dialogue endpoint. Future rule adjudication will use Sol at medium/high reasoning, with optional, explicitly authorized `gpt-6-astra` escalation. See **[model policy](docs/MODEL-ROUTING.md)**. This routing is server-controlled; ordinary mechanical commands require no model call.

**Current AI milestone:** interprets nonstandard commands into supported engine actions and narrates committed events. Complex exceptions and improvisations are explicitly marked unsupported until validated capabilities are added; full NPC state and AI-generated rule adjudication remain future work.

## Development priorities

1. Playable incident, reproducible rule outcomes and saves.
2. Formalize the dice/stress/panic rules against the supplied reference PDFs, recording any deviations.
3. Add predator sight, scent, hearing, weather, tactical distance and richer survival.
4. Expand the island map, persistent NPCs, mission logic and testing.
5. Move Jurassic Park-specific canon into replaceable scenario data and retheme before broader release.

## Rights and references

*Alien RPG* (Free League) and *Year Zero Mini* by Matt Kay / 3 Skulls Pub are design references supplied privately in the user's Library; neither PDF is included in this repository. This repository is a personal technical prototype, with original code and paraphrased mechanics rather than copied rulebook text. *Jurassic Park* and its setting belong to their respective rights holders.

## Checkpoint 004: AI status and debugging

The browser now displays explicit AI connectivity states: disabled, token missing, connecting, **GATEWAY READY** (the token authenticated but no OpenAI model call proved), **OPENAI RESPONDING** (a genuine model response succeeded), or a specific failure. Click **TEST AI CONNECTION** for a no-cost authenticated status check (requires the latest `worker/index.mjs` deployed manually).

Optionally tick **REMEMBER TOKEN ON THIS DEVICE** to keep the `GAME_TOKEN` across reloads in localStorage, never in public HTML or JSON exports. **FORGET SAVED TOKEN** clears it. Do not use this feature on a shared device. The latest local autosave is automatically recovered on page load so a refresh does not reset the game.

**EXPORT DEBUG** downloads a redacted JSON report with state, rules, scenario, RNG seed, history, command transcript, network statuses, model replies/errors, and browser metadata. The existing **EXPORT SAVE** produces the ordinary game save. Read [Debugging](docs/DEBUGGING.md) before sharing a report: it includes hidden story details and your entered commands.

## Checkpoint 005: Targeted observations and free narration

The AI can interpret an inspection such as *“Check outside the window”* as a `look` action with a target. The deterministic engine now resolves that target against authored, location-specific `observations` in `src/scenario.mjs` rather than repeating the room setup. Common direct commands (`look out the window`, `inspect window`, `peer through the glass`) also work without AI.

Targeted inspections are **free**: they do not advance turn count, roll RNG, move the predator, or change survival state. Their resolved events can still be narratively enriched by the existing Cloudflare AI narration endpoint. Unknown inspection targets return a concrete "cannot get a clear look" message and suggest available inspectables rather than claiming an imaginary observation.

Inspect buttons show available authored targets alongside existing travel/action controls. New engine regression tests cover the specific debug-report reproduction and prevent inadvertent revelation of remote dinosaur locations. **Only GitHub Pages source changed; no new Worker code needs deploying.** See [Checkpoint audit](audit.md) for the root cause and validation.

## Checkpoint 006: AI referee with deterministic consequences

The game now supports several improvised natural-language actions. `gpt-6.1-sol` returns a **typed proposal** through `POST /v1/gm/adjudicate`; the deterministic engine independently verifies that the requested prop, adjacent exit, skill and world state are valid before it resolves dice and effects. Action history preserves the accepted proposal and resulting dice for replay and debug reports.

Try **"I throw the paperweight into the service corridor"**, **"I wedge the rolling cabinet across the passage to the corridor"**, **"I hide behind the cabinet"**, or **"I investigate the control consoles"** while in the Visitor Center Control Room. Each of the seven prototype areas contains a small set of grounded environment affordances. Barricades can delay the raptor, thrown objects can divert noise, and used objects persist in saves. The engine continues to control hidden predator locations, RNG, stress, injuries, turn costs and NPC/world state.

This is an intentionally **bounded first referee layer**, not the ability to create arbitrary items, chain many actions in one turn, or improvise complete combat rules. Unsupported compound actions are refused with clarification rather than invented outcomes. See **[Referee contract and examples](docs/REFEREE-CONTRACT.md)**.

**Deployment:** GitHub Pages receives updated frontend files through `main` publishing; **Cloudflare does not auto-sync**. Copy the [latest Worker source](https://raw.githubusercontent.com/Diabolicdonut/Dinosaur-Horror-RPG/main/worker/index.mjs) into the existing `dinosaur-rpg` Worker, then deploy. **TEST AI CONNECTION** should report Worker version **006**; the existing `OPENAI_API_KEY` and `GAME_TOKEN` secrets remain unchanged. Live end-to-end model adjudication still needs player verification.
