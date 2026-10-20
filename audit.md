# Dinosaur Horror RPG — Engineering audit

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
