# Dinosaur Horror RPG — Engineering completion tracker (009-R2)

**Proposed tracker revision:** November 12, 2026. The **formal acceptance score remains 38/100**. No existing milestone, historical save, Evolved mechanics, or Worker deployment changes.

## Two different completion metrics

The old tracker displayed only the **38% formally accepted weighted gates** plus 16 of 79 integrated developer assignments. Its binary acceptance gauge can remain static while independently tested work is merged, so the revised widget makes implementation work visible without inflating accepted gates.

- **Built ~50% (estimate):** engineering implementation coverage across the same 21-gate, 100-point roadmap. Derived from verified merged bounded assignments and audited merged partial foundations.
- **Accepted 38% (exact):** existing formal accepted milestone weight; incomplete gates earn no formal acceptance until full acceptance criteria pass.
- **Tasks 16/79:** queue assignments already Done; pending review PRs and incomplete assignments are not counted as fully done.

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

- Open PRs even with green PR-head CI: combat and NPC #119–122, Hub #135, Worker audio #137, reviewed SFX #139 and tactical viewer handoff #118.
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

This provides a more honest progress gauge without claiming that half of the product is ready to play end-to-end.
