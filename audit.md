# Dinosaur Horror RPG — Engineering audit

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
