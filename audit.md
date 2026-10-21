# Dinosaur Horror RPG — Engineering audit

## Checkpoint 005 — 2026-10-21

**Report:** User typed “Check outside the window” in the control room. Opening-room description repeated, no apparent response. User supplied a full redacted checkpoint 004 diagnostic file.

### Root cause proven by the diagnostic file

- Game was at seed 1993, turn 0, room `control`.
- Worker was **online and authenticated** (v004 status request HTTP 200); OpenAI was **actually responding**.
- Intent parsing HTTP 200 (~2255 ms): `{"action":"look","target":"window","push":false,"rule_id":"observation"}`.
- Engine emitted only `SCENARIO.rooms.control.description`, with `accepted:false`, unchanged turn/RNG.
- Browser narrator gated on `result.accepted` and therefore never attempted narration.
- Failure was an **unimplemented targeted observation and overly narrow narrative eligibility condition**, not an OpenAI/Cloudflare configuration problem.

### Changes

- `src/scenario.mjs`: authored location-specific static observations for each of the 7 rooms (rain-streaked control-room window, consoles, radio, reception, exhibits, maintenance door, generator, jungle, gate, beacon, etc.). No unseen predator positions or unsupported plot facts exposed.
- `src/engine.mjs`: support `look <target>` and close English variants without AI, resolve target against visible authored `observations`, suggest local inspectable targets on unknown requests, and return `narratable:true` for resolved free observations. **`accepted` remains false for free actions by design**; no time, dice, inventory, stress or dinosaur movement changes.
- `src/app.mjs`: send available inspection IDs to AI for intent resolution, display **INSPECT** quick actions, and trigger AI narration when either a time-consuming action was accepted or a free observation was resolved.
- `tests/engine.test.mjs`: four additional regression tests (exact AI window object, natural inspection phrases, no remote predator leakage, and receipt of item state after pickup), total suite expected **38 tests**.
- README and state controller updated; no Cloudflare Worker code touched in this checkpoint.

### Validation / boundaries

- Automated GitHub Actions run for regression tests completed successfully at commit `02ddb8c030c22fe9c5eada63938beedc1dd1c32e`.
- GitHub Pages auto-publication and live post-fix AI narration have **not** been independently browser verified.
- This is a focused fix, **not** a generic arbitrary-action GM adjudicator: only authored observation targets resolve; unknown targets receive a safe clarification rather than fabricated outcomes.
- Because the existing Worker already returned the correct `look/window` action, **no fresh manual Cloudflare paste is required**.

**Next:** `confirm-in-browser-window-observation-and-expand-perception-contract`.


## Checkpoint 004 — 2026-10-21

**User request:** Display AI connectivity/active-state, optionally remember GAME_TOKEN across future site visits, and export complete diagnostics to investigate game anomalies, including an earlier report that the introductory prompt repeated.

### Recovery and scope

- Inspected current `main`, existing browser script, HTML/CSS, Worker, engine, and checkpoint.
- Existing accepted checkpoint 003 preserved. No changes to seeded simulation mechanics.
- Existing GitHub Pages client uses a manually pasted Cloudflare Worker; commits to GitHub do not automatically refresh that Worker.

### Implemented

- Cloudflare Worker `GET /v1/gm/status`: *authenticated* no-OpenAI-call readiness check. Requires GAME_TOKEN and configured OPENAI_API_KEY; returns `authenticated: true`, selected model names, `model_call_verified: false`. A successful status check intentionally does **not** claim that OpenAI API inference has succeeded.
- Browser AI indicator with explicit disabled, missing token, checking, gateway authorized, model responded, failed states. Explicit **TEST AI CONNECTION** action; timing/status/error recording. 404 tells user to deploy newer Worker.
- GAME_TOKEN can be remembered **only with explicit opt-in** in browser localStorage, not in GitHub public HTML, game saves, or diagnostic reports. **FORGET SAVED TOKEN** erases the local copy.
- Auto-recovery of a valid autosave from localStorage on page load prevents unintended return to opening narrative, and player command echoes distinguish ignored actions from introduction.
- New `src/diagnostics.mjs`: bounded action/session log, model requests/responses and HTTP statuses, browser errors, redaction, deterministic full game state, scenario and rules config. **EXPORT DEBUG** downloads a separate report, leaving **EXPORT SAVE** available for the engine save.
- New `docs/DEBUGGING.md`, README updates, tests and CI syntax checks.

### Validation

- Expanded test suite to **34 tests**: engine behavior, Worker authentication/readiness, safe exports, UI control bindings.
- GitHub Actions validation runs automatically on main. (Do not equate mocked gateway tests with live OpenAI availability.)
- No live credential or GAME_TOKEN values accessed, recorded or committed.
- Live browser/Worker end-to-end integration **not yet verified** here. User needs to deploy updated `worker/index.mjs` in Cloudflare before testing `/v1/gm/status`.

### Next action

`manual-worker-refresh-and-first-debug-export-smoke-test`


## Checkpoint 003 — 2026-10-20

**Scope:** Assign current OpenAI API models to each Game Master role and implement server-controlled routing without changing the existing deterministic engine.

### Applied

- Official OpenAI model catalog/pricing checked for `gpt-6-luna`, `gpt-6.1-sol`, `gpt-6-astra` and supported Responses API reasoning efforts and Structured Outputs.
- `worker/index.mjs` routes player intent to Luna (`none`), narration to Sol (`low`), and the provisional NPC dialogue endpoint to Sol (`medium`).
- Server-side model override allowlist is limited to these three verified models. Client-provided requests cannot choose an arbitrary model. A Sol/Astra override of Luna's route automatically increases reasoning effort from `none` to `low`, avoiding unsupported API settings.
- Per-route output token budgets replace one global cap.
- `worker/wrangler.jsonc` updated to use the three route-specific model defaults rather than legacy `OPENAI_MODEL`.
- `docs/MODEL-ROUTING.md` records current routes, planned referee model, opt-in only Astra, pricing, costs, limitations and validation.

