# Dinosaur Horror RPG — Parallel Development Queue v5

**Snapshot:** 2026-11-04 after fourth integration wave · **Gameplay authority:** 009-D2 / v0.7.39 · **Accepted whole-product roadmap:** 38/100 across 18 gates · **Current exact merged-main validation:** 902/902 tests after 16 bounded developer subtasks. Original accepted baseline: 665 tests; accepted weighted gameplay gates unchanged.

**Authority and precedence:** This queue is subordinate to `docs/ROADMAP-COVERAGE.md`, `docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md`, `docs/EVOLVED-RULES-AUTHORITY.md`, `AGENTS.md`, and current accepted `main`. The historical accepted checkpoint and 38/100 progress are **not** changed by creating assignments. Do not copy private Free League rulebooks or official scenarios into the public repository.

## Work distribution

- **Completed and integrated:** **16** bounded tasks, including the fourth wave DHR-012/#102 (physical ranged eligibility), DHR-013/#103 (armor and human damage), DHR-019/#101 (NPC action chooser) and DHR-025/#91 (Cinematic Story Point earning). Prior completed tasks: DHR-001, 003, 004, 006, 007, 008, 009, 010, 011, 017, 018 and 055. Each developer PR passed fresh required CI and independent exact merged-main Actions/Pages. These are **bounded subtasks**, not weighted whole-project gate acceptance.
- **Ready to dispatch:** DHR-002/#68, DHR-005/#71, DHR-014/#110, DHR-015/#111, DHR-020/#112, DHR-021/#113, DHR-026/#115, DHR-027/#92, DHR-028/#93, DHR-029/#94, DHR-030/#114 and DHR-033/#95. These **12** assignments have accepted prerequisites, though they must still be coordinated for file conflicts. Start no more than four independent developer chats at a time initially.
- **Dependency-blocked:** remaining **44** planned subtasks. DHR-016 (actual offensive combat integrated across adventures) still needs DHR-014 and DHR-015 and earlier physical legality contracts. DHR-022 (NPC tactical action execution) still needs DHR-016, DHR-020 and DHR-021. No worker may skip these blockers.
- **Integration Director:** review gameplay PRs, verify branch CI and independent exact merged-main Actions/Pages, preserve historical saves and three modes. The docs-only `safe-auto-merge` label **never authorizes gameplay auto-merge**. No fractional whole-game gate credit.
- **Cloudflare Worker caveat:** DHR-055 / PR #97 altered repository Worker source and Wrangler configuration. GitHub Actions/Pages green **does not prove Cloudflare redeployment** nor a production `GM_LIMITER` binding. With `GM_REQUIRE_LIMITER=true`, a missing binding intentionally returns 503 for paid requests. Validate this operationally before claiming full security.
- **Docs-only bot-merge CI:** DHR-001's `repository_dispatch` was proven by [PR #86](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/86) and successful [merged-main engine and Pages check](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41731955040). Gameplay PRs **remain reviewed manually**.

## First-wave integration evidence

The following individually reviewed PRs were squash-merged against up-to-date branches with required PR checks, then independently verified on the exact merged `main` SHA by the engine suite and GitHub Pages:

| Worker | Pull request | Merged `main` SHA | Exact main Actions test / Pages |
|---|---|---|---|
| DHR-001 / #67 | [#80](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/80) | `b3c7f7e1c952` | [engine 41729909647](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41729909647) / [Pages 41729909484](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41729909484) |
| DHR-007 / #73 | [#77](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/77) | `9ced568937e5` | [engine 41730431908](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41730431908) / [Pages 41730430364](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41730430364) |
| DHR-008 / #74 | [#78](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/78) | `f08be0675fdc` | [engine 41730640369](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41730640369) / [Pages 41730639548](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41730639548) |
| DHR-003 / #69 | [#79](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/79) | `3016cbdad0ec` | [engine 41730924344](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41730924344) / [Pages 41730924592](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41730924592) |

