# Dinosaur Horror RPG — Parallel Development Queue v9

**Snapshot:** 2026-11-13 latest verified Wave 2 main `774a07ef960cb8f3486ec0466d73c17ec2c2c784` · accepted gameplay 009-D2/v0.7.39 unchanged · 1116/1116 main tests, syntax + Pages success · **28/79 Done, 4 Ready, 47 Blocked** · estimated engineering **58.4/100 (Built ~58%)**, 21 roadmap gates and formal acceptance ledger unchanged.

**Authority and precedence:** This queue is subordinate to `docs/ROADMAP-COVERAGE.md`, `docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md`, `docs/EVOLVED-RULES-AUTHORITY.md`, `AGENTS.md`, and current accepted `main`. The historical accepted checkpoint and 38/100 progress are **not** changed by creating assignments. Do not copy private Free League rulebooks or official scenarios into the public repository.

## 2026-11-13 — Wave 2 integration: four independently merged bounded assignments

The Wave 2 Integration Director reviewed current `main`, relevant issue contracts, code diffs and source-authority documentation, refreshed each isolated PR against the immediately preceding accepted `main`, and squash-merged sequentially only after fresh green PR-head `node-test` plus `auto-merge-policy`. Each **exact newly merged-main commit** independently passed complete `npm test`, syntax checks and GitHub Pages build/deploy:

| PR | Catalogued assignment and bounded scope | Exact main SHA | Exact-main tests | Pages |
| --- | --- | --- | ---: | --- |
| [#149](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/149) | DHR-002 — 36-case desktop/mobile graphical QA **framework**; graphical cases remain `NOT_RUN` | `acc0887b79c15afa035785f6db689f7ba251c334` | [1093/1093](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43454185948) | [SUCCESS](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43454185543) |
| [#150](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/150) | DHR-005 — 21 runtime coupling points and prioritized migration design, **not a generalized engine** | `58310d40b85757018adb4dd334eb7da7cb0bb13b` | [1097/1097](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43454775169) | [SUCCESS](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43454771701) |
| [#148](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/148) | DHR-033 — source-grounded starting character/skill/career validation and forged-input rejection | `ebad229c7539a130464297fc058000544ee77c84` | [1106/1106](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43455442194) | [SUCCESS](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43455441202) |
| [#151](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/151) | DHR-029 — four legal, source-reviewed talent-trigger **pre-roll authorization** paths; not live use | `774a07ef960cb8f3486ec0466d73c17ec2c2c784` | [1116/1116](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43456123245) | [SUCCESS](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43456124001) |

**New accepted catalog counts:** **28 Done / 4 Ready / 47 Blocked, out of 79 bounded assignments**. The separate source-derived, 21-gate weighted engineering model yields **58.4/100 estimated implementation points** (**Built ~58%** displayed) from those integrated queue rows and unchanged three previously audited partial foundations. This is an **engineering-coverage proxy, not tested playable product fraction or release readiness**. The original formal 21-gate acceptance ledger, saved source fingerprints, Party/Focus/Spectator controls, Cloudflare Worker and gameplay `009-D2 / v0.7.39` are unchanged.

**Unresolved integration:** DHR-002 documents the browser/mobile QA that still must be performed, not a completed graphical pass; DHR-005 proposes migration tasks, not a migrated shared runtime; DHR-029 remains a source-verified sidecar pending engine-owned check registry/atomic action authorization; DHR-033 fixes starter validation but does not add campaign advancement or all special cinematic equipment. Hub [#135](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/135) remains held on actual browser/save-mode QA; Worker/Dropbox audio [#137](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/137) remains held on deployed OAuth/secrets, authentic `206` Range streaming and real device listening. These unrelated held PRs are **not** merged or silently credited.

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

## Prior integration evidence — 2026-11-12

Six independently reviewed PRs were squash-merged **sequentially** onto current main after fresh up-to-date required checks (`node-test` and `auto-merge-policy`). Each exact merged-main revision subsequently passed engine tests, syntax checks and GitHub Pages deployment.

| PR | Bounded scope (not whole-gate completion) | Exact merged-main SHA | Main tests |
| --- | --- | --- | --- |
| [#119](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/119) | DHR-021 finite NPC resource proposal | `e867de82b1b45ab4ea44a2f9b1e946856aecbdf8` | 951/951 |
| [#120](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/120) | DHR-014 creature injury and conditional withdrawal | `58d433872f336998dab23eb38457b0e74a8f694d` | 964/964 |
| [#122](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/122) | DHR-015 multi-round Evolved combat adapter | `c9b9819ca936d23e4a0ee82a467d5ec7cc6c6789` | 981/981 |
| [#121](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/121) | DHR-020 finite NPC initiative reservations | `9f34249633d4f805e9c81af3724e4a5220c4aa49` | 995/995 |
| [#118](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/118) | Tactical SVG viewer **reference only** | `2c0c29385881d6a44dea38dc7ad768d010b5e4db` | 995/995 |
| [#139](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/139) | Reviewed deterministic dinosaur SFX chooser **not playback** | `f16727f1052601e6019468aaddf256d60dfa9693` | 1013/1013 |

All had zero failures. Final independent [main engine run](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43357342431) and [replacement Pages deployment](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/43357342072) both succeeded. An earlier final-commit Pages run was cancelled/replaced and is not counted as successful. Cloudflare builds do not prove real Dropbox streaming.

**Execution only:** Four newly completed *cataloged* tasks DHR-014, 015, 020 and 021 raise bounded completed assignments to **20/79 (25.3%)**. The reference-only #118 handoff and supplemental #139 selector are *not* additional DHR queue tasks. The original 94/400 selected ambience from merged #136 remains a partial MEDIA foundation. [DHR-016 / issue #145](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/145) is newly Ready; DHR-022 remains blocked until DHR-016 is integrated.

**Holds:** [PR #135](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/135) needs actual desktop/mobile Hub browser and historical Party save QA; [PR #137](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/137) needs authenticated deployed Cloudflare OAuth/Dropbox, real 206 streaming/listening and rights verification. Both remain **unmerged**. Source PR CI cannot prove either. No live offensive combat, autonomous NPC tactical effects, production tactical map or Dropbox audio is claimed. **Accepted weighted roadmap stays 38/100 across 21 gates**, historical checkpoint **009-D2/v0.7.39**, foundation **5/8** and saves unchanged.

## Work distribution

- **Completed and integrated:** **28** bounded DHR assignments after verified Wave 2: #149 (DHR-002 QA framework), #150 (DHR-005 coupling audit), #148 (DHR-033 character legality) and #151 (DHR-029 talent authorization) add four to the accepted Wave 1 **24/79** baseline. These bounded modules and documents do **not** establish live full-system graphical QA, universal scenario independence or end-to-end talent invocation.
- **Ready after Wave 2:** **4** catalogued assignments: DHR-016/#145 (real offensive combat runtime), DHR-030/#114 (remaining rules parity), DHR-073/#126 (Hub, PR #135 held pending real graphical QA) and DHR-078/#131 (audio, PR #137 held pending live Worker/Dropbox playback). Coordinate existing owner locks before dispatch; acceptance of DHR-002/005/029/033 as bounded tasks does not unblock unrelated graph dependencies without their true runtime requirements.
- **Dependency-blocked:** **47** tasks (43 original plus four presentation assignments). DHR-016 is now Ready based on merged DHR-012/014/015; actual offense must still be wired across selected adventures. DHR-022 remains blocked by real DHR-016 runtime acceptance (despite accepted DHR-020/021 foundations).
- **009-R2 presentation track:** The 79-task catalogue and 21-gate weighted roadmap remain fixed. Reference-only tactical handoff #118 is merged; #135 Hub shell remains unmerged pending browser and historical save QA. #136's 94-track ambience selector is merged, and #139 reviewed SFX selector is merged as a separate bounded adjunct; neither proves production media. PR #137 Worker audio remains unmerged pending genuine live authorization/deployment/listening.
- **Integration Director:** review gameplay PRs, verify branch CI and independent exact merged-main Actions/Pages, preserve historical saves and three modes. The docs-only `safe-auto-merge` label **never authorizes gameplay auto-merge**. No fractional whole-game gate credit.
- **Cloudflare Worker caveat:** Green GitHub Actions/Pages and Workers build checks do not prove Cloudflare production OAuth secrets, current GAME_TOKEN/GM_LIMITER, Dropbox permission, signed Range playback, or media rights. PR #137 is held until these are tested end-to-end on actual live deployment; never treat CI fakes as real playback.
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
| DHR-002 | **Done** | 17 | — | Desktop/mobile graphical QA evidence matrix | [#68](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/68) |
| DHR-003 | **Done** | 12,18 | — | Adversarial GM-secret and player-view leakage regressions | [#69](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/69) |
| DHR-004 | **Done** | 7 | — | Document source-grounded Evolved parity gaps | [#70](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/70) |
| DHR-005 | **Done** | 10 | — | Audit Nublar-specific Party/UI coupling seams | [#71](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/71) |
| DHR-006 | **Done** | 10,18 | — | Historical save + seeded replay fixture suite | [#72](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/72) |
| DHR-007 | **Done** | 8 | — | Pure carried-weapon schema and validator | [#73](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/73) |
| DHR-008 | **Done** | 9 | — | Pure source-bounded NPC perception/option policy | [#74](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/74) |
| DHR-009 | **Done** | 8 | DHR-007 | Finite ammunition and stock conservation | [#75](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/75) |
| DHR-010 | **Done** | 8 | DHR-007 | Source-valid melee attack resolver | [#81](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/81) |
| DHR-011 | **Done** | 8 | DHR-007 | Source-valid ranged attack resolver | [#82](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/82) |
| DHR-012 | **Done** | 8 | DHR-011 | Actual range, cover and visibility for shots | [#102](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/102) |
| DHR-013 | **Done** | 8 | DHR-010, DHR-011 | Carried armor and critical damage integration | [#103](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/103) |
| DHR-014 | **Done** | 8,16 | DHR-013 | Injured dinosaur response and grounded retreat | [#110](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/110) |
| DHR-015 | **Done** | 8 | DHR-010, DHR-013 | Reusable multi-round Evolved combat action economy | [#111](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/111) |
| DHR-016 | **Ready** | 8,10 | DHR-012, DHR-014, DHR-015 | Offensive combat across Long Count and Tidal Nursery | [#145](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/145) |
| DHR-017 | **Done** | 9 | DHR-008 | Validated finite NPC motives and intentions | [#83](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/83) |
| DHR-018 | **Done** | 9 | DHR-008 | Witnessed-knowledge/rumor provenance ledger | [#84](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/84) |
| DHR-019 | **Done** | 9 | DHR-017, DHR-018 | Bounded motive-aware NPC alternative chooser | [#101](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/101) |
| DHR-020 | **Done** | 9 | DHR-019 | NPC exploration/combat action budgets | [#112](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/112) |
| DHR-021 | **Done** | 9 | DHR-019 | NPC finite gear and resource choices | [#113](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/113) |
| DHR-022 | Blocked | 9 | DHR-016, DHR-020, DHR-021 | NPC genuine Evolved tactical defense/help/flee | Not opened |
| DHR-023 | Blocked | 9 | DHR-022 | NPC injuries and legitimate medical response | Not opened |
| DHR-024 | Blocked | 9,10 | DHR-020, DHR-022, DHR-023 | NPC agency parity across two adventures | Not opened |
| DHR-025 | **Done** | 7 | DHR-004 | Source-grounded Story Point earning | [#91](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/91) |
| DHR-026 | **Done** | 7 | DHR-025 | Source-grounded Story Point spending | [#115](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/115) |
| DHR-027 | **Done** | 7 | DHR-004 | Stress/panic consequence parity | [#92](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/92) |
| DHR-028 | **Done** | 7 | DHR-004 | Help/cooperation and modifiers parity | [#93](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/93) |
| DHR-029 | **Done** | 7 | DHR-004 | Talent legality and triggered effects | [#94](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/94) |
| DHR-030 | **Ready** | 7 | DHR-013 | Clinical injury conditions and real medical clocks | [#114](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/114) |
| DHR-031 | Blocked | 7 | DHR-029 | Career experience and advancement | Not opened |
| DHR-032 | Blocked | 7 | DHR-026, DHR-027, DHR-028, DHR-030, DHR-031 | Full adopted Evolved regression parity audit | Not opened |
| DHR-033 | **Done** | 11 | DHR-004 | Legal starting career/skill creation rules | [#95](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/95) |
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
| DHR-073 | **Ready** | 19,10,13 | — | UI-01: production Hub shell and real scenario preview catalog, no demo data masquerading as playable | [#126](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/126) |
| DHR-074 | Blocked | 19,11,2 | DHR-073 | UI-02: safe validated Party/Focus/Spectator launch bridge and briefing | [#127](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/127) |
| DHR-075 | Blocked | 19,10,18 | DHR-073 | UI-03: multi-slot historical save archive, strict import/export/migrations | [#128](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/128) |
| DHR-076 | Blocked | 20,17,18 | DHR-073; PR #118 | UI-04: engine-authorized read-only Level-2 Map and fog/LOS | [#129](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/129) |
| DHR-077 | **Done** | 20,7,11,17 | — | UI-05: compact portrait Health/Stress ECG renderer and detail access | [#130](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/130) |
| DHR-078 | **Ready** | 21,12,16 | — | MEDIA-01: rights-aware curated audio catalog and bounded director | [#131](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/131) |
| DHR-079 | Blocked | 20,21,12,18 | DHR-073; source-visible presentation contract | MEDIA-02: source-gated scene images and optional full-screen FMV | [#132](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/132) |

## Parallelism and acceptance rules

1. **One issue per worker chat.** The issue is the scope. Worker reads and obeys `docs/parallel-development/WORKER-START.md` before making changes; no work outside that scope without a new issue.
2. **Disjoint files first.** First wave DHR-001, DHR-003, DHR-007 and DHR-008 is integrated. Recommended next four independent modules/areas: DHR-009 ammunition conservation, DHR-017 NPC motive contract, DHR-006 save fixtures, DHR-004 Evolved parity audit. Shared authority documents and accepted ledgers are Integration Director-only.
3. **Dependencies are blocking.** A task is Ready only when each numbered predecessor has been merged and validated. Issue assignment does not mean features are implemented. Cross-module integration happens in later explicitly named tasks.
4. **Immutable history and truth.** Do not modify frozen historical adventure revisions, replace Evolved dice with generic probabilities, leak hidden GM truths, force every dinosaur encounter into combat or silently mutate supplies and geography. A generated scenario's facts must be fixed and verifiable.
5. **PR proof.** Include test commands, exact PR-head result, new tests, happy/failure/forgery/replay cases, save migration impact, UI evidence if applicable, and pending manual checks. Never claim hands-on browser tests without doing them.
6. **No phantom percentage.** Full 21-gate weights earn credit only when an entire gate is accepted with verified evidence. Partial subtasks remain partial and do not alter 38/100.
7. **Release means complete bounded vision.** The dependency chain ends at DHR-072 only when rules, creative GM, adventure variety, infinite viable original generation, campaigns, security, three modes and desktop/mobile quality pass all source-defined criteria; it does not mean a fixed quota of dinosaur species.

## How to start

Copy the template in [WORKER-START.md](WORKER-START.md) into a **new GitHub-connected developer chat**, substituting the assigned issue number. **Newly unblocked: [DHR-016/#145](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/145)** for real offensive combat across the two authored adventures, on its own feature branch. Coordinate with active developers before any shared Party-runtime edit. Other unclaimed Ready work includes #68, #71, #94, #95 and #114; assignments #92/#93/#115/#130 may already be underway. DHR-022 remains blocked until integrated DHR-016. Hub #135 requires browser QA before downstream UI launch/save/map dispatch, and live audio #137 stays held.