### Automated validation

- Added four model-routing tests in `tests/worker.test.mjs`. Expected suite: **25 total tests** (10 engine + 15 Worker).
- All new Worker role-selection tests passed under GitHub Actions at `a7ff2cfee51d22a4a39637be98602f577459bd37`.
- No real OpenAI API calls, manual Cloudflare paste, or browser QA claimed. Selected GPT-6 model availability with the user's API project has not yet been verified.

### Strict boundaries

- The Worker has **no live full AI exception adjudication route**. Sol's referee responsibility is an architecture contract, not a completed feature.
- Minor/background NPC routing and Astra escalation are planned, not silently enabled.
- This source commit does **not** update the manually managed Cloudflare Worker; paste the current `worker/index.mjs` again to deploy the new model routing.

**Next action:** `manual-cloudflare-worker-deployment-verify-and-test`.


## Checkpoint 002 — 2026-10-20

**Scope:** User supplied existing Cloudflare Worker URL `https://dinosaur-rpg.diabolicdonut.workers.dev/` and confirmed Cloudflare secrets `OPENAI_API_KEY` and `GAME_TOKEN`. This checkpoint prepares the Worker integration and GitHub Pages browser client.

### Implemented

- `worker/index.mjs`: OpenAI Responses AI intent, narration, dialogue draft endpoints; strict output schemas, no persistent world mutation; exact origin allowlist, token authentication, input bounds, 24-second provider timeout, sanitized failures.
- `worker/wrangler.jsonc`: existing Worker name `dinosaur-rpg`, both secrets required, global single-player Cloudflare `GM_LIMITER` binding (30 calls per minute per location).
- `src/app.mjs`: direct HTTPS Worker endpoint, client-side runtime bearer token (not saved), typed player action mapping, unsupported-action clarification and local deterministic commands intact.
- `index.html` and `src/style.css`: password-style token input to supply personal `GAME_TOKEN`.
- `tests/worker.test.mjs`: eleven offline Worker mock tests, covering origin, auth, strict output, upstream failures and rate limiting. Total engine + gateway automated tests: 21.
- `docs/DEPLOYMENT.md` and README: instructions for connecting existing Worker to GitHub and enabling GitHub Pages.

### Validation and boundaries

- GitHub Actions validated the browser+Worker integration and 21 tests successfully at `ca578cacb52245842d84a65812a7666188b7cfaf` and subsequent source-only documentation changes.
- **Cloudflare deployment is not claimed.** Only GitHub has been modified. The existing `workers.dev` URL could still contain the Hello World starter.
- **Live OpenAI calls are not verified.** No server-side Cloudflare credentials or API key contents were read.
- Full AI rules-exception adjudication and canonical persistent NPC conversation are **not** implemented: the current Worker deliberately refuses to invent effects the engine cannot validate.
- `GAME_TOKEN` is a single personal bearer credential. CORS alone is not authentication; rate-limiting is not a guaranteed spending cap.

**Next action:** User connects the existing Worker to GitHub Builds (branch `main`, root `worker`) and enables GitHub Pages. Then confirm `/health` and browser interaction.


## Checkpoint 001 — 2026-10-20

**Scope:** Stand up the user's new `Diabolicdonut/Dinosaur-Horror-RPG` GitHub repository with an initial personal-use *Jurassic Park* cinematic survival-horror prototype.

### Repository recovery

- Original repository was verified to exist and to be empty at the beginning of implementation.
- No earlier source, history, checkpoints, or accepted progress were overwritten.
- Privately uploaded reference PDFs were located in Library. *Year Zero Mini* v1.1 was machine-readable; the large *Alien RPG* PDF is primarily image-based, so a detailed rules-as-written comparison is explicitly deferred rather than fabricated.
- Neither rulebook has been committed.

### Implemented

- Data-isolated 1993 Isla Nublar scenario with seven connected sectors, access gates and objective flags.
- Browser command interface, tactical sector map, health/stress indicators, event log, save/load/export.
- Seeded deterministic simulation with persistent items, a persistent raptor, dice, stress and simplified panic/evasion.
- Optional localhost OpenAI Responses gateway for bounded intent parsing and post-resolution prose.
- Node test harness, 10 unit/scenario checks, GitHub Actions workflow.
- Rules contract and source/reference limitations documented in `docs/RULES-BASELINE.md`.

### Validation

- First GitHub Actions run: `39462538286`, **completed: success** at commit `16d3c4e71067f2efdc5e5482cce93034e1be88c8`.
- The workflow runs `node --test` and `node --check` on source modules.
- No live OpenAI API test was performed: the user has not supplied or configured an API key, which must never be committed.
- No in-browser click-through test has yet been performed. Initial acceptance means source and automated engine tests passed, not that every UI/browser interaction was visually verified.

### Known gaps / next work

1. Browser smoke test and visual QA.
2. Exact Alien dice, push and panic mechanics comparison to source and revise deviations deliberately.
3. Species-specific hearing, visibility, scent, pursuits, attacks, injuries and survival.
4. End-to-end walkthrough tests that establish an achievable player path and fail/escape rates across many seeds.
5. Establish optional remote AI hosting and optional GitHub Pages publication (static-only game works without AI).

**Next action:** `browser-smoke-and-canon-rules-audit`