No historical adventure fingerprint, functional accepted checkpoint, `site-progress.json` or the authoritative 18-gate 38/100 score was altered. DHR-001's new bot-merge-triggered dispatch path still needs an actual labeled docs-only bot-merge test; prior human `main` tests do not prove that specific new path.

## Second-wave integration evidence

Each worker PR was manually reviewed, brought up to date with the then-current `main`, passed required branch checks, and then passed **independent merged-main** engine tests and GitHub Pages.

| Worker | PR | Merged `main` SHA | Main engine / Pages Actions |
|---|---|---|---|
| DHR-004 / #70 | [#89](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/89) | `adb074f62d7e` | [engine 41755022586](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41755022586) / [Pages 41755021856](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41755021856) |
| DHR-006 / #72 | [#88](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/88) | `62691db8fa8e` | [engine 41755260164](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41755260164) / [Pages 41755259935](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41755259935) |
| DHR-017 / #83 | [#87](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/87) | `70e0a27d4ae0` | [engine 41755472842](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41755472842) / [Pages 41755472283](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41755472283) |
| DHR-009 / #75 | [#90](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/90) | `ccf554d4ef71` | [engine 41755682519](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41755682519) / [Pages 41755682213](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41755682213) |

These are isolated foundations and regression contracts: no live offensive combat, independent NPC tactical turn controller, completed Evolved parity, security certification, or universal engine parity is asserted. `site-progress.json`, the 18 weighted gate score and historical accepted gameplay checkpoint remain unchanged at 38/100 and 009-D2.

## Third-wave integration evidence

These four PRs were squash-merged in order after required green source PR-head checks and fresh up-to-date validation. Each exact merged-main commit then passed independent engine Actions and GitHub Pages deployment:

| Work | PR | Merged `main` SHA | Independent engine / Pages |
|---|---|---|---|
| DHR-018 / #84 | [#100](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/100) | `67fd38b70241` | [engine 41762749882](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41762749882) / [Pages 41762749003](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41762749003) |
| DHR-010 / #81 | [#98](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/98) | `2031177b7c39` | [engine 41762979694](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41762979694) / [Pages 41762978504](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41762978504) |
| DHR-011 / #82 | [#99](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/99) | `2ff7f5d0a01e` | [engine 41763195189](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41763195189) / [Pages 41763195106](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41763195106) |
| DHR-055 / #85 | [#97](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/97) | `b88045b4c5be` | [engine 41763474106](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41763474106) / [Pages 41763473832](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41763473832) |

**Exact last merged-main tests:** 843/843 PASS, zero failures, on `b88045b4c5be`. The combat primitives are not wired to selectable in-game attacks, NPC knowledge is not yet an autonomous action scheduler, and the Cloudflare live deployment is unverified. Historical saves, accepted 009-D2 gameplay checkpoint and 38/100 weighted whole-product score stay unchanged.

## Fourth-wave integration evidence

These PRs were manually reviewed and squash-merged sequentially after up-to-date green required status checks, then independently verified for **the exact merged main SHA** in GitHub Actions and Pages:

| Worker | Reviewed PR | Merged main SHA | Exact main engine / Pages |
|---|---|---|---|
| DHR-012 / #102 | [#107](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/107) | `fded4ce65023` | [engine 41845055322](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41845055322) / [Pages 41845053945](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41845053945) |
| DHR-013 / #103 | [#106](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/106) | `39af94e83800` | [engine 41845437013](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41845437013) / [Pages 41845436089](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41845436089) |
| DHR-019 / #101 | [#108](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/108) | `e67aba880430` | [engine 41845707537](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41845707537) / [Pages 41845705194](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41845705194) |
| DHR-025 / #91 | [#109](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/109) | `c93e876f0eb3` | [engine 41846115752](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41846115752) / [Pages 41846115572](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41846115572) |

