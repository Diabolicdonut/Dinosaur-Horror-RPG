# DHR-019 — Source-bound, local NPC action proposals (#101)

**Status:** Proposed isolated worker implementation; Integration Director acceptance pending. This is a deterministic GM-side **planner**, not the NPC turn scheduler or a live gameplay change. It does not advance 009-D2/v0.7.39, alter scenario revisions or historical saves, or award any new points toward the accepted-only **38/100** roadmap score.

## Pure API and provenance boundaries

`src/npc-action-choices.mjs` exports:

```js
planNpcAction(compiledAdventure, compiledMotive, compiledLedger, {
  npcId: 'jules-marsh', beat: 1, traversableExits: ['field-camp']
})
```

- `compiledAdventure` must validate against its exact authored definition, fingerprint, revision and seed. The cast member must be active for that seed.
- `compiledMotive` is a result of `compileNpcMotiveIntent` (DHR-017): the planner reconstructs the declaration from source, traits and finite intentions and checks the entire canonical contract, including derived flags and replay identity. **A trait without its authored intention is not permission.**
- `compiledLedger` is a result of `compileNpcKnowledgeLedger` (DHR-018) created from **already-authoritatively-replayed** world frames and knowledge events. The planner reconstructs and revalidates entries, source, rooms, active actors, facts, provenance and identity rather than trusting arbitrary `knownFacts` labels. It queries `npcKnownFactsAt` for one specific NPC and an existing beat. Hearsay, remote knowledge and stale danger/distress sightings cannot become present-tense eyewitness evidence.
- `traversableExits` is an **engine-attested, room-local subset** of physically adjacent and currently passable exits at the precise beat. The planner checks each destination against the selected authored room graph; it rejects duplicates and nonadjacent/unknown rooms and canonicalizes the input for replay. It cannot independently attest that a source-adjacent exit is actually open, unblocked or safe: the authoritative engine must verify that before planning and **again at commit time**. A client- or narration-model-supplied exit list is unsafe.

A spontaneous `withdraw` is restricted to the **one source-authored `dangerResponse.exit`** and only when the NPC remains in the authored departure room. The graph alone cannot authorize a new NPC escape: `autonomy.return_route` is separately objective-triggered in the existing engine and does not grant arbitrary withdrawals. No source or save manifest is changed.

## Deterministic selection

The existing DHR-008 `npcPerceivedOptions` enumerates candidates from actual local observations, motive permissions and legal exits. DHR-019 selects the first available option in this priority order: `withdraw` for witnessed local danger and source-authorized retreat; `consider_help` for witnessed local distress; `consider_inspection` for a locally observed clue; otherwise `hold`. The underlying DHR-008 candidate order sorts eligible destinations and fact IDs for deterministic tie resolution. `hold` is always present, and neither a predator nor an encounter is compulsory.

The frozen output contains `schemaVersion:1`, the exact source binding, `npcId`, `beat`, `room`, immutable `candidates` and `chosen`, and an `npc-action-choice-v1:` replay identity. That fingerprint is **not a signature**, an authenticity token or a request to execute. Candidate fact IDs are GM-side information; do not expose the full ledger or its candidates to unauthorized players. The planner never moves an NPC, consumes time/resources, makes rolls, spawns animals, inflicts harm, heals a colleague, executes inspection, records a turn or changes an encounter.

## Limits for successor work

Even after the planner recompiles a source-consistent DHR-018 ledger, it **cannot establish that a caller's claimed frames truly came from committed gameplay**, that movement triggers occurred, that the distressed actor suffered a valid Evolved injury, or that a claimed observation passed a source-faithful passive sighting roll. Source consistency is not replay authenticity. A higher-trust GM/executor must reconstruct these events from committed history, verify current actor/condition and world obstacles, and check Evolved time, action economy, permissions and control modes again at commit. DHR-020 owns scheduler/time; DHR-021 owns finite resources. This standalone planner is not wired to the browser or Worker, and no full human NPC autonomy or combat parity is claimed.

## Verification

`tests/npc-action-choices-dhr019.test.mjs` covers seed-quiet versus predator-present settings, source-constrained retreat, blocked/missing exits, local eyewitness vs reported/expired warnings, seeded clues, genuine colocated distress, disabled authored intentions, objective-only return-route separation, false rumors, deterministic replay, forged identity/fingerprint/world provenance, extra effect fields, historical rev10 save integrity and Party/Focus/Spectator control modes. Its synthetic world frames deliberately exercise the pure library contract **without** claiming actual live Evolved perception-roll authentication.

Run `node --check src/npc-action-choices.mjs`, `node --check tests/npc-action-choices-dhr019.test.mjs`, `node --test tests/npc-action-choices-dhr019.test.mjs`, and `npm test`. PR-head CI is to be reported separately; manual graphical and Cloudflare testing are not applicable to this otherwise-unused pure helper.
