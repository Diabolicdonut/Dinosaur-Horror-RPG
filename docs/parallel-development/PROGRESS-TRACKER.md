# Development status tracker — accepted gates and partial worker progress

This document governs the additional **execution progress** layer on the existing in-game status popover. It does **not** change the accepted roadmap, historical `009-D2 / v0.7.39` gameplay checkpoint, saves, engine mechanics, or any previously earned point.

## Three intentionally distinct views

1. **Roadmap accepted** — the authoritative `site-progress.json.roadmap.gates` weights total **100**. Only gates marked `accepted` earn their entire weight. The current score is **38/100** and remains unchanged by subtask completion. A `partial` gate contributes **zero** unearned points.
2. **Development execution** — a distinct bar showing the number of `**Done**` DHR assignments in [DEVELOPMENT-QUEUE.md](DEVELOPMENT-QUEUE.md), divided by the **79** currently approved bounded tasks. At the widget's initial publication it was **12/72 (16.7%)**. After the 2026-11-12 Integration Director integration wave the accepted queue is **20/79 (25.3%)**, with 12 ready and 47 dependency-blocked; these numbers are loaded live from the committed queue and are not fixed in the widget. They are not equal slices of project effort or finished gameplay functionality.
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

The 79 approved task rows now read **20 Done / 12 Ready / 47 Blocked**. Only four newly verified cataloged DHR tasks (014, 015, 020, 021) were promoted to Done; DHR-016/#145 is now Ready. Independent prototype #118, 94-track ambience #136, and supplementary reviewed SFX selector #139 do not add completed cataloged DHR tasks or earn full 21-gate acceptance. Hub #135 and Worker audio #137 remain held. **Execution 20/79 (25.3%) is not the approved weighted roadmap 38/100.**
