# DHR-008 — Pure NPC perception and options (Issue #74)

**Scope:** An independent reusable policy in `src/npc-perception-policy.mjs`. Not wired into any running adventure, character sheet, save schema, parser, or Evolved dice resolver. The integration director alone accepts roadmap progress.

## Contract

`npcPerceivedOptions({knownFacts,motiveFlags,legalExits})` accepts:

- `knownFacts`: at most 64 unique actor-known records of exactly `{id,kind,source,local}`. `kind` is `danger`, `distress`, or `clue`; `source` is `observed` or `reported`; `local` is a boolean. IDs are stable, simple slugs. The **caller** must have already checked the NPC actually acquired each fact from the committed world, Evolved passive perception where relevant, and the NPC's current room. Reported claims do not become witnessed truths.
- `motiveFlags`: an optional subset of boolean `selfPreservation`, `aidOthers`, and `curiosity`. These are advisory, *not* invented NPC skills, talent effects, or mechanically complete motive/action rules. More nuanced and source-validated motive handling is reserved for later assignments.
- `legalExits`: at most 32 unique destination room IDs. The **caller** must prove each exit is adjacent, open and currently traversable by this NPC. The policy never invents an edge or finds remote paths.

It returns an immutable, deterministically ordered set of **candidates**, always including `{kind:'hold'}`. For directly observed **local** danger plus `selfPreservation`, it may include `{kind:'withdraw',to}` for each supplied legal exit. For directly observed **local** distress plus `aidOthers`, `{kind:'consider_help',factId}` may be offered; for directly observed **local** clues plus `curiosity`, `{kind:'consider_inspection',factId}` may be offered. Reported or remote knowledge alone produces no situational candidate.

Invalid structures, duplicates, unknown authority/effect fields, nonboolean motives and invalid room identifiers throw `RangeError`; the policy never silently coerces or fabricates knowledge. No random rolls, state writes, turns, medical recovery, rescue, dialogue to invisible listeners, combat results or dinosaur encounters are resolved. The future execution layer **must revalidate** the candidate at commit time against source, map, conditions, Evolved action economy, resources and control mode; a returned candidate is not a permission token.

## Verification and compatibility

`tests/npc-perception-policy-dhr008.test.mjs` covers quiet/no-forced-encounter behavior, witnessed-versus-reported/remote knowledge, finite legal exits, motive restrictions, invalid and adversarial inputs, no RNG or mutation, input-order-independent replay, and a genuine legacy Long Count revision 10 save still accepted unchanged. Existing scenario manifests, historical source fingerprints, the original supporting-cast engine, all three player control modes, `project-state.json` and `site-progress.json` remain untouched.

**Known limitations:** The function cannot independently attest the caller's knowledge ledger or room adjacency; neither full human NPC Evolved action economy nor actual tactical decisions are delivered here. The current browser-client GM secrecy limitations remain. Visual and Cloudflare manual QA are outside this pure-library change.
