# 009-C4 — Physically Observed NPC Danger and Bounded Withdrawal

**Candidate:** October 27, 2026. **Previously accepted:** gameplay checkpoint 009-C3, v0.7.35, 626 gameplay tests; complete scope audit 009-R1, 633 tests, final main `4a181d62ef8a4c611a20a14077b930b7bc1a8a4d`, successful GitHub Actions and Pages. This is an incremental NPC agency feature, **not** full Evolved human NPC combat.

## What this actually implements

A supporting person can have a validated, purely authored `dangerResponse` with one `withdraw_on_sighting` behavior. It requires a legal adjacent exit and a bounded **Wits (2–5) + Observation (0–3)** zero-stress passive pool. On a completed exploration **roster round**, the engine independently reconstructs the location of one genuinely authored, currently seeded predatory animal from the existing source-defined patrol. Only if the predator physically occupies the NPC's room does the human roll a deterministic, independently derived d6 pool against the **existing creature Observation rating**. Human successes **strictly greater** than creature successes mean awareness and a single adjacent withdrawal. A tie or predator advantage leaves the NPC in place. No arbitrary attack, invented skill exception, new animal, GM state patch or RNG reset is introduced.

The only new scenario demonstration is the original hydrology technician **Jules Marsh**, stationed at the **River Crossing** in *The Long Count* revision 12. Jules can withdraw to adjacent **Canvas Research Camp** on a genuinely noticed local raptor encounter, and can be spoken to in the location where Jules currently stands. This changes neither of the two pre-existing characters' intended roles and preserves a truly peaceful predator-free seeded variant.

Source mechanics intentionally use the **same zero-stress ordinary d6 opposed-awareness comparison** already implemented for Evolved source detection, rather than forging a complete Evolved-valid starting character sheet for a supporting NPC. NPCs do **not** yet possess their own mechanically valid character sheets, Evolved action cards, timed injury/death states or physical weapon inventories. A human who fails to spot the predator **does not automatically receive an unearned escape**. This is a bounded *exploration-interval reaction*; it does not claim to implement an Evolved combat defense, resolve an animal attack on the NPC, or imply universal NPC safety.

## Saves and GM knowledge

- *The Long Count* immutable revision 11 is copied exactly into `adventures/ridge-survey-rev11.mjs`. Saves bound to rev1–11 do not acquire rev12's third NPC, danger-response schema or new `npcDangerRecords` journal.
- Every newer rev12 NPC observation record includes source NPC and predatory animal IDs, the genuine exploration beat, old/new adjacent locations, independently derived uint32 seed, awareness outcome and resulting `withdraw`/`hold`. The validator independently recomputes **the whole expected timeline** from the immutable manifest and game seed, then checks journal and final NPC positions for equality. Retrofitted awareness, fabricated exits, extra/missing sightings or phantom creatures fail validation.
- NPC movement updates only the character's location; no party dice, stress, health, clock or equipment is modified. Actual adjacent departure/arrival can be narrated to colocated surviving party members; a remote camera gets no secret predator location and a failed passive NPC check does not create an omniscient narration line.
- The existing browser architecture still exposes authored scenario content through inspectable source; actual confidential GM facts must move to a trusted server before claiming security.

## Acceptance and follow-on

Tests under `tests/adventure-npc-danger-009c4.test.mjs` verify seeded quiet/predator truth, passive observation win/tie/loss, real one-edge withdrawal, strict save replay, authoring rejection, historical rev11 compatibility and control-mode independence. The previous full-suite baseline is **633** after the audited roadmap, so **642** expected tests require exact-head PR CI and independent merged-main CI/Pages acceptance. Real hands-on mobile/desktop graphical smoke remains outstanding.

**Next milestones:** true, physically local human NPC Evolved initiative, defensive choices, stress, injuries, combat and resource conservation; source-equipment-limited survivor offensive combat and nonlethal retreat; further generalization of the Nublar-specific Party path. Preserve low-threat and pure wonder play; do not design the game around a compulsory monster fight or a large population/ecology simulator.
