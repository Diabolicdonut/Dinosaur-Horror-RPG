# Dinosaur Horror RPG — Parallel Development Queue v1

**Snapshot:** 2026-11-03 · **Gameplay authority:** 009-D2 / v0.7.39 · **Accepted whole-product roadmap:** 38/100 across 18 gates · **Accepted baseline:** 665 game tests before GitHub automation pilot.

**Authority and precedence:** This queue is subordinate to `docs/ROADMAP-COVERAGE.md`, `docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md`, `docs/EVOLVED-RULES-AUTHORITY.md`, `AGENTS.md`, and current accepted `main`. The historical accepted checkpoint and 38/100 progress are **not** changed by creating assignments. Do not copy private Free League rulebooks or official scenarios into the public repository.

## Work distribution

- **Ready, independent launch wave:** DHR-001 through DHR-008 (GitHub issues #67–#74). Launch up to **four separate developer chats at once** initially; each takes exactly one issue and starts its own `work/dhr-###-...` branch from current `main`.
- **Blocked, already issued:** DHR-009 (#75); hold until the DHR-007 implementation has merged and passed integration.
- **Blocked future work:** DHR-010 through DHR-072. These are bounded planning assignments, **not yet GitHub issues**. Create/promote them to GitHub issues in batches when their named dependencies are accepted, never dispatch blocked work as if it were ready.
- **Integration Director:** responsible for PR review, required checks, independent post-merge `main` test/deploy evidence, save compatibility, manual QA status and coordinated roadmap/audit acceptance. Workers do not self-merge or award roadmap points. `safe-auto-merge` is restricted to the approved docs-only allowlist; gameplay PRs require explicit integration review.
- **Special gate:** Resolve DHR-001 before any extension of automatic merging to gameplay. PR #66 demonstrated labeled docs-only auto-merge and Pages deployment, but no new `main` engine-validation workflow was visible for the bot merge; PR-head tests are not equivalent to independently verified merged-main CI.

## Roadmap-mapped assignment catalog

| Queue ID | Readiness | Roadmap gates | Requires accepted | Bounded delivery | GitHub issue |
|---|---|---|---|---|---|
| DHR-001 | **Ready** | 17,18 | — | Verify bot-merge post-main CI | [#67](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/67) |
| DHR-002 | **Ready** | 17 | — | Desktop/mobile graphical QA evidence matrix | [#68](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/68) |
| DHR-003 | **Ready** | 12,18 | — | Adversarial GM-secret and player-view leakage regressions | [#69](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/69) |
| DHR-004 | **Ready** | 7 | — | Document source-grounded Evolved parity gaps | [#70](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/70) |
| DHR-005 | **Ready** | 10 | — | Audit Nublar-specific Party/UI coupling seams | [#71](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/71) |
| DHR-006 | **Ready** | 10,18 | — | Historical save + seeded replay fixture suite | [#72](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/72) |
| DHR-007 | **Ready** | 8 | — | Pure carried-weapon schema and validator | [#73](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/73) |
| DHR-008 | **Ready** | 9 | — | Pure source-bounded NPC perception/option policy | [#74](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/74) |
| DHR-009 | Blocked | 8 | DHR-007 | Finite ammunition and stock conservation | [#75](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/75) |
| DHR-010 | Blocked | 8 | DHR-007 | Source-valid melee attack resolver | Not opened |
| DHR-011 | Blocked | 8 | DHR-007 | Source-valid ranged attack resolver | Not opened |
| DHR-012 | Blocked | 8 | DHR-011 | Actual range, cover and visibility for shots | Not opened |
| DHR-013 | Blocked | 8 | DHR-010, DHR-011 | Carried armor and critical damage integration | Not opened |
| DHR-014 | Blocked | 8,16 | DHR-013 | Injured dinosaur response and grounded retreat | Not opened |
| DHR-015 | Blocked | 8 | DHR-010, DHR-013 | Reusable multi-round Evolved combat action economy | Not opened |
| DHR-016 | Blocked | 8,10 | DHR-012, DHR-014, DHR-015 | Offensive combat across Long Count and Tidal Nursery | Not opened |
| DHR-017 | Blocked | 9 | DHR-008 | Validated finite NPC motives and intentions | Not opened |
| DHR-018 | Blocked | 9 | DHR-008 | Witnessed-knowledge/rumor provenance ledger | Not opened |
| DHR-019 | Blocked | 9 | DHR-017, DHR-018 | Bounded motive-aware NPC alternative chooser | Not opened |
| DHR-020 | Blocked | 9 | DHR-019 | NPC exploration/combat action budgets | Not opened |
| DHR-021 | Blocked | 9 | DHR-019 | NPC finite gear and resource choices | Not opened |
| DHR-022 | Blocked | 9 | DHR-016, DHR-020, DHR-021 | NPC genuine Evolved tactical defense/help/flee | Not opened |
| DHR-023 | Blocked | 9 | DHR-022 | NPC injuries and legitimate medical response | Not opened |
| DHR-024 | Blocked | 9,10 | DHR-020, DHR-022, DHR-023 | NPC agency parity across two adventures | Not opened |
| DHR-025 | Blocked | 7 | DHR-004 | Source-grounded Story Point earning | Not opened |
| DHR-026 | Blocked | 7 | DHR-025 | Source-grounded Story Point spending | Not opened |
| DHR-027 | Blocked | 7 | DHR-004 | Stress/panic consequence parity | Not opened |
| DHR-028 | Blocked | 7 | DHR-004 | Help/cooperation and modifiers parity | Not opened |
| DHR-029 | Blocked | 7 | DHR-004 | Talent legality and triggered effects | Not opened |
| DHR-030 | Blocked | 7 | DHR-013 | Clinical injury conditions and real medical clocks | Not opened |
| DHR-031 | Blocked | 7 | DHR-029 | Career experience and advancement | Not opened |
| DHR-032 | Blocked | 7 | DHR-026, DHR-027, DHR-028, DHR-030, DHR-031 | Full adopted Evolved regression parity audit | Not opened |
| DHR-033 | Blocked | 11 | DHR-004 | Legal starting career/skill creation rules | Not opened |
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
| DHR-055 | Blocked | 18 | DHR-003 | Worker credentials/rate limiting and abuse tests | Not opened |
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
2. **Disjoint files first.** For first wave: DHR-001 touches only CI/build evidence, DHR-002 UX test plan/evidence, DHR-003 security regression tests, DHR-004 parity audit, DHR-005 coupling audit, DHR-006 fixtures, DHR-007 new pure weapon validation module, DHR-008 new pure NPC policy module. Shared authority documents and accepted ledgers are Integration Director-only.
3. **Dependencies are blocking.** A task is Ready only when each numbered predecessor has been merged and validated. Issue assignment does not mean features are implemented. Cross-module integration happens in later explicitly named tasks.
4. **Immutable history and truth.** Do not modify frozen historical adventure revisions, replace Evolved dice with generic probabilities, leak hidden GM truths, force every dinosaur encounter into combat or silently mutate supplies and geography. A generated scenario's facts must be fixed and verifiable.
5. **PR proof.** Include test commands, exact PR-head result, new tests, happy/failure/forgery/replay cases, save migration impact, UI evidence if applicable, and pending manual checks. Never claim hands-on browser tests without doing them.
6. **No phantom percentage.** Full 18-gate weights earn credit only when an entire gate is accepted with verified evidence. Partial subtasks remain partial and do not alter 38/100.
7. **Release means complete bounded vision.** The dependency chain ends at DHR-072 only when rules, creative GM, adventure variety, infinite viable original generation, campaigns, security, three modes and desktop/mobile quality pass all source-defined criteria; it does not mean a fixed quota of dinosaur species.

## How to start

Copy the template in [WORKER-START.md](WORKER-START.md) into a **new GitHub-connected developer chat**, replacing the issue placeholder with the specific issue number. Open up to four worker chats initially, using #67, #69, #73, and #74 for independent CI, secrecy tests, carried weapons, and NPC perception work. Add #68, #70, #71, #72 when those produce clean PRs.
