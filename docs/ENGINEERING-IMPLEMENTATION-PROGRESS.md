# Dinosaur Horror RPG — Engineering completion tracker (009-R2)

## 2026-11-13 — Wave 1 integration acceptance: four bounded developer assignments

Four independent, source-reviewed Wave 1 PRs were brought up to the then-current accepted `main`, passed fresh exact-PR-head full `npm test`, syntax and required merge-policy checks, then were **squash-merged sequentially**. For **each exact newly merged-main SHA**, engine tests, syntax checks, and GitHub Pages deployment were independently verified:

| PR | Done assignment / scope | Exact merged-main SHA | Merged-main tests | Pages |
| --- | --- | --- | ---: | --- |
| [#141](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/141) | DHR-027 / Evolved Freeze panic aftermath resolver | `5cf94acf99962d11aa23dd87d965721dadc2fa0c` | [1036/1036](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43439591635) | [SUCCESS](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43439589809) |
| [#142](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/142) | DHR-026 / source-earned Story Point spend and replay | `173042f5cc0367578d4c6957a022f01f3ddfd6d3` | [1051/1051](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43440174770) | [SUCCESS](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43440173636) |
| [#144](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/144) | DHR-028 / pre-roll help and modifier authorization | `8f40d454dbabb736a6b8d057242526a780731d49` | [1065/1065](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43440739399) | [SUCCESS](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43440738098) |
| [#140](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/140) | DHR-077 / observer-restricted portrait and Evolved vitals UI component | `e2396f7b6311501a1abc4ba7a6627929bfd1553c` | [1075/1075](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43441328401) | [SUCCESS](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43441328097) |

**Bounded integration status:** **24 Done / 8 Ready / 47 Blocked of 79** accepted cataloged assignments. The separate source-verified engineering estimator on this queue and unchanged audited partial credits is **56.7/100 modeled implementation points (badge ~57%)**, not measured playable scope or production readiness. The **21 gate / 100 weight formal acceptance ledger remains 38 accepted** and gameplay release `009-D2 / v0.7.39` remains untouched. Future changes should retain all three separate concepts.

**Not yet runtime-connected:** DHR-027 must be wired to witnessed combat breaks and trusted turn history; DHR-026 to the authoritative Game Mother check/award transaction; DHR-028 to real pre-roll objective actions, helper consent and finite budgets; DHR-077 to an engine-visible observer projector and Party/Focus/Spectator layout with manual desktop/mobile QA. These pure/standalone pieces are merged and tested, **not end-to-end production gameplay**. The independent Hub #135 and Cloudflare/Dropbox live-media #137 remain **unmerged and on existing QA holds**. No shared Party or Worker file, legacy save, Evolved core dice resolver, accepted gate status, roadmap weight, or first-playable count was changed in Wave 1.


**Reviewed tracker revision:** November 13, 2026, on the accepted 2026-11-12 merge ledger. The **formal acceptance score remains 38/100**. No existing milestone, historical save, Evolved mechanics, or Worker deployment changes.

## Two different completion metrics

The tracker distinguishes accepted milestones from merged-work engineering coverage. The current catalog has 24 completed of 79 bounded assignments on main. Its binary acceptance gauge can remain static while independently tested work is merged, so the revised widget makes implementation work visible without inflating accepted gates.

- **Built ~57% (estimate):** engineering implementation coverage across the same 21-gate, 100-point roadmap. Derived from verified merged bounded assignments and audited merged partial foundations.
- **Accepted 38% (exact):** existing formal accepted milestone weight; incomplete gates earn no formal acceptance until full acceptance criteria pass.
- **Tasks 24/79 (30.4%):** queue assignments already Done; pending review PRs and incomplete assignments are not counted as fully done.

## Reproducible estimator

For gate g of weight w, with N linked queue assignments:

    If formally accepted: built_g = w
    Otherwise: effective_completed = number of Done tasks
                                   + sum(audited merged partial task fractions)
               built_g = w * min(0.95, effective_completed / N)
    Built points = round-to-0.1(sum(built_g))
    Badge % = round(Built points)

If an incomplete gate has no linked tasks, its computed engineering fraction is zero. An accepted gate gets full original weight. A task can inform multiple gates but counts at most once within each gate and is normalized by each gate's task count. A 95% cap reserves integration, release and scenario QA until formal acceptance. This is not measured work hours, cost, schedule, or a claim of playable feature completeness.

The estimator validates all 79 queue rows, source IDs and gate numbers before computing anything. A malformed or unavailable queue causes Built — instead of fabricated progress. Formal accepted points remain independent.

## Additional merged partial foundations

Three conservative engineering judgments reside in site-progress.json / implementation.partialAssignments:

| Task | Fraction | Verified main commit | Implemented foundation; remaining limits |
| --- | ---: | --- | --- |
| DHR-073 | 0.20 | a77fd956e536b0fc94438031a9fc741f8920d8a6 | Real adventure catalog and approved Hub prototype foundation; production Hub and launch still pending |
| DHR-078 | 0.45 | a2791e23256e9317f753f74f1fcc4bbd16ea9b9b | Approved 94/400 ambience tracks, deterministic ambience director and tests; no live Dropbox streaming |
| DHR-079 | 0.15 | f2794d627176fdb618b75f5467bb819d1f05893d | Authenticated still-image Worker gateway foundation; no source-authorized cinematic presentation or live deployment verification |

These fractions are deliberately modest, not inferred hours or arbitrary acceptance credits. They refer to code merged to main, not unmerged feature branches. When a queue row becomes Done, its partial credit is ignored automatically to prevent duplication.

## Excluded from built credit

- Open PRs even with green PR-head CI: Hub #135, Worker audio #137, and currently unmerged Evolved, character-portrait and tracker PRs. Combat/NPC #119–122 have since merged and their four completed cataloged assignments are now included in the current queue; #118 is still a nonproduction tactical reference and #139 is an integrated but unassigned reviewed SFX selector, so neither adds another Done queue row.
- Missing private Dropbox licensing, secrets or audio deployment.
- Cloudflare Worker configuration or live app operation inferred only from GitHub Actions.
- Proposals, design notes, prototype demonstrations without code-level implemented functionality.
- Duplicate credit for a single task within a gate.

## Updating the published score

1. Verify exact merged-main commit, PR and independent CI. Verify Worker/Pages/browser separately when applicable.
2. Once a bounded task is actually integrated and complete, change its row in docs/parallel-development/DEVELOPMENT-QUEUE.md to Done; the estimate recalculates.
3. For legitimate partial merged work, add/update evidence in site-progress.json with a conservative fraction, a 40-character main commit SHA and a candid reason identifying remaining limitations.
4. When a full roadmap gate passes its required acceptance, change only that gate's accepted status using the integrator's acceptance procedure. The 38% formal count then increases legitimately.
5. If source queue or evidence is invalid, withhold the implementation estimate; never guess a number.

This provides a modeled engineering-coverage gauge without claiming that 57% of gameplay is playable end-to-end. The 38% accepted weighted score remains authoritative.

## Prior PR #143 baseline — verification against the 2026-11-12 accepted main (historical)

Latest accepted baseline before this tracker: `87ecceec88cd033f092716f0d79fc19f0348c9f8`, accepted gameplay checkpoint `009-D2 / v0.7.39`. The merged `DEVELOPMENT-QUEUE.md` contains **20 Done, 12 Ready, 47 Blocked out of 79 assignments**. Four newly Done bounded tasks are DHR-014, DHR-015, DHR-020 and DHR-021, from previously independently verified PRs #120, #122, #121 and #119 respectively; source code is isolated and live offensive combat remains incomplete. The approved reference-only tactical viewer handoff PR #118 and supplemental reviewed SFX selector PR #139 are merged but are not additional cataloged Done tasks.

Running the same 21-gate weighted calculation on that queue plus the **unchanged three audited partial fractions** yields **53.0/100 engineering implementation points (badge Built ~53%)**, vs **38/100 formally accepted**. Linked task counts are weighted per gate; a task can support multiple gate denominators without increasing the number of completed assignments. The browser should display `Built ~53%`, `Roadmap 38%`, and `Work 20/79`, with explanations accessible in the expanded panel. A client-side queue fetch failure or inconsistent evidence must withhold the implementation estimate without inflating formal acceptance.

**Important:** This is a reproducible, judgment-based engineering-coverage proxy, not a calibrated percentage of playable product, hours, or deployment readiness. Its exact value will move when reviewed code is merged and corresponding queue rows are accepted; unmerged #135 Hub and #137 Dropbox Worker/audio remain excluded. Existing accepted `site-progress.json.roadmap.gates` statuses and weights, historical saves and Party/Focus/Spectator controls remain unchanged.

The current Wave 1 verification supersedes this historical 20/79 / 53.0 snapshot. The Dashboard's current primary completion estimate is sourced from the live implementation formula and the current merged queue, not this prose.
