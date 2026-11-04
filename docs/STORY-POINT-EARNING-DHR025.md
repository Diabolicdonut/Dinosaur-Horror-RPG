# DHR-025 — Source-grounded Cinematic Story Point earning (pure contract)

**Issue:** #91 · **Roadmap gate:** 7 (still partial; accepted score remains **38/100**).
**Edition authority:** Private *ALIEN RPG — Evolved Edition* pp. 27 (Personal Agenda), 44 (Story Points), 158 (GM's Story Point assessment). Only rule pointers and original implementation appear here; no licensed rulebook text or tables are included.

## Source decision

- A Cinematic personal agenda is assigned to a particular character/seat and act. At the act boundary, actual advancement under personal risk or meaningful sacrifice is eligible for **one** Story Point. A character cannot hold more than **three**; recognition while already at three is journaled with zero credit, never an illegal fourth point.
- A **Campaign** session's agenda-related risk/sacrifice instead grants an **experience point**, per p. 27. It is **not** interchangeable with a Cinematic Story Point. DHR-025 does not implement campaign XP or assume a generic campaign event may mint Story Points.
- A remaining Story Point carried to another Cinematic adventure is an optional, separately adjudicated transfer (p. 158), **not** a universal cross-adventure balance migration. Spending is assigned to DHR-026 / #91's successor and remains outside this resolver.
- No optional cinematic scene, handout, objective, risk encounter, or play mode is compulsory.

## Narrow executable evidence

New GM-only pure functions in `src/story-point-earning.mjs`:

`resolveStoryPointAward(compiled,state,{actorId,agendaId,cardId,risk},journal?)`

`replayStoryPointAwards(compiled,state,journal?)`

A reward **proposal** requires a full, currently validated, versioned/seeded Party save and exactly the matching source fingerprint. The actor's seat and act must have an actual seeded, source-authored agenda plus **that seat's Story Card**; the Story Card's source trigger must be a successfully committed scene or objective **by the same actor**. Its act must be finished according to committed objective-gated act progression (or a completed final act). Generic handouts, free narration, remote witnesses, unrelated scene claims and future objectives are not evidence of advancement.

The same actor must also have undertaken an **engine-committed, source-defined physical peril** or been attacked by a real, seeded, local predator, **in the same room and act on a strictly earlier recorded beat than the triggered achievement**. Eligibility derives from verified world journals; the caller cannot supply an ad-hoc risk boolean, name a nonexistent hazard, or use a remote character's experience. A risk-free scene or a merely plausible intention earns nothing. A source card is used as a conservative authoring connection between the agenda and the witnessed action; this is not an AI semantic inference from agenda prose.

The result contains a proposal and a separate source-bound award journal. Replay recalculates proof, act timing, one-award-per-seat-per-act, per-actor balances, cap and every existing entry. Changes to source seed/fingerprint, actor, timing, risk source, credit or receipt structure fail closed. No RNG is consumed and no field is added to existing saves. An absent journal is a valid empty ledger for old saves; historical fingerprints are unmodified.

## Limits and integration handoff

This bounded proof recognizes **documented physical risk** only. Other meaningful sacrifices (lost resources, reputational or moral costs) need a trusted, typed consequence/provenance journal before they can be rewarded automatically. A Story Card without a same-act local risk is intentionally insufficient, and existing story cards do not cover every authored agenda. GMs may decline to award for an otherwise eligible event; the pure function is an upper-bound proposal, not a replacement for real GM judgment. Its deterministic identity is **not cryptographic authorization** against an attacker replacing an entire local save and its replay origin. Future secure server-owned referee state must authenticate input before calling it.

**No browser command, Party action, character sheet balance, campaign XP, spending roll, actor transfer or adventure package** was modified. DHR-026 and later runtime integration must distinguish opening held points, award receipts and spends before changing a player balance. Do not silently backfill rewards into old incidents or expose hidden GM criteria in player views.

## Verification contract

`tests/story-point-earning-dhr025.test.mjs` exercises an actual authored Long Count seat 0 / first-act Story Card after physically attempting its optional peril and completing its source-committed act objective; contrasts no risk, delayed risk, premature award, spoofed actors/IDs/locations/seed/fingerprint, replay edits, duplicates, source cap, modes and legacy Nublar saves. The fixture uses a quiet predator seed and a real nervous-herd risk: **no compulsory fight is introduced**. Run `npm test` plus syntax checks and confirm exact PR-head CI. Manual graphical and Cloudflare QA are outside this standalone module; the Integration Director owns merged-main verification and roadmap acceptance.
