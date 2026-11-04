# DHR-018 — NPC local observations, attributed reports and unknown facts (#84)

**Delivery:** Standalone source-bound deterministic primitive in src/npc-knowledge-provenance.mjs with focused regressions. Proposed for Integration Director review; not a merged, accepted gate. This feature does **not** change live gameplay, scenario versions, accepted saves, the historical fingerprints, server secrecy, or the 18-gate 38/100 score.

## Trust and authority

The pure function compileNpcKnowledgeLedger(compiledAdventure, {frames,events}) checks a full validated version/seed/fingerprint adventure compilation, then checks chronological source-grounded **world frames** and **separate knowledge events**. This is an internal Game Mother/engine-facing utility, NOT an acceptance path for model prose or client-provided facts.

Every frame is a real beat with exhaustive room positions for the *active selected-source supporting cast* and seeded source creatures, plus engine-certified distressed NPC IDs. First-frame (beat zero) positions must match compiled source, no unknown actor or creature can be inserted, stationary cast cannot teleport, NPC changes must follow their author-defined movement/danger-exit sequence, and creatures with patrols can move only along the authored next route edge. Active variants and contingent creatures are chosen from the compiled seed. Neither this library nor a model invents a new individual, a predator, a passage or an injury.

**Important security limit:** A standalone pure library cannot independently prove that a caller's purported frames were produced by a real committed world replay, that a source-authorized NPC movement trigger has actually occurred, that a distressed actor has a valid Evolved injury record, or that an unpushed passive sighting check succeeded. The *future execution layer must reconstruct and validate these against its authoritative, committed adventure/save/Evolved history before calling this function*. A caller must not pass AI-supplied frame data, freely edited saves, raw user-provided reports, or invented dice/check successes. Source-binding and structural validation are **not** cryptographic authenticity. DHR-018 does not connect this ledger to the existing runtime; that linkage belongs to DHR-019 and later execution tasks.

## Contract

Frames:

    {beat:0,
     npcRooms:{'mara-venn':'supply-shelter','ivo-pell':'nesting-pool'},
     creatureRooms:{'nursery-grazer':'nesting-pool'},
     distressedNpcIds:[]}

The complete actor and creature ID sets are required on **every** frame, including the initial beat-zero frame. Each subsequent beat is strictly increasing; no interpolation is performed. A changed condition such as distress is an **attestation by an already validated world frame**, not permission for the ledger to assign damage.

Events are one of two closed forms:

    {id:'tide-seen',type:'observe',npcId:'ivo-pell',
     factId:'rising_tide',kind:'clue',beat:1,location:'reed-walk'}
    {id:'tide-told',type:'report',fromNpcId:'ivo-pell',
     toNpcId:'mara-venn',factId:'rising_tide',
     kind:'clue',beat:2,location:'supply-shelter'}

An observation requires the named person to occupy the **exact** room in the frame at the **exact** beat and requires an independently source-present fact: the selected seed variant clue at its physical clue room; a real present seeded **predatory** creature at its current position; or a real other supporting NPC co-located and independently marked distressed in that frame. No arbitrary reported story is silently elevated to direct observation. Failed or ambiguous detection must never produce an observe event.

A report requires an identified source NPC and a *different* recipient NPC, both co-located at its documented beat. It records that **this speaker claimed that fact**, not that the claim is true or that the listener saw anything. Deliberately false rumors can be recorded as attributed reports without spawning the alleged creature. Repeating the same eyewitness fact or the same source-to-recipient fact is rejected; distinct identified rumor sources are retained.

The compilation is deterministic, bounded to 256 frames and 256 events, strict on allowed fields/prototypes/identities, chronological, sorted by beat and event ID, and recursively frozen at the serialized entry/frame level. Identity is an FNV replay fingerprint and is **not** a signature. No gameplay RNG, dice, state mutation, action economy, dialogue transcript, unseen creature or attack is synthesized.

## Downstream views

- npcKnownFactsAt(ledger, npcId, beat) gives DHR-008-compatible unique {id,kind,source,local} records for **one named person at an exact frame**. With no information, it returns an empty list. Reported facts are always source='reported', local=false for action decisions. Older witnessed clues remain known, but a danger/distress observation is local/actionable **only at its actual sighting beat** in its real room; a remembered sighting does not imply the target remains there. This view is an advisory input to npcPerceivedOptions, **not** an execution grant.
- npcFactProvenanceAt(ledger, npcId, factId, beat) returns status 'unknown', 'reported' or 'observed', plus an explicit witnessed flag and sorted named reporter IDs. Independent witnessed evidence may supersede the current epistemic category for that individual but never deletes its report provenance. One person's observation cannot promote another person's report.

Exact-beat queries reject unknown actors and nonexistent frames rather than reading the future or synthesizing times. Full ledgers contain GM-side source and rumor evidence and **must not be dumped into player-facing views**; DHR-019/053 must expose only actor-appropriate knowledge and enforce privacy, location, Evolved action cost and source validity again at commit.

## Verification and compatibility

tests/npc-knowledge-provenance-dhr018.test.mjs covers seeded estuary observations, physically co-located report propagation, independent observed predator confirmation, quiet-range non-predator seeds, unsupported routes and positions, wrong room/beat/actor, duplicates, reported-to-observed spoofing, genuine local distress, deterministic replay and source tampering. It exercises the DHR-008 finite-action adapter, where a rumor or a noncurrent sighting cannot force a withdrawal, attack or medical effect. A frozen Long Count rev10 save and all three Party/Focus/Spectator modes are tested without modifying source, saves or the RNG.

Tests: node --test tests/npc-knowledge-provenance-dhr018.test.mjs and npm test; syntax: node --check src/npc-knowledge-provenance.mjs and node --check tests/npc-knowledge-provenance-dhr018.test.mjs.

Manual browser/Cloudflare QA is not claimed for this pure unused source module. The Integration Director retains acceptance, independent merged-main Actions/Pages checks, progress accounting and final runtime integration.
