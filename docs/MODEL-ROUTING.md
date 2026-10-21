# Model Routing Contract — Dinosaur Horror RPG

**Checkpoint:** 006
**Date:** 2026-10-20
**Status:** Primary model routing implemented; Checkpoint 006 adds Sol medium-reasoning adjudication for four validated improvised-action types. Additional complex rules remain future work.
**Authoritative runtime implementation:** `worker/index.mjs`, `MODEL_ROUTING`. Do not place secrets in this document.

## Intent

Use the smallest model that reliably performs a task while reserving excellent narrative quality and complex judgment for the demanding parts of an AI-led survival-horror tabletop RPG. None of these models replaces the deterministic game engine.

### Role assignments

| Role | Model | Reasoning | Runtime status | When called |
| --- | --- | --- | --- | --- |
| Normal movement/inventory/dice/health/raptor motion | No model | N/A | Implemented engine | Direct local commands |
| Player intent parsing | `gpt-6-luna` | none | **Worker implemented** (`/v1/gm/turn`) | Only when local parser cannot classify the request |
| Ordinary rule interpretation / rule selection | `gpt-6.1-sol` | medium | **Implemented for four bounded action types** (`/v1/gm/adjudicate`) | Investigate, distract, barricade, conceal using local scene affordances |
| Difficult rules exceptions / improvised actions | `gpt-6.1-sol` | high | **Planned** | Novel circumstances; must return engine-validated proposals |
| Moment-to-moment cinematic narration | `gpt-6.1-sol` | low | **Worker implemented** (`/v1/gm/narrate`) | After a committed material event |
| Background / unnamed NPC dialogue | `gpt-6-luna` | low | **Planned** | Minor conversations when NPC simulation is implemented |
| Significant NPC dialogue, motives, negotiation | `gpt-6.1-sol` | medium | **Worker endpoint only** (`/v1/gm/dialogue`); not yet wired to NPC simulator | Important roleplay scenes |
| Storybeat proposals, journal and continuity checks | `gpt-6.1-sol` | medium | **Planned** | Chapter transitions or major discoveries; never continuous background mutation |
| Hard edge cases and conflicting rulings | `gpt-6-astra` | high | **Reserved, opt-in only, not automatically called** | Explicitly approved escalations or developer testing |

### Why

**Luna** can classify bounded inputs cheaply and quickly. **Sol** is the primary GM for roleplay nuance, descriptions and reliable reasoning. **Astra** is deliberately **not** used during normal gameplay: it has higher output price and can introduce latency during real-time play.

This is an initial design policy, subject to measured eval results. If Luna interpretation proves unreliable, replace it with Sol low. If Sol low narration lacks richness, test medium; keep the engine's output facts immutable regardless.

## Current Cloudflare Worker behavior

One direct-paste, self-contained source file supports:

- `/v1/gm/turn` → Luna / reasoning none
- `/v1/gm/narrate` → Sol / reasoning low
- `/v1/gm/dialogue` → Sol / reasoning medium
- `/v1/gm/adjudicate` → Sol / reasoning medium (engine-validated proposals)

All output is Structured Outputs JSON schema through the Responses API. Requests specify `reasoning.effort` and a per-role response token budget. The model is selected **on the server**, not through a client-requested model field. Missing secrets return 503 and the GAME_TOKEN remains mandatory.

The `OPENAI_MODEL` single-model configuration is superseded. For special deployments, the Worker optionally reads these **nonsecret** environment variables:

- `GM_MODEL_TURN`
- `GM_MODEL_NARRATE`
- `GM_MODEL_DIALOGUE`
- `GM_MODEL_ADJUDICATE`

Only `gpt-6-luna`, `gpt-6.1-sol`, and `gpt-6-astra` are permitted for these settings. Never expose a user-facing model selector that directly controls API billing without a server-side policy.

For Cloudflare's direct editor install, **no additional variables are needed**: the default model routing is compiled into `worker/index.mjs`, and the only secrets remain `OPENAI_API_KEY` and `GAME_TOKEN`. The optional Wrangler config mirrors those defaults for Git-driven deployment.

A code commit to GitHub does **not** update an already-pasted Worker. Manually redeploy revised `worker/index.mjs` in the existing Cloudflare editor.

## Performance and spending rules

- Do not send obvious engine-native commands through an LLM.
- Limit the AI's view to the minimum valid perception, canonical rule excerpt and useful NPC context.
- Avoid separately calling the narrator for trivial map/inventory/status reads.
- Favor one focused adjudication call followed by one narrative call for complex actions rather than multiple contradictory adjudicators.
- If narration fails, show authoritative engine events immediately; never replay or re-roll a committed action.
- Only retry a *noncommitted* AI proposal, with bounded attempts; store accepted adjudications in the event journal.
- Treat output token budgets, API-rate limits and OpenAI spending alerts as distinct mechanisms; none alone guarantees a hard monthly cost ceiling.
- Do not call Astra automatically as a fallback on every Sol timeout or parse error.
- Do not send the user's private PDFs or entire novel-length rules through every call. Extract permitted canonical rule definitions into retrieval-friendly rule IDs and cite local rule IDs, not page-sized prompts.
- Model availability depends on the configured OpenAI API project and may require account billing/tier access. Live model calls have not been verified.

### Official model references and standard prices (as of 2026-10-20)

Source: https://developers.openai.com/api/docs/pricing

| Model | Input / 1M tokens | Output / 1M tokens |
| --- | ---: | ---: |
| `gpt-6-luna` | $0.10 | $0.50 |
| `gpt-6.1-sol` | $2.00 | $10.00 |
| `gpt-6-astra` | $10.00 | $50.00 |

Standard, short-context prices before any caching, processing mode, or regional adjustment. Not guaranteed future prices.

## Validation plan

- Unit test route → model/effort mappings and that clients cannot choose a higher-priced model.
- Verify `reasoning.none` is not sent to Sol or Astra.
- Test structured output compatibility with a live key once Cloudflare has been manually redeployed.
- Benchmark 30 realistic dinosaur-horror turns across clear intent, ambiguous intent, quiet exploration, panic, NPC dialogue and rule exceptions. Compare error rate, 95th-percentile latency, token cost and narrative coherence.
- Add typed rule effects for exception adjudication *before* turning on the Sol referee. AI proposals alone cannot change state.

## Checkpoint 006 boundary

The new `/v1/gm/adjudicate` endpoint proposes exactly one typed action and never directly changes state. The engine validates the action against the player's known scene and executes dice and consequences, storing the accepted proposal in the journal. Medium reasoning is the default. High reasoning and Astra are not enabled automatically, and full improvisational scope is explicitly not yet supported. See [Referee contract](REFEREE-CONTRACT.md). Live model request quality/latency remains to be evaluated after the user manually deploys Worker v006.
