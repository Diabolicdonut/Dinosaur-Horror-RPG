# Architecture Decision 001 — Hybrid AI Game Master

**Status:** Accepted design direction; not yet implemented in the prototype
**Date:** 2026-10-20
**Base implementation:** checkpoint 001, commit `e9062a56a2855156f44227cefeb2e14557236251`
**Target deployment:** GitHub Pages (static client) + Cloudflare Worker (private OpenAI API gateway) + OpenAI Responses API
**Project isolation:** This architecture and all related files belong exclusively to Dinosaur Horror RPG.

## Product goal

Build a persistent single-player dinosaur survival-horror browser RPG. The initial personal-use world is based on *Jurassic Park* canon (Isla Nublar, park facilities and animals); separate franchise data from the engine so the scenario can later be replaced with original dinosaur-survival content.

The AI is a **full Game Master**, not merely a text parser or flavor-text generator. It must be able to:
- understand open-ended player intent;
- discover and cite the applicable game rule(s) from canonical, structured reference data;
- adjudicate ambiguous, improvisational or exceptional actions by proposing a rule procedure;
- portray NPC speech, goals, reactions and persistent relationships;
- narrate sensory detail, danger, successful and failed checks, and consequences;
- choose appropriate stakes and complications *within permitted boundaries*;
- ask clarifying questions when intent cannot be grounded in current state.

The deterministic simulation remains the **only authority that commits mechanical game-state changes**. A GM proposal is not a change until validated and applied. NPC dialogue may be freely generated, but if it establishes a mechanical fact (an item, secret, clue, promise, location change, or quest flag), it must generate a separate, validated proposal.

## Responsibilities and boundaries

| Component | Responsibility | May directly mutate canonical game state? |
| --- | --- | --- |
| GitHub Pages client | Display, collect input, receive committed events, local saves; optionally replay | Only through deterministic engine transitions |
| Pure rules engine | Position, item ownership, skills, health, stress, resources, time, hazards, predator physics and AI, RNG, predicates and effects | **Yes**, after validation |
| Canonical world/rules data | Locations, geometry, characters, dinosaur capabilities, rule IDs, thresholds and consequence definitions | No, versioned source |
| Cloudflare Worker | Auth, rate limits, secret custody, validate/sanitize request and model result, send API requests | **No** |
| OpenAI GM | Parse intent, recommend rule/stakes/modifiers, handle unanticipated actions, NPC dialogue, narration | **No** |
| Game journal | Immutable outcomes, selected GM proposals, dice/seed and version IDs | Append-only events via engine |

No browser API key. Store `OPENAI_API_KEY` as a Cloudflare secret. Restrict origin to the deployed Pages URL **and** enforce access control/rate limiting: CORS is not authentication. A publicly callable Worker could otherwise spend API credits. Consider Cloudflare Access for private, single-user play.

For private single-user MVP, the client's seeded engine and local save may be authoritative for gameplay (not anti-cheat). If multiplayer/anti-tamper/server-synced saves are added later, move state validation and event commits to trusted server compute. Never trust client-authored hidden state for security-sensitive operations.

## Turn protocol

1. **Snapshot and perception.** Engine assembles a player-visible perception, legal exits, inventory and nearby entities. For the GM adjudicator only, it may also supply a limited hidden context, if needed to resolve an action. The player narrator receives only discovered details.
2. **Interpret.** Rules-based parser handles simple canonical commands locally; otherwise OpenAI returns a structured intent with target IDs and any ambiguity. Never accept arbitrary JavaScript, executable commands or free-form state patches.
3. **Adjudicate.** For nontrivial actions, the GM selects the relevant rule ID(s), attribute and skill, permitted difficulty band, stakes, time cost, noise and preconditions. It may propose one or more typed effects (e.g., distract creature, create noise at location, move, investigate, use object, initiate dialogue, consume item) only from a defined capability catalogue.
4. **Validate.** The engine checks reachability, possession, available resources, physics, target existence, difficulty caps, rule eligibility, and world continuity. An invalid proposal is rejected with a precise reason. The Worker is not a second rules authority.
5. **Resolve and commit.** The engine rolls seeded dice as required; applies only approved effects and complications; updates predator positions, flags, injuries and stress; records the chosen GM adjudication and authoritative transition in the event journal.
6. **Narrate.** OpenAI describes only the committed outcome and player-visible world facts. NPC dialogue can be generated in parallel where safe. Any new facts with rules consequences return to the adjudication path.
7. **Persist.** Save schema version, world version, PRNG state, action, AI proposal/rule IDs, mechanical roll/effects and output event ID. Replays use recorded decisions rather than asking the model to recreate identical judgments.

