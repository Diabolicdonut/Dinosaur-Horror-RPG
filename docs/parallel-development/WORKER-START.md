# Dinosaur Horror RPG — Worker Chat Start / PR Contract

Use this template to begin a **new, separate GitHub-connected developer chat**. Change only `ISSUE_NUMBER` and the linked issue. A worker must not work on several assignments simultaneously.

## Copy/paste worker instruction

> Continue Dinosaur Horror RPG development in `Diabolicdonut/Dinosaur-Horror-RPG`, using the live GitHub `main` as authority.
>
> **Your only assignment is [GitHub issue #ISSUE_NUMBER](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/ISSUE_NUMBER).**
>
> Before editing anything, inspect current `main`, `AGENTS.md`, `project-state.json`, `site-progress.json`, `audit.md`, `docs/ROADMAP-COVERAGE.md`, `docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md`, `docs/parallel-development/DEVELOPMENT-QUEUE.md` and the issue-specific authoritative rules/contracts. Verify the issue is **Ready** and all predecessors are accepted/merged. Reconcile with any newer accepted `main` and do not roll back accepted features.
>
> Create a fresh branch `work/dhr-ISSUE_NUMBER-<short-name>` from the latest `main`. Implement **only the issue's bounded scope**, including deterministic tests for normal, invalid, replay, seeded/historical cases as applicable. Coordinate shared files by avoiding unrelated changes. Do not invent published rule text; keep Evolved dice and no-compulsory-encounter doctrine. Do not publish copyrighted Free League rulebooks or scenarios, secrets, or private Game Mother facts.
>
> Run `npm test`, applicable syntax checks, and any additional targeted checks. Do not claim manual graphical/Cloudflare verification without real evidence. Preserve historical adventure versions/save fingerprints, player knowledge boundaries, three control modes and existing roadmap progress.
>
> Commit on **your own branch** and open a PR to `main` that links the issue and contains a concise scope summary, changed files, tests/CI, regression proof, risks, migration notes and pending manual QA. **Never push gameplay directly to main, merge your own PR, apply `safe-auto-merge`, or update the 38/100 whole-product acceptance score.** The integration director handles merged-main validation, roadmap/state/audit updates and acceptance.
>
> Finish by giving me the PR link, exact branch, tested results and any blockers. Do not proceed to other issues until I assign them.

## Current evidence and limits

- Gameplay checkpoint as of queue creation: **009-D2 / v0.7.39**, 665 accepted baseline regression tests, 18 weighted scope gates with **38/100** accepted points.
- GitHub workflow tests may run additional tests following queue setup; baseline numbers are historical evidence rather than a guaranteed count of any worker's new commit. The first wave added CI verification, a carried-weapon validator, an NPC options policy and security regressions without changing accepted gameplay checkpoint or percentage.
- **One code worker per source module** when integration collisions are plausible. **Completed first and second waves:** #67/#80 CI, #69/#79 secrecy, #73/#77 weapon validator, #74/#78 NPC policy, #70/#89 Evolved audit, #72/#88 historical save fixtures, #83/#87 NPC motives, #75/#90 finite ammo. **Next recommended wave:** #81 melee, #82 ranged, #84 NPC observation/provenance, #85 Worker security. Distinct pure source modules, no shared core modifications without a separate integration issue.
- Integrating code PRs is **reviewed**, not authorized for automatic merging. `safe-auto-merge` is the special docs-only opt-in and **must not be applied to gameplay PRs**.
- DHR-001 / #67 is integrated and has independent merged-main Actions/Pages success. Its new bot-merge dispatch path still requires a live docs-only auto-merge proof; never enable broader gameplay auto-merging merely because that CI change merged. Gameplay PRs remain explicitly reviewed.
- If tool access to live GitHub or a needed private Evolved reference is missing, stop without fabricating commits, tests, or rule details and report a concrete blocker.

## Integration Director's repeatable review

1. Review issue/PR exact scope, current main baseline, changed files and peer edit conflicts.
2. Verify Evolved-source correctness and physical/saved-world causality, no copyrighted copied text, no secrets and historical fingerprints.
3. Verify PR-head CI/test evidence, no unexplained branch protection bypass or new blocker.
4. Merge using approved branch-protected procedure; **independently verify merged-main Actions and Pages/Worker as applicable**. GitHub Actions token-trigger caveats require special care.
5. Only once a gameplay milestone is accepted, synchronize `audit.md`, `project-state.json`, `docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md`, `docs/ROADMAP-COVERAGE.md`, `site-progress.json` and `README.md` as appropriate. No new accepted gate percentage until all of its acceptance criteria pass.
6. Close the corresponding issue, update dependency status and dispatch the next no-conflict batch.

The goal is indefinite **original replayable** Cinematic and Campaign adventure variety using a deterministic source-faithful rules engine—not a single scripted scenario or a compulsory 3-act/dinosaur-attack sequence.
