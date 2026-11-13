# DHR-029 — Source-bound Evolved talent runtime authorization

**Issue:** #94. **Scope:** standalone pre-roll Game Mother-side validation only. No Party UI, combat module, Worker, character creation, dice algorithm, scenario fingerprint, save schema, roadmap ledger or accepted gameplay path is modified.

## Authority and exact bounded subset

Primary reference: the user's private **Alien RPG — Evolved Edition** PDF, printed **Talents pp. 48 and 50**, combat action/reaction rules **pp. 60–65** and medical recovery **pp. 68–71**. Source mechanically confirmed again against the user's Library on 2026-11-13. The names below are **original park-themed adaptations** already defined in `src/characters.mjs` and `src/evolved-checks.mjs`; their mechanics are not copied as book text.

| Park talent | Authorized context | Dice effect | Physical / timing prerequisite |
| --- | --- | --- | --- |
| Hard to Catch | Mobility / dodge | +2 base dice | Genuine unconsumed pending attack on the actor; quick reaction remains |
| Emergency Treatment | Medical Aid / first aid | +2 base dice | Living, broken patient in same room; actor capable; full action in combat |
| Trauma Specialist | Medical Aid / surgery | +2 base dice | Actual untreated surgery-requiring critical injury, same-room living patient, carried medical bag/medkit; full action in combat |
| Keep It Together | Command / rally | +2 base dice | Living broken other survivor in the room; quick action in combat |

For surgery, requiring a **physically possessed medical kit** is a conservative Dinosaur Horror implementation authorization constraint, **not** a new published numerical modifier. Actor gear must match the original source-bound character. In exploration, the acting survivor must own the turn. In combat, this module checks the original action budget via the existing `spendActionBudget` routine, but does **not** commit its returned budget.

The role of this sidecar is **authorization**, not applying new effects. The unmodified Evolved check resolver already awards the exact +2 dice under these contexts. After validation, this module uses that same resolver and compares its result to a no-context baseline. Stress dice, reroll rules and original RNG remain unchanged. The returned roll is a deterministic **preview** only.

## API / integration contract

`authorizeTalentActivation(compiled, state, registry, principal, request, journal?)` returns `{accepted:true, entry, preview, journal}` or `{accepted:false,reason}`. `replayTalentActivations(compiled,state,registry,journal?)` re-derives the exact result.

**Trusted inputs** are essential:

- `compiled`: validated adventure compiled at the original incident seed/revision/fingerprint.
- `state`: authentic private Game Mother Party world, including the original saved `startingRoster`, real target condition and physical location, pending defense, action budgets, current beat/RNG, control epoch and actor.
- `registry`: **engine-owned** immutable pending-check registry `{schemaVersion:1, source:{adventureId,revision,fingerprint,seed}, entries:[...]}`. A check includes exactly `id,actorId,ownerId,beat,actionIndex,controlEpoch,skill,context,targetId,cost,seed,status`. `status` must be `open`; its seed must equal the current world RNG, and its context/skill/action cost must match this module's source-bounded trigger.
- `principal`: **server-authenticated** `{kind:'human'|'gm',id}`. This is a trust assertion supplied by server logic, **never** a client-editable JSON parameter. In Party a human can act for their eligible turn; in Focus only the selected actor; in Spectator only the GM controller. The camera does not change this.
- `request`: player/agent proposal with exactly `actorId,talent,checkId,ownerId,expectedBeat,expectedActionCount,expectedControlEpoch`. No bonus, arbitrary skill, effect, action cost, seed or success field is accepted.

**Replay:** the optional journal is a strict, source-fingerprinted **same-world-frame** sidecar; its single entry is recomputed from the current trusted check and character. Duplicate activation, a second pending check in the same frame, altered dice, stale action count, switched control epoch, tampered bonus and later-beat retroactivation are rejected. The old save never acquires a required field. An integration wanting multi-turn replay must archive and validate the authoritative historical world/check snapshots before advancing the clock; **do not** pass a later world frame as if it were the earlier one.

**Important security boundary:** the server must establish the authenticity and immutability of the Party save, starting roster, registry and authenticated principal. This module cannot prove that a client-supplied *entire* save or GM principal was not forged, and a supplied check registry is not proof a dramatic event actually occurred. The GM must independently register genuine actions/attacks/treatments. It must atomically consume the reserved action, commit the seed/dice, and retire the check with the world step; otherwise a preview must not be represented as a playable effect.

## Outside scope and still unimplemented

No talent effects are added for the other **23** park talents. In particular, no automatic grants for Park Authority, Negotiator, Experienced Tracker, Rapid Orders, second-push abilities, Familiar Controls, resources, panic/attack redirection, death-roll revisions, ammunition savings, creature discoveries or post-check talents; their independent Character Lab behaviors remain untouched. No campaign-earned talent advancement or more than one talent on an active character is asserted; starting allocations/legality are owned by **DHR-033**. No signed event log, final atomic runtime wiring, cross-round reservation, free-action interception, real action-budget commit, independent human NPC talent advancement, or authenticated web identity is claimed.

## Validation and integration

`tests/evolved-talent-authorization-dhr029.test.mjs` checks four legal triggers, genuine attack reaction, forged requests, target condition/gear/position, combat quick-action depletion, Party/Focus/Spectator and GM ownership, duplicate/modified replay and historical serialized Nublar/Long Count/Tidal Nursery saves. It additionally asserts the module and test syntax. Run `npm test`, `node --check src/evolved-talent-authorization.mjs` and `node --check tests/evolved-talent-authorization-dhr029.test.mjs`.

The **Integration Director** must review/merge, then later wire only **trusted** pending engine checks to this API and commit actual world budgets/dice in one authorized transaction; compare it with DHR-028 cooperation and DHR-026 Story Point ordering, protect historical save provenance, and perform browser QA. This bounded PR is **not** acceptance of full Evolved parity or a change to either progress percentage.
