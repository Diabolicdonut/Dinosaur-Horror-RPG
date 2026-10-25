# 009-B2a — Data-Driven Objective Transitions

**Scope:** staged migration toward an adventure-independent Year Zero / Alien Evolved-derived engine. This checkpoint does **not** complete the two-scenario gameplay gate.

## Data and boundary

- Source: `src/adventure-objectives.mjs`, taking an already-validated compiled AdventureInstance.
- Caller must provide an actual *deterministic engine-authorized successful action*. This is an internal contract, not user text or a model instruction. The service does not decide whether a skill applies or perform a roll.
- It checks that the survivor is alive, able to act and physically in the authored objective room; prerequisites have already been committed; and the objective is not duplicated.
- Only manifest-declared `flag` and `end` effects commit, transactionally. The generic outcome is `completed` or `abandoned`; the legacy rescue user interface translates it to `rescued` or `lost` when necessary.
- A new optional `objectiveRecords` sequence checks valid actors, physical rooms, monotonic beats, prerequisite completion, committed effects and single occurrence. Legacy saves without records retain previously achieved positive flag effects.
- Different adventures may have entirely different objectives; the domain service does not know `generator`, `radio`, `beacon`, `helipad` or research survey locations.

## Scope fence

Existing Nublar feature→objective mapping and Evolved skill rolls remain in the transitional Party scenario handler. The independent research-survey sequence is tested only against the domain service and is not yet playable in Party/Focus/Spectator modes. No model-generated text can directly perform an objective. No changes to legacy solo or Cloudflare Worker.

## Validation

Retain the accepted 478 regressions and add sixteen targeted objective tests. Require exact final PR checks plus merged main Actions/Pages and separate hands-on desktop/mobile graphical smoke. Do not claim a 494/494 result until GitHub reports it.

## Next

009-B2b must introduce an explicit selected AdventureInstance in Party saves and action dispatch, remove remaining authored scene/creature/NPC ownership from the shared rules engine and prove full end-to-end runs for both structurally distinct scenarios. Then proceed to seeded replay variation, procedural Cinematics, continuing Campaigns and bounded AI Game Mother.
