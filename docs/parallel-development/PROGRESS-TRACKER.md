# Development status tracker — accepted gates and modeled implementation progress

## 2026-11-13 — Wave 2 integration: four independently merged bounded assignments

The Wave 2 Integration Director reviewed current `main`, relevant issue contracts, code diffs and source-authority documentation, refreshed each isolated PR against the immediately preceding accepted `main`, and squash-merged sequentially only after fresh green PR-head `node-test` plus `auto-merge-policy`. Each **exact newly merged-main commit** independently passed complete `npm test`, syntax checks and GitHub Pages build/deploy:

| PR | Catalogued assignment and bounded scope | Exact main SHA | Exact-main tests | Pages |
| --- | --- | --- | ---: | --- |
| [#149](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/149) | DHR-002 — 36-case desktop/mobile graphical QA **framework**; graphical cases remain `NOT_RUN` | `acc0887b79c15afa035785f6db689f7ba251c334` | [1093/1093](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43454185948) | [SUCCESS](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43454185543) |
| [#150](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/150) | DHR-005 — 21 runtime coupling points and prioritized migration design, **not a generalized engine** | `58310d40b85757018adb4dd334eb7da7cb0bb13b` | [1097/1097](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43454775169) | [SUCCESS](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43454771701) |
| [#148](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/148) | DHR-033 — source-grounded starting character/skill/career validation and forged-input rejection | `ebad229c7539a130464297fc058000544ee77c84` | [1106/1106](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43455442194) | [SUCCESS](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43455441202) |
| [#151](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/151) | DHR-029 — four legal, source-reviewed talent-trigger **pre-roll authorization** paths; not live use | `774a07ef960cb8f3486ec0466d73c17ec2c2c784` | [1116/1116](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43456123245) | [SUCCESS](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43456124001) |

**New accepted catalog counts:** **28 Done / 4 Ready / 47 Blocked, out of 79 bounded assignments**. The separate source-derived, 21-gate weighted engineering model yields **58.4/100 estimated implementation points** (**Built ~58%** displayed) from those integrated queue rows and unchanged three previously audited partial foundations. This is an **engineering-coverage proxy, not tested playable product fraction or release readiness**. The original formal 21-gate acceptance ledger, saved source fingerprints, Party/Focus/Spectator controls, Cloudflare Worker and gameplay `009-D2 / v0.7.39` are unchanged.

**Unresolved integration:** DHR-002 documents the browser/mobile QA that still must be performed, not a completed graphical pass; DHR-005 proposes migration tasks, not a migrated shared runtime; DHR-029 remains a source-verified sidecar pending engine-owned check registry/atomic action authorization; DHR-033 fixes starter validation but does not add campaign advancement or all special cinematic equipment. Hub [#135](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/135) was **separately merged by another integration stream** as a preview at `bfc99c5b72a8c68e9c153cd2a9bffbea425a164e` ([engine](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43457051540), [Pages](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43457050739) successful), **without live browser/save-mode QA or final UI-01 acceptance**; DHR-073 remains Ready and receives no extra queue/Gate credit here. Worker/Dropbox audio [#137](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/137) remains **unmerged and on real OAuth/Range/mobile playback QA hold**. Neither independently arrived Hub changes nor audio are part of this four-PR Wave 2 assignment acceptance.



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



This document governs the additional **execution progress** layer on the existing in-game status popover. It does **not** change the accepted roadmap, historical `009-D2 / v0.7.39` gameplay checkpoint, saves, engine mechanics, or any previously earned point.

## Three intentionally distinct views

1. **Roadmap accepted** — the authoritative `site-progress.json.roadmap.gates` weights total **100**. Only gates marked `accepted` earn their entire weight. The current score is **38/100** and remains unchanged by subtask completion. A `partial` gate contributes **zero** unearned points.
2. **Development execution** — a distinct bar showing the number of `**Done**` DHR assignments in [DEVELOPMENT-QUEUE.md](DEVELOPMENT-QUEUE.md), divided by the **79** currently approved bounded tasks. At the widget's initial publication it was **12/72 (16.7%)**. After the 2026-11-13 Wave 2 merge and queue review the current ledger is **28/79 (35.4%)**, with 4 ready and 47 dependency-blocked; these numbers are loaded live from the committed queue and are not fixed in the widget. They are not equal slices of project effort or finished gameplay functionality.
3. **Gate-level partial task status** — each expandable gate lists its mapped `Done / Ready / Blocked` task counts and a subtask completion bar (showing the present Done/Ready/Blocked numerator and denominator for each gate). Many tasks have dependencies and some contribute to **more than one gate**, so summing all gate task counts would double count work. This bar is *not* a percentage of accepted gate functionality.

### Data provenance and update procedure

The existing checked-in **Markdown queue** is the sole source of truth for execution status. The browser reads `docs/parallel-development/DEVELOPMENT-QUEUE.md` from the same GitHub Pages origin each time the page is loaded using `cache: no-store`. It does not call GitHub APIs, require tokens, or trust a client-side saved game. The widget parses strict DHR-### rows, validates the `Done`, `Ready`, `Blocked` states, uniqueness, 21-gate numeric mappings and declared task count from the separate optional `site-progress.json.execution.total` configuration. Malformed or unavailable queue data displays **Work —** rather than a guessed value; valid accepted-gate progress is still shown.

**At every integration wave:** after required reviewed code PRs, exact `main` engine tests and Pages deployment are verified, the Integration Director changes corresponding task rows from `**Ready**` to `**Done**`, unlocks direct successor rows from `Blocked` to `**Ready**`, and records PR evidence in the queue. The published tracker then updates on the next page load without manually editing a second `completed` value. A worker's open PR **does not** count as Done; automated tests passing on a PR branch alone do not justify Done.

**If the queue scope changes:** update both the authoritative task table and `site-progress.json.execution.total` in the same reviewed PR, with a test of the new denominator. Never silently divide by a guessed number or assume all tasks have equal estimated time.

**When a whole weighted gate is accepted:** only then update the roadmap gate status, authoring plan, `site-progress.json`, `project-state.json`, audit and associated accepted gameplay release evidence consistently per `AGENTS.md`. The worker tracker does not do this automatically.

### Limitations

- Task counts are **completion of bounded assignments**, not a duration forecast, engineering-hours estimate, gameplay availability claim, or weighted percent of total game implementation.
- New tasks or splits may change the 79-task denominator after explicit scope review. The accepted 100-point roadmap is stable.
- The historical first-playable foundation `5/8` is a third preexisting, deliberately separate count, not a substitute for the complete roadmap.
- Graphical browser/mobile acceptance and Cloudflare Worker deployment must still be independently performed; green GitHub Pages CI alone does not certify them.
- The tracker does not assert real-time GitHub issue or PR state; it reflects the accepted, committed queue at the time of page load.

**Regression policy:** The tracker regression tests calculate expected execution counts and gate-level task bars from the current authoritative queue instead of freezing a historical completed count. They verify that completing one available task changes its own and the corresponding gate's task display, while the accepted whole-game weight remains untouched.

### Regression coverage

`tests/development-execution-progress.test.mjs` verifies live queue parsing, overall and gate-level counts, a simulated newly completed task (progress changes without awarding 38% additional points), source failures, duplicate or tampered task IDs and invalid roadmap protection.

### 2026-11-12 execution reconciliation

At the earlier 2026-11-12 checkpoint, the 79 approved task rows read **20 Done / 12 Ready / 47 Blocked**; after Wave 1 they read **24 Done / 8 Ready / 47 Blocked** and after Wave 2 they read **28 Done / 4 Ready / 47 Blocked**. Only four newly verified cataloged DHR tasks (014, 015, 020, 021) were promoted to Done; DHR-016/#145 is now Ready. Independent prototype #118, 94-track ambience #136, and supplementary reviewed SFX selector #139 do not add completed cataloged DHR tasks or earn full 21-gate acceptance. Hub #135 and Worker audio #137 remain held. **Execution 28/79 (35.4%) is not the project's source-verified modeled engineering completion (~58%), nor the formal accepted roadmap weight.**