Model output is not inherently deterministic even with fixed game seeds. **Mechanical outcomes are deterministic conditional on the accepted adjudication; event-sourced adjudication keeps past sessions reproducible.** The original model response is useful audit evidence but must not be necessary to replay a committed event.

## Structured API contract (design, subject to revision)

Proposed Worker routes:

- `POST /v1/gm/turn`: input + bounded, read-only context; return structured `intent`, `adjudication`, and optional `clarification`, without authoritative effects.
- `POST /v1/gm/narrate`: accepted events + permitted observations; return natural-language prose only.
- `POST /v1/gm/dialogue`: NPC identity, knowledge, memory, relationship and current scene; return dialogue and **separate proposed mechanical facts**, if any.
- `GET /health`: non-secret availability check.

Example output of `/v1/gm/turn`:

```json
{
  "intent": "throw_item",
  "actor_id": "player",
  "target_id": "jungle",
  "item_id": "loose_rock_01",
  "rule_ids": ["improvised_action", "noise_distraction"],
  "resolution": {
    "mode": "check",
    "attribute": "agility",
    "skill": "mobility",
    "difficulty_band": "standard",
    "time_cost": 1
  },
  "proposed_effects": [
    {"type": "emit_noise", "location_id": "jungle", "strength": 2}
  ],
  "reason": "A thrown rock can distract an animal that is close enough to hear.",
  "clarification": null
}
```

This example is illustrative: the **current checkpoint does not support** `throw_item`, `emit_noise` or loose-rock entities. No new effect type enters gameplay until engine validation, schema, tests and scenario data support it.

Use the Responses API with strict Structured Outputs or function calling. Parse, allowlist and validate every returned field again; a JSON schema alone does not prove that an action is legal. Follow the model's explicit refusals, incomplete output, and tool-call handling where applicable.

## Context discipline

For rules adjudication, retrieve canonical structured rule entries by stable IDs rather than attaching entire PDF scans to every AI request. Do not commit the supplied copyrighted rulebooks to the public repository. Preserve deviations and provenance in `docs/RULES-BASELINE.md`.

Maintain three views:
- **Authoritative world state** — engine-owned, including hidden predator positions and NPC facts.
- **GM adjudication context** — exact minimal information needed to arbitrate the proposed action; may include limited secrets.
- **Player-visible narrative context** — strictly filtered observations, established knowledge, last resolved outcome and NPC-visible information.

Treat input and generated text as untrusted. Never allow a player's prompt to override rule hierarchy, secret isolation, API safeguards or cost limits.

## Exceptions and novelty

Open-ended actions cannot all be hardcoded. The system should support a growing, declarative effect vocabulary. When no valid effect exists, the AI should state the intended ruling and mark the action as **unsupported** or request clarification; it must not silently invent an exception that patches arbitrary state. Proposed rulings can be added to the rule system intentionally and regression-tested.

For example, asking whether a raptor can smell the player in the rain requires fixed environmental data and species-specific perception rules, not a fresh arbitrary dice ruling each time. The AI can interpret intent and fiction, but the world simulator must handle repeatable sensory mechanics.

## Operational plan

- GitHub Pages hosts the static frontend on `https://diabolicdonut.github.io/Dinosaur-Horror-RPG/` once explicitly enabled.
- Cloudflare Worker hosts secured AI routes and holds the OpenAI secret.
- The current `server.mjs` remains a local-development gateway until Worker parity tests pass.
- Start with localStorage + JSON export; server-side saves (e.g., Cloudflare D1 or Durable Objects) are optional later. GitHub Pages alone cannot synchronize saves across devices.
- Keep AI calls to the necessary stages: a local parser for obvious commands; one adjudication request for unusual actions; one narration request when useful. Reduce cost via concise state, caching rule extracts, output caps and timeouts.
- Add an AI-disabled mode and deterministic error fallback; never claim a GM judgment succeeded when the backend timed out.

## Implementation milestones

1. **Architecture / contract** — this document, no change to checkpoint 001 mechanics.
2. **Worker gateway** — secure Worker with secret, access protection, origin restrictions, budgets, timeouts and mockable OpenAI client.
3. **Referee contract** — strict schemas, capability allowlists, rule lookup and engine-side adjudication validation, with tests that reject arbitrary world mutations.
4. **Scene dialogue** — canonical NPC knowledge, memory, interactive conversation, consent-to-record new story flags and narration firewall.
5. **Broader actions / predator simulation** — perception, improvised tools, distractions, injuries, combat, chase, environmental physics.
6. **Deployment QA** — GitHub Pages, Worker integration, real browser, end-to-end playthroughs, cost and replay audits.

**Do not mark any of these milestones complete solely because this design document exists.**
