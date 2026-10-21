# Checkpoint 006 — Bounded AI Game Master adjudication contract

**Status:** Source code committed to GitHub. The Cloudflare Worker needs a fresh manual paste/deploy from `worker/index.mjs` before this feature is live. GitHub Actions uses mocked OpenAI responses. Real Sol rulings and browser behavior have **not** yet been validated end-to-end.

## Architecture

The player may attempt actions in natural language, not just fixed commands.

1. Common commands use the deterministic engine without API calls.
2. Obvious improvised phrases (distraction, throwing, barricading, concealment behind local cover, detailed investigation) request a typed proposal from `POST /v1/gm/adjudicate`.
3. Other natural-language requests go through Luna `/v1/gm/turn`; if Luna cannot reduce them to a legal built-in command, the client requests a Sol referee proposal instead of silently accepting a made-up effect.
4. The `gpt-6.1-sol` referee uses **medium reasoning effort** and returns exactly one schema-conforming proposal. It does **not** roll, award loot or set damage/dinosaur states.
5. `applyRefereeProposal(previousState, proposal, originalCommand)` validates all proposal fields and the current situation, **then** rolls with the existing seeded Year Zero-inspired `check` and updates world state. It records accepted proposals, dice rolls and resulting events in ordinary persistent history.
6. Once the mechanics finish, the existing narrative route can retell **only those events**. AI narration cannot edit their outcome.

### Strict typed proposal

```json
{
  "kind": "distract",
  "target_id": "utility",
  "resource_id": "paperweight",
  "rule_id": "mobility",
  "expected_turn": 0,
  "expected_location": "control",
  "rationale": "A loose metal paperweight can be thrown toward the service corridor.",
  "clarification": ""
}
```

Only known `kind` options are accepted; every field is required; unknown fields or unrecognized targets are rejected. The `expected_turn` and `expected_location` must match the current world to block stale proposals. A GM cannot supply arbitrary delta/state patches, teleportation, damage amounts, dice values or skill bonuses.

### Current typed capabilities

| Kind | Rule | Inputs | Engine consequences |
| --- | --- | --- | --- |
| `investigate` | observation, Wits + Observation | authored local observation, object, item or feature | Spend a turn and roll; report only local scene facts supported by scenario |
| `distract` | mobility, Agility + Mobility | real loose throwable or held noncritical item, plus an adjacent destination | Spend/consume resource; check determines whether noise lands remotely or exposes the player locally; use noise origin for dinosaur hearing |
| `barricade` | mobility, Strength + Mobility | usable local obstacle and adjacent exit | Roll; consume obstacle and potentially create 1–2 durability barrier that can slow pursuing dinosaur; player opening passage removes it |
| `conceal` | stealth, Agility + Mobility | present cover-capable prop | Roll and set player hidden based on actual success; predator remains separately authoritative |
| `clarify` | unknown | no IDs | Ask for clarification; no changes, rolls, or time cost |

**Scope warning:** These are four general capabilities (plus refusal), not unlimited free-form reality rewriting. In particular, multi-stage requests (e.g., grab a wrench, throw it, hide, then run) are not automatically bundled into one turn. The GM must ask to split them until we define compound action costs and phase timing. There are no persistent invented NPCs or emergent new objects yet.

### Room affordances

`src/scenario.mjs` now declares two mundane grounded props in each of seven locations, typically one cover/barrier and one loose throwable (e.g., rolling cabinet + paperweight in control, tool cabinet + wrench in the maintenance shed, fallen log + loose stones in jungle). Each has a stable ID and allowed `uses`. Consumed props are persisted in `improvisation.usedProps`; successful barricades have limited durability in `improvisation.barricades`.

A legacy v005 saved game without `improvisation` remains valid and is upgraded the next time a referee action is accepted.

The safe player-visible `view()` exposes nearby props, legal exits and the player's own barricades, **not** offscreen dinosaurs or RNG. AI models see only this filtered context, plus player input; they cannot discover concealed dinosaur locations from the engine.

## What to try after manually redeploying the Worker

From the initial control room:

- `I throw the metal paperweight into the service corridor to make a distraction.`
- `I wedge the rolling cabinet across the passage to the service corridor.`
- `I hide behind the rolling cabinet.`
- `I investigate the control consoles for signs of tampering.`

Or in the maintenance shed:

- `I throw the loose wrench toward the jungle service path.`

You can still use `look`, `move lobby`, `take keycard`, `use generator` and other fixed engine commands with no added AI overhead.

**AI status check:** Cloudflare `GET /v1/gm/status` must return version `006`, with `models.adjudicate = "gpt-6.1-sol"`. An older version 004 Worker can continue to support parsing/narration but cannot adjudicate. The browser warns **UPDATE WORKER** in that case.

**Cloudflare dashboard copy:** [Full current Worker source](https://raw.githubusercontent.com/Diabolicdonut/Dinosaur-Horror-RPG/main/worker/index.mjs). Replace the previous code in existing `dinosaur-rpg` Worker and deploy. Existing secrets `OPENAI_API_KEY` and `GAME_TOKEN` stay in Cloudflare. No new binding is required.

### Debugging and replay

`EXPORT DEBUG` includes the user input, proposed ruling, validation verdict, die-roll events, updated state, RNG seed, consumed objects, and barricades. The action journal stores the **accepted proposal**, because a seeded local simulation cannot reproduce a nondeterministic LLM response from the seed alone. Deterministically replay by reapplying the recorded proposals.

Strict engine validation takes priority over the AI's confidence. A rejected proposal never mutates the state. Network errors leave the action uncommitted. Existing local gameplay remains functional if Cloudflare is down.

## Follow-up limitations / acceptance gates

- Compare actual model judgments, chosen IDs and clarification behavior against real scenarios in-browser after Cloudflare redeploy. Mock tests alone do not prove real API availability or useful judgments.
- Compound actions, attack tactics, improvised tools and persistent creative world facts require a larger validated capability catalog.
- A manual game state is held locally in the browser; a user may edit their own game state. Server authority / anti-tamper is a later milestone, especially if multiplayer is ever considered.
- The dice/stress system remains an explicitly documented prototype inspired by Year Zero/Alien RPG, not a claim of complete Alien RAW.