**Final gameplay integrated-main test suite:** **902/902 passed**, zero failures, commit `c93e876f0eb3`. DHR-012/013 remain standalone physics/damage adapters, DHR-019 is a nonexecuting NPC action chooser, and DHR-025 is a pure Story Point award proposal. **Neither new attack options nor autonomous NPC actions are yet exposed in current adventure gameplay**. Do not claim full Evolved rules or accepted milestone credit. Original gameplay 009-D2 / v0.7.39, historical adventure source revisions, saves and accepted 38/100 18-gate roadmap remain unchanged.

## Roadmap-mapped assignment catalog

| Queue ID | Readiness | Roadmap gates | Requires accepted | Bounded delivery | GitHub issue |
|---|---|---|---|---|---|
| DHR-001 | **Done** | 17,18 | — | Verify bot-merge post-main CI | [#67](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/67) |
| DHR-002 | **Ready** | 17 | — | Desktop/mobile graphical QA evidence matrix | [#68](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/68) |
| DHR-003 | **Done** | 12,18 | — | Adversarial GM-secret and player-view leakage regressions | [#69](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/69) |
| DHR-004 | **Done** | 7 | — | Document source-grounded Evolved parity gaps | [#70](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/70) |
| DHR-005 | **Ready** | 10 | — | Audit Nublar-specific Party/UI coupling seams | [#71](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/71) |
| DHR-006 | **Done** | 10,18 | — | Historical save + seeded replay fixture suite | [#72](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/72) |
| DHR-007 | **Done** | 8 | — | Pure carried-weapon schema and validator | [#73](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/73) |
| DHR-008 | **Done** | 9 | — | Pure source-bounded NPC perception/option policy | [#74](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/74) |
| DHR-009 | **Done** | 8 | DHR-007 | Finite ammunition and stock conservation | [#75](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/75) |
| DHR-010 | **Done** | 8 | DHR-007 | Source-valid melee attack resolver | [#81](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/81) |
| DHR-011 | **Done** | 8 | DHR-007 | Source-valid ranged attack resolver | [#82](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/82) |
| DHR-012 | **Done** | 8 | DHR-011 | Actual range, cover and visibility for shots | [#102](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/102) |
| DHR-013 | **Done** | 8 | DHR-010, DHR-011 | Carried armor and critical damage integration | [#103](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/103) |
| DHR-014 | **Ready** | 8,16 | DHR-013 | Injured dinosaur response and grounded retreat | [#110](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/110) |
| DHR-015 | **Ready** | 8 | DHR-010, DHR-013 | Reusable multi-round Evolved combat action economy | [#111](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/111) |
| DHR-016 | Blocked | 8,10 | DHR-012, DHR-014, DHR-015 | Offensive combat across Long Count and Tidal Nursery | Not opened |
| DHR-017 | **Done** | 9 | DHR-008 | Validated finite NPC motives and intentions | [#83](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/83) |
| DHR-018 | **Done** | 9 | DHR-008 | Witnessed-knowledge/rumor provenance ledger | [#84](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/84) |
| DHR-019 | **Done** | 9 | DHR-017, DHR-018 | Bounded motive-aware NPC alternative chooser | [#101](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/101) |
| DHR-020 | **Ready** | 9 | DHR-019 | NPC exploration/combat action budgets | [#112](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/112) |
| DHR-021 | **Ready** | 9 | DHR-019 | NPC finite gear and resource choices | [#113](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/113) |
| DHR-022 | Blocked | 9 | DHR-016, DHR-020, DHR-021 | NPC genuine Evolved tactical defense/help/flee | Not opened |
| DHR-023 | Blocked | 9 | DHR-022 | NPC injuries and legitimate medical response | Not opened |
| DHR-024 | Blocked | 9,10 | DHR-020, DHR-022, DHR-023 | NPC agency parity across two adventures | Not opened |
| DHR-025 | **Done** | 7 | DHR-004 | Source-grounded Story Point earning | [#91](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/91) |
| DHR-026 | **Ready** | 7 | DHR-025 | Source-grounded Story Point spending | [#115](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/115) |
| DHR-027 | **Ready** | 7 | DHR-004 | Stress/panic consequence parity | [#92](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/92) |
| DHR-028 | **Ready** | 7 | DHR-004 | Help/cooperation and modifiers parity | [#93](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/93) |
| DHR-029 | **Ready** | 7 | DHR-004 | Talent legality and triggered effects | [#94](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/94) |
| DHR-030 | **Ready** | 7 | DHR-013 | Clinical injury conditions and real medical clocks | [#114](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/114) |
| DHR-031 | Blocked | 7 | DHR-029 | Career experience and advancement | Not opened |
| DHR-032 | Blocked | 7 | DHR-026, DHR-027, DHR-028, DHR-030, DHR-031 | Full adopted Evolved regression parity audit | Not opened |
| DHR-033 | **Ready** | 11 | DHR-004 | Legal starting career/skill creation rules | [#95](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/95) |
| DHR-034 | Blocked | 11 | DHR-033 | Selective field lock and reroll invariants | Not opened |
| DHR-035 | Blocked | 11 | DHR-034 | Hybrid independent party-member creation | Not opened |
| DHR-036 | Blocked | 11 | DHR-007, DHR-033 | Source-valid starting equipment choices | Not opened |
| DHR-037 | Blocked | 11 | DHR-033 | Character relationships and grounded backgrounds | Not opened |
| DHR-038 | Blocked | 11 | DHR-033 | Player-visible sheet and intelligible risk preview | Not opened |
| DHR-039 | Blocked | 11 | DHR-031, DHR-035 | Advancement UI and persisted roster progression | Not opened |
| DHR-040 | Blocked | 10 | DHR-005 | Extract Nublar-specific special cases safely | Not opened |
| DHR-041 | Blocked | 10 | DHR-016, DHR-040 | Shared chosen-adventure legal action adapter | Not opened |
| DHR-042 | Blocked | 10,18 | DHR-006, DHR-040 | Validated scenario save/migration/replay adapter | Not opened |
| DHR-043 | Blocked | 10 | DHR-040 | Adventure capability registry and generic dispatch | Not opened |
| DHR-044 | Blocked | 10 | DHR-041, DHR-042, DHR-043 | Three-adventure mechanical parity regressions | Not opened |
| DHR-045 | Blocked | 10 | DHR-043 | Manifest-derived narrative/capability hooks | Not opened |
| DHR-046 | Blocked | 13 | DHR-045 | Fourth distinct original authored adventure | Not opened |
| DHR-047 | Blocked | 13 | DHR-046 | Substantive seeded truths and replay branches | Not opened |
| DHR-048 | Blocked | 13,16 | DHR-047 | Alternate quiet resolutions and credible endings | Not opened |
| DHR-049 | Blocked | 13,16 | DHR-048 | Wonder, recovery and noncombat scene quality suite | Not opened |
| DHR-050 | Blocked | 12 | DHR-043 | Typed natural-language intent grounding | Not opened |
| DHR-051 | Blocked | 12 | DHR-050 | Strictly validated extraordinary-action proposals | Not opened |
| DHR-052 | Blocked | 12 | DHR-051 | Narrator constrained to committed outcomes | Not opened |
| DHR-053 | Blocked | 12,9 | DHR-024, DHR-052 | NPC dialogue with local provenance and memory | Not opened |
| DHR-054 | Blocked | 12 | DHR-050 | Model-offline/invalid-response deterministic fallback | Not opened |
| DHR-055 | **Done** | 18 | DHR-003 | Worker credentials/rate limiting and abuse tests | [#85](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/85) |
| DHR-056 | Blocked | 18 | DHR-042, DHR-055 | Trusted private GM scenario state and migration | Not opened |
| DHR-057 | Blocked | 18 | DHR-056 | Secure state/save export trust-boundary enforcement | Not opened |
| DHR-058 | Blocked | 14 | DHR-045 | Pure original generated-package contract and compiler | Not opened |
| DHR-059 | Blocked | 14 | DHR-058 | Physically reachable generated map graph | Not opened |
| DHR-060 | Blocked | 14 | DHR-059 | Solvable objectives and evidence-chain validation | Not opened |
| DHR-061 | Blocked | 14 | DHR-060 | Consistent motives, agendas and uncertainty | Not opened |
| DHR-062 | Blocked | 14,16 | DHR-059, DHR-061 | Plausible species placement, behavior, escape | Not opened |
| DHR-063 | Blocked | 14,16 | DHR-061, DHR-062 | Optional tension, wonder and relief pacing | Not opened |
| DHR-064 | Blocked | 14 | DHR-060, DHR-063 | Truthful multiple endings and fallback viability | Not opened |
| DHR-065 | Blocked | 15 | DHR-042, DHR-057, DHR-064 | Persist campaign injuries, inventory, relationships | Not opened |
| DHR-066 | Blocked | 15 | DHR-065 | Causally connected generated next episodes | Not opened |
| DHR-067 | Blocked | 17 | DHR-002 | Run and record real desktop graphical smoke | Not opened |
| DHR-068 | Blocked | 17 | DHR-002 | Run and record real mobile/touch graphical smoke | Not opened |
| DHR-069 | Blocked | 17 | DHR-002 | Keyboard and screen-reader accessibility fixes | Not opened |
| DHR-070 | Blocked | 11,17 | DHR-035, DHR-039 | Complete multi-character creation/play UI | Not opened |
| DHR-071 | Blocked | 17,18 | DHR-003, DHR-024 | Audit spectator/focus observer knowledge bounds | Not opened |
| DHR-072 | Blocked | 17 | DHR-032, DHR-044, DHR-049, DHR-053, DHR-057, DHR-066, DHR-067, DHR-068, DHR-069, DHR-070, DHR-071 | Independent whole-product acceptance and release proof | Not opened |

## Parallelism and acceptance rules

1. **One issue per worker chat.** The issue is the scope. Worker reads and obeys `docs/parallel-development/WORKER-START.md` before making changes; no work outside that scope without a new issue.
2. **Disjoint files first.** First wave DHR-001, DHR-003, DHR-007 and DHR-008 is integrated. Recommended next four independent modules/areas: DHR-009 ammunition conservation, DHR-017 NPC motive contract, DHR-006 save fixtures, DHR-004 Evolved parity audit. Shared authority documents and accepted ledgers are Integration Director-only.
3. **Dependencies are blocking.** A task is Ready only when each numbered predecessor has been merged and validated. Issue assignment does not mean features are implemented. Cross-module integration happens in later explicitly named tasks.
4. **Immutable history and truth.** Do not modify frozen historical adventure revisions, replace Evolved dice with generic probabilities, leak hidden GM truths, force every dinosaur encounter into combat or silently mutate supplies and geography. A generated scenario's facts must be fixed and verifiable.
5. **PR proof.** Include test commands, exact PR-head result, new tests, happy/failure/forgery/replay cases, save migration impact, UI evidence if applicable, and pending manual checks. Never claim hands-on browser tests without doing them.
6. **No phantom percentage.** Full 18-gate weights earn credit only when an entire gate is accepted with verified evidence. Partial subtasks remain partial and do not alter 38/100.
7. **Release means complete bounded vision.** The dependency chain ends at DHR-072 only when rules, creative GM, adventure variety, infinite viable original generation, campaigns, security, three modes and desktop/mobile quality pass all source-defined criteria; it does not mean a fixed quota of dinosaur species.

## How to start

Copy the template in [WORKER-START.md](WORKER-START.md) into a **new GitHub-connected developer chat**, replacing the issue placeholder with the specific issue number. Recommended next wave: **#110 (species-appropriate creature injury/retreat), #111 (multi-round combat turns), #112 (NPC finite action timing), and #113 (NPC finite gear)**. Ensure these workers use separate pure source modules and don't collide on shared runtime. Other Ready tasks: #68, #71, #92–#95, #114 and #115. Integration Director owns merge and release acceptance; do not dispatch blocked issues.
