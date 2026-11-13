# DHR-026 — Cinematic Story Point spending (pure, source-grounded proposal)

**Issue:** #115. **Authority:** privately supplied *ALIEN RPG — Evolved Edition*, Story Points p. 44 and GM guidance p. 158; the accepted DHR-025 earning implementation, referencing p. 27. No private source pages or tables are reproduced.

## What the source permits

In Cinematic play, spending one earned Story Point gives one base die in a skill check a success. It may occur before or after pushing, but cannot retroactively rewrite an already-committed check or its downstream effects. A highest-severity stress response still blocks the check even if a base die succeeds. Cinematic Story Points are not Campaign XP and cannot be invented by a client-supplied character-sheet number.

This module is an isolated **GM-side proposal/replay contract**. Neither historical saves, the Evolved dice engine, the browser/Worker, accepted story awards, nor the current roadmap score are modified.

## Functions and data

- **resolveStoryPointSpend(compiled, state, awardJournal, checkJournal, request, spendJournal?)**
- **replayStoryPointSpends(compiled, state, awardJournal, checkJournal, spendJournal?)**

All contracts are pure. The saved world must be a validated, source-bound, seeded Cinematic Party incident. The award journal must pass the **original DHR-025 replay validator**. Only entries with one credited point contribute spendable currency; opening character-sheet balances, capped zero-credit recognitions, future earned points, XP and discretionary cross-adventure transfers are excluded. Credited awards become available no earlier than the committed end of their own act.

The **checkJournal** is a trusted engine-owned sidecar, with the envelope {schemaVersion:1, source, entries}. Each entry has these exact fields: id, actorId, ownerId, source, beat, status, character, options, roll, appliedSpend. Status is either open or committed. The character snapshot and seeded options reconstitute the baseline check with the accepted Evolved resolver, including every die, push, stress response and RNG draw. Open checks must match the current real actor and live beat. Historical committed checks retain their actor-at-roll snapshots in the trusted register.

The **request** must have exactly checkId, actorId, ownerId, timing, dieIndex. Timing is before or after. It must match the actor and authenticated human owner of the **open check receipt**, not a guessed client balance or another party member's check. Spectator players cannot spend, and Focus players can spend only for the focused character. An expenditure consumes the earliest eligible unused award receipt for that character. Each check and each credited award receipt can be used only once.

Each accepted result returns a copied entry, preview, balanceAfter and new journal. Spending entries are exact, source-bound and ordered; replay reconstructs the adjustment and balances from the original trusted check and award evidence. A committed check must carry a byte-for-byte equivalent appliedSpend record (or null for no spend). A modified historical entry or missing expenditure therefore fails replay instead of rewriting a committed check.

For **after** timing, a nominated nonsuccessful base die in the final pool is changed to six; stress dice, stress responses, existing push rolls and draws are left intact. For **before** timing, the existing Evolved check resolver performs the seeded before-push expenditure with its actual altered push RNG. That resolver currently supports base-die index zero only in this mode; all other before-push indices are rejected instead of guessing at the new dice stream. Attempting to spend on a die already showing a success is refused. These are implementation restrictions, not invented source rules.

## Integration/security boundary

**The check register is trusted input, not a user-authentication mechanism.** A client could manufacture a plausible seeded check if permitted to replace the entire register. The eventual server-owned Game Mother must authenticate the actual human and their control of this actor; establish legitimate checks from real world, skills, equipment, action budget and provenance; maintain an immutable check register and a signed/otherwise authenticated journal; and commit the corrected check, expenditure, and resulting world effects **atomically**. Do not make the check register or hidden world facts available to the player, and never accept client-authored check records as authority.

The current skill lab exposes a direct story-point option backed by raw character-sheet balances. It remains a laboratory only; runtime integration must not expose that flag directly. World-state effects, stunts, opposed outcomes, stress consequences and injuries must be resolved or recomputed before commitment, not patched after. Source validation is still needed for transfers between adventures, discretionary sacrifices, new before-push die selection and multi-point-per-check flows.

## Regression evidence and handoff

The focused tests cover an actual Long Count act-end award after a genuine optional risk, before/after-push dice, actor/owner authorization, point conservation, forged earning/check/spending journals, seed and fingerprint tampering, duplicate spending, check commitment and historical replay, spectator/focus modes, unearned opening balances, future awards and old Nublar save compatibility.

Run npm test, node --check src/story-point-spending.mjs and node --check tests/story-point-spending-dhr026.test.mjs, then confirm exact PR-head Actions. Manual browser, Cloudflare and merged-main checks remain Integration Director work. No accepted roadmap progress is claimed or updated.
