# DHR-017 — Source-bound finite NPC motives and intentions (#83)

**Status:** Proposed worker delivery only; Integration Director acceptance pending. This is a pure authoring module, **not** a runtime NPC chooser, NPC action scheduler, persistent memory system, secure hidden-GM service, or Evolved rules implementation. No accepted 18-gate roadmap points or historical source/save versions change.

## Motivation and trust boundary

The accepted adventure source already defines stable supporting-cast identities, locations, stances and authored prose motives. DHR-008 (`src/npc-perception-policy.mjs`) enumerates **possible** local, witnessed reactions from three boolean flags, but does not provide a source-binding for the flags. DHR-017 introduces `src/npc-motive-intent.mjs`: a separate, opt-in, fully validated declaration that ties such flags and a finite set of advisory intentions to an actually selected NPC in a **verified compiled adventure**. NPC motives must be explicitly authored; **do not ask an AI to infer them from dialogue or allow a narration model to submit trusted profiles**.

The new call is `compileNpcMotiveIntent(compiledAdventure, declaration)`. The `compiledAdventure` must pass `validateCompiledAdventure`, including its versioned source, content fingerprint, seed and selected variant. The `declaration` has exactly three fields:

```js
{
 source: {
  adventureId: 'tidal-nursery', revision: 2, fingerprint: compiled.fingerprint,
  seed: compiled.seed, npcId: 'mara-venn', location: 'supply-shelter',
  motive: '...', // exactly the already-authored supportingCast[].motive
  stance: 'cooperative' // exactly the already-authored stance
 },
 traits: {selfPreservation: true, aidOthers: true, curiosity: false},
 intentions: [
  {id: 'safety', kind: 'withdraw', when: 'observed_local_danger'},
  {id: 'care', kind: 'consider_help', when: 'observed_local_distress'}
 ]
}
```

The complete source tuple is compared to the matching NPC in `compiled.definition.supportingCast`. Nonexistent NPCs, seed-absent variants, a wrong scenario/revision/seed/content fingerprint, altered motive/room/stance, unknown keys and malformed prototypes all fail with `RangeError`. This verifies **consistency with source**, not the identity of the human author or the authenticity of a caller's separate world observation.

## Finite intent vocabulary

| Intention `kind` | Required authored trait | Required situational prerequisite |
|---|---|---|
| `withdraw` | `selfPreservation: true` | `observed_local_danger` |
| `consider_help` | `aidOthers: true` | `observed_local_distress` |
| `consider_inspection` | `curiosity: true` | `observed_local_clue` |

Each intention needs a unique stable slug ID and its exact corresponding prerequisite. An NPC has at most one intention per kind and at most three total. All three trait booleans must be present; an intention with a false trait is invalid. `hold` remains an implicit safe DHR-008 candidate, **not** a compulsory intent; empty intentions are legal. There is no `attack`, betrayal, teleport, combat outcome, resource grant, heal, arbitrary dialogue, or mandatory predator encounter intent. The contract stores **no execution request**.

Compilation returns immutable `schemaVersion:1`, frozen `source`, `traits`, canonical sorted `intentions`, `motiveFlags` and `identity`. `motiveFlags` activates a DHR-008 flag only when its matching intention was explicitly authored; a true personality trait alone grants no candidate. Identity includes scenario ID, revision, definition fingerprint, seed, NPC ID, and a deterministic fingerprint of the complete declared profile. Reordered intentions do not change identity. Fingerprints are **replay keys, not cryptographic signatures**. No RNG, time, saved-state mutation or NPC movement occurs.

## Integration boundaries for later workers

- **DHR-018** supplies authenticated actor-specific knowledge, its source, location, timing and rumor provenance. This module does **not** create that ledger, validate historical NPC perception checks, decide whether a rumored fact is true, or invent any witnessed facts. DHR-008 still independently requires a *trusted caller* to certify its `knownFacts` and `legalExits`. A syntactically valid but forged `observed` fact cannot be made authoritative by this module. Never pass arbitrary AI-provided facts as verified evidence.
- **DHR-019** may reconcile a compiled motive declaration with DHR-018's validated knowledge and DHR-008's finite candidates. It must check the actual source NPC, current room and beat, genuine evidence, physical legal exits, candidate priority and world changes **again at commit time**. Any selected candidate is merely a proposed action until DHR-020+ checks Evolved action time, condition, resources and control modes. Do not treat a returned `motiveFlags` object as a permission token.
- No edits to `src/adventure-supporting-cast.mjs`, `src/npc-perception-policy.mjs`, the authored manifests, historical adventure revisions, saves, browser/Worker runtime or shared ledgers were required. The existing three control modes, old fingerprints and saved action history remain authoritative. Client-distributed authored motive metadata is inspectable; confidentiality awaits trusted server state.

## Verification

`tests/npc-motive-intent-dhr017.test.mjs` covers genuine scenario cast matching; forged/remote/duplicate DHR-008 observations at the **candidate** layer; stale room/revision/seed/source mismatch; deterministic seed replay and canonical intent order; active-versus-disabled traits; invalid effects/prototypes; quiet hold-only behavior; immutable outputs; invalid compiled-world mutations; seed-conditional missing cast; historical Long Count rev10 save validity and Party/Focus/Spectator preservation. These tests **do not** claim a complete witnessed-knowledge ledger or a real NPC action scheduler. Test commands: `node --test tests/npc-motive-intent-dhr017.test.mjs` and `npm test`. Live graphical and Cloudflare smoke are deferred because this pure source contract has no UI or Worker deployment.
