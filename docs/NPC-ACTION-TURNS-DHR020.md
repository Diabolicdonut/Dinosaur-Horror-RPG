# DHR-020 — NPC initiative ownership and finite action reservations (#112)

**Status:** Isolated worker pull-request scope; Integration Director acceptance pending. Accepted gameplay remains **009-D2 / v0.7.39** and approved whole-product progress remains **38/100**. No historical source/save was edited.

## Purpose and API

The accepted DHR-019 planner supplies source-bound **advisory** NPC proposals, not action permissions. The new pure, nonexecuting module, src/npc-action-turns.mjs, adds a turn boundary and finite action budget **before** any future executor can act on an option. It never moves people, advances time, executes attacks, heals wounds, grants clues/items, changes saves or forces encounters.

The entrypoints are:

- **beginNpcActionTurn(compiled, ledger, boundary)**: validates the selected adventure, reconstructs the DHR-018 frame/observation ledger, and creates an immutable current-turn window for one scheduled, active, ready NPC.
- **spendNpcScheduledAction(compiled, motive, ledger, query, proposal, choice, window)**: re-runs and strictly compares the DHR-019 plan (which rechecks DHR-017 motives and DHR-018 knowledge), authorizes only a contained verified candidate in the exact current beat/room/actor, and returns an immutable new window, cost and deterministic receipt. The module commits no side effects.

## Time/initiative boundaries

**Exploration** boundary: {phase:'exploration', beat, slot, conditions}. The slot is an index into the exact sorted active-source NPC roster. The beat must match the **last** ledger frame. Each NPC receives no more than one finite ten-minute stretch reservation at that engine-attested beat. Taking an action consumes that stretch; holding ends it. This library does not advance the group/world clock once per individual NPC.

**Combat** boundary: {phase:'combat', beat, slot, round, seed, participants, conditions}. The engine-attested actual participant set and seed are rerolled through the existing seeded Evolved initiative routine. Only the selected source NPC who owns the exact numbered card can reserve actions. The inherited budget allows one full plus one quick (either order), or two quick, then ends; hold may end earlier. No unused actions roll into another turn. Rounds and new seeds are owned by the future integrated scheduler (DHR-015/DHR-022), not generated here.

**Conditions:** The boundary must supply an exact engine-attested status for each active source NPC: ready, incapacitated, or dead. Only ready can schedule actions. The pure layer does not itself diagnose wounds or resurrect anyone.

**Costs:** Source-verified withdraw reserves one quick combat action (or one exploration stretch) for the already-authorized adjacent destination; it does not change coordinates. consider_help and consider_inspection reserve one full combat action (or a stretch) with **no** automatic healing, knowledge discovery or item grants. hold ends an existing window without an effect. The closed planner vocabulary contains no attack, teleport or resource creation action. A duplicate choice kind on an unchanged world frame is rejected, including repeated free movement. Quiet exploration can choose hold and does not force a dinosaur encounter.

## Replay security and downstream integration

Source fingerprint, revision and seed, complete actor-local DHR-018 knowledge, physical room/beat and the entire selected DHR-019 candidate set are rebuilt and checked. Every previous reservation is replayed from the initial budget; forged receipts, alternate action histories, extra effects, unsupported candidates, changed initiative slot/card, source mismatch and budget inflation fail closed.

**Limit:** Pure deterministic fingerprints are **not** signatures or proof that a caller's purported frames came from actual committed gameplay. The trusted engine MUST independently attest the original world/action replay, actual Evolved observation rolls, injury state, passable exits, current beat, initiative participants/seed, and turn ownership. Never pass arbitrary model text, editable browser saves or raw user-provided frames as authority. Re-submission of an identical old valid window deterministically returns the **same reservation receipt**: an integrated executor must atomically journal that receipt, reject replays and stale snapshots, and then separately validate and commit any legal physical effect exactly once. This pure module is not yet wired to live gameplay, browser or Cloudflare. Resources remain DHR-021 scope.

## Regression and migration

New tests: tests/npc-action-turns-dhr020.test.mjs. They cover quiet play, source-limited physical retreat, time and initiative ownership, seeded replay, full/quick/end exhaustion, unknown/remote/incapacitated NPCs, forged ledger/beat/turn/plan, replayed action history, no silent state mutations, historical Long Count rev10 saves and all three control modes.

Validation: node --check src/npc-action-turns.mjs; node --check tests/npc-action-turns-dhr020.test.mjs; node --test tests/npc-action-turns-dhr020.test.mjs; npm test.

No source manifest, save schema, accepted scenario binding, gameplay release, 38/100 score, browser entry point, Worker or shared runtime was changed. Manual desktop/mobile/Cloudflare QA and real runtime condition/initiative integration remain outstanding.
