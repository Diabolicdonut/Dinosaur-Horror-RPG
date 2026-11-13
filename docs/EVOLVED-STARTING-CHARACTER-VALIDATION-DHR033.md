# DHR-033 — Source-grounded starting-character legality audit

**Scope:** GitHub issue #95. Independent Character Lab / start-roster validator only; no talent activation, XP advancement, character UI, gameplay core, save fingerprint, Worker, or roadmap acceptance changes.

## Primary authority and boundaries

Compared directly against the privately provided *Alien RPG — Evolved Edition*, Core Concepts **printed pp. 24–27** (standard character creation, attributes, skills, talent and equipment), Careers **pp. 31–39**, and existing project authority at `docs/EVOLVED-RULES-AUTHORITY.md`. The private rulebook is **not** copied into the public repository.

| Creation feature | Source-supported starting contract | DHR-033 treatment |
| --- | --- | --- |
| Career | Career determines key attribute, three key skills and initial career talent options | Retain nine **original Jurassic Park-adapted** careers and existing pairings. Only own, listed career IDs are selectable; reject invalid explicit careers instead of silently randomizing them. |
| Attributes | Standard point-buy: 14 points across four attributes; values 2–4, with career key allowed 5 | Preserve established caps and exact sum. Reject missing, extra, inherited, array-like, and coercible-string/boolean values on imported/manual starter sheets. |
| Skills | Twelve core skills; starting budget 10; career skills max 3; others max 1; any untrained skill remains attemptable | Preserve sums, noncareer training, and caps. Reject extra/unknown named skills, missing ratings and nonnumeric payloads even when the twelve recognized skills total 10. |
| Talent | Choose one initial career talent from three | Preserve existing **original park** talent list and its single selected field. Reject outside-career/unknown choices, without claiming published talent effects or implementing triggered abilities. |
| Derived stats | Resolve and max Health derive from their respective attribute pairs (round up), subject to applicable talent exceptions | Preserve existing calculated fields for the supported starting park talents. No additional book talent modifiers fabricated. |
| Equipment | Cinematic opening gear comes from the authored adventure; campaign starter gear comes from the career | Preserve the Character Lab's **existing park-specific two distinct eligible items** solely as a game adaptation. It is **not a universal Evolved starting gear quantity**. Do not award extra inventory/reloads/cash without the appropriate scenario or campaign authority. |
| Modes and saves | Starting allocations remain the same regardless of later player-vs-AI control choice | Reuse `validateCharacter` / `validateParty` in existing launch and save checks; no schema or historical fingerprint revision. |

The published book additionally offers a **separate optional random attribute method**, android character rules, and an **optional life-path method**. The current deterministic generator uses the *standard point-buy allocation only* and cannot claim to implement those alternatives. These variants should be introduced through separate explicitly authorized procedures and tests, not accepted as loosely typed exceptions to the standard validator. Original park roles have thematic skill/talent/gear mappings; their exact fictional content is not a transcription of the published careers.

## Failure inventory and minimal corrections

Before this patch, `validateCharacter` computed legal totals using only known keys, allowing extraneous attribute/skill ratings to travel through imports. It also coerced strings, booleans and some arrays to numbers. An untrusted career such as `constructor` could reach inherited object properties and throw rather than produce a validation error. `generateCharacter` and `makeParty` replaced invalid *explicit* career choices with a random legitimate career. Those cases were separately captured in `tests/starting-character-validation-dhr033.test.mjs` before the corrections.

DHR-033 makes structural validation require exactly four own attribute ratings and twelve own skill ratings with numeric integers, rejects inherited and surplus schema values, guards career choices using own-key membership, and freezes static career option arrays against accidental mutation. The same validator continues to allow an ordinary manually authored character with no generator metadata. Existing generated sheets, hybrid locks, original park equipment limits, roster IDs, accepted saved incidents and seeded generation behavior are unchanged.

The validation protects starting sheets and imported drafts; it **does not** claim to authenticate arbitrary runtime advancements or prove provenance of a legitimately shaped but maliciously rewritten save. A trusted runtime state/replay signature and GM/XP authority must be designed separately. JSON duplicate-property names that have already been collapsed by `JSON.parse` cannot be recovered by downstream object validation. Incoming roster JSON is not itself a newly implemented file-import UI.

## Regression evidence and integration handoff

`tests/starting-character-validation-dhr033.test.mjs` covers nine legal park careers, forged/missing/extra allocations, coercible numeric types, prototype-name career forgery, explicit career list errors, invalid starting talent/gear, impossible locked hybrid skills, deterministic replay, manual-import compatibility, and unchanged Party/Focus/Spectator save-mode handling.

**Integration Director:** Review the PR against latest `main`, source authority and any concurrent DHR-029 talent work. Confirm exact PR-head `npm test` plus syntax GitHub Actions, and review historical Party save/selected adventure tests. Do not merge until reviewed; no gameplay-core wiring, manual graphical sign-off, or accepted roadmap progress is asserted by this bounded validator fix.
