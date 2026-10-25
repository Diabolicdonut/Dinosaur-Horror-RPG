# Procedural Adventures and Replayable Authored Scenarios — Design Contract

**Decision:** October 25, 2026. **Status:** Approved design requirement; **not implemented** as of checkpoint 007-M1 (v0.7.20, 454 baseline tests). Read with [Adventure/Engine Separation](ADVENTURE-ENGINE-SEPARATION.md). This contract describes adventure content generation, not new *Alien RPG Evolved Edition* rules.

## Product target

Support a library of **several well-crafted pregenerated adventures**, plus **open-ended procedural generation of new Cinematic adventures and continuing Campaigns**. Players should not already know whether a scene is dangerous, whether a particular animal will appear, who is trustworthy, what caused the emergency, how they might escape, or which opportunities for wonder, investigation and recovery await them. **Even replaying the same authored adventure must produce meaningful variation** while preserving its artistic identity.

There is no precomputed finite "master list" of all scenarios; a generator can keep creating new valid combinations and, with a bounded generative Game Mother, original authored variation. "Unlimited" expresses an **open-ended, continually extensible content goal**, not a mathematical guarantee that every conceivable future scenario or story will be unique.

## Three complementary adventure formats

1. **Authored Adventure Template** — A curated premise, distinctive locations/atmosphere, cast roles, credible situation and one or more possible dramatic arcs, *with deliberate variable slots*. A template is never an immutable sequence of scripted beats. The same ID can yield substantially different playable instantiations.
2. **Procedurally Generated Cinematic Adventure** — The generator chooses a fresh coherent premise, reachable physical map, cause, NPC agendas, creature roles, competing stakes, secrets, clues, resource placements, optional scenes and genuine resolution possibilities. This is not simply shuffling scenes from *After the Storm* or swapping dinosaur names in the same rescue plot.
3. **Procedurally Generated Continuing Campaign** — An open-ended sequence of connected adventures: persistent characters, injuries, relationships, discovered facts, meaningful prior world changes and unresolved objectives. The next scenario may be generated from *those facts*, not reset to a default crisis. Each chapter can have its own quiet/wonder/action/horror/recovery dynamics; not every chapter needs another dinosaur attack.

All use the **same validated AdventureDefinition/AdventureInstance contract**, deterministic Evolved resolver, character creation, Party/Focus/Spectator controls and privacy filtering. Authored template, generated package and runtime world are separate entities.

## Replay variation: what can change

For each replay of an authored template, use a **new generation seed**, optional difficulty/length/preferences and the template's validated variation envelope. The generator may vary, where the template permits:

- **Core uncertainty:** true initiating cause, unreliable assumptions, competing objectives and secrets, with evidence that actually supports the generated truth.
- **Roles and human behavior:** who needs help, who knows critical information, which NPC is reliable, relationships, motives, agendas, cooperation and betrayals (if plausible), without presuming every stranger lies.
- **Animal situations:** species appropriate to the location, which animals are present, their initial physically credible positions and dispositions, whether an encounter remains quiet, turns defensive or becomes a chase. No forced encounter merely to preserve a scare quota.
- **Layout and access:** some routes, equipment locations, lock or repair constraints, usable shelters and escape options; always maintain a physically reachable and mechanically fair scenario with genuine alternatives.
- **Discoveries and pacing:** clues, false leads that do not contradict the actual answer, optional scenes, weather/visibility, resource placement, human recovery scenes, awe, danger and relief. No mandated steadily rising fear curve.
- **Branching consequences:** which objectives become feasible, who can be rescued, and several truthful endings that depend on committed actions.

**Non-variation:** Evolved dice/skills, combat, stress, damage, injury, causality, actor knowledge, creature physical movement, finite stock conservation, legitimate skills/talents, action costs, or agreed premise constraints. A template may intentionally keep its iconic location or specific cast; variability must be *meaningful within that identity*, not randomized incoherence.

### Illustrative template, not another engine assumption

An authored "missing survey team" could resolve differently across plays: an injured scientist awaiting rescue, an abandoned camp following an evacuation, or an apparent disappearance resulting from communication sabotage. Each has different evidence, character agendas and optional dinosaur encounters, while all remain consistent with the same expedition premise. A wondrous grazing scene need not always be interrupted by a predator; a spectacular animal can be entirely harmless in one session and a physically credible hazard in another. These are **examples of variation**, not mandatory scene types.

## Two separate generators

**A. Adventure compiler (before play):** Choose template or fresh procedural construction, generate **seeded world facts**, validate the whole manifest, build the scenario instance and record its ID, template/generator/schema revisions, source seed, content digest and fixed latent truths. Do not generate facts using the combat dice RNG. This is where secrets, NPC intentions, physical entities and initial threats become real and stable.

**B. Game Mother director (during play):** Uses only world state, private GM knowledge, actor-local views and existing scenario constraints to propose **typed legal actions/events/dialogue**. It may respond dynamically to player improvisation, adjust unrevealed *future* possibilities within established constraints, and build a next episode after the current one. It **may not secretly reroll a mystery culprit, teleport an animal, create rescue supplies, revise established evidence, force a roll or overwrite a previous Evolved result** just to create drama.

A new *emergent* event can introduce an actual new creature/NPC or consequence **only** after a typed, resource-bounded, physically valid world event is committed under the adventure's established capabilities. The authored/game-generated *initial* manifest must be sufficient to validate reachability, obstacles, plausible threats, available choices and at least one legal outcome. Procedural uncertainty must never mean arbitrary adjudication.

## Replay unpredictability and fairness

- **Don't show the player the seed, hidden plot truth, selected variant or GM-only entities** in the ordinary play UI. If offering manual seed entry, make it an explicit advanced/replay choice.
- **Same seed + same template/generator revision and choices** yields the same instantiated hidden truth and reproducible mechanical event stream (assuming the same approved rules version). New seeds can produce structural differences, not just alternate prose.
- The first play and every replay should permit observation, suspicion, rational deduction, surprise and strategic decisions. Hints and future revelations must match the committed hidden cause.
- Avoid predictable "safe moment, then scripted dinosaur attack" loops. Allow scenes that end peacefully. Alien's **Dinosaur Horror, Sci-Fi Action and Sense of Wonder** can vary in emphasis from one adventure to another.
- Vary uncertainty without degrading identity or accessibility: logical prerequisites, option to withdraw from danger, multiple plausible strategies, recoverable setbacks where appropriate, legitimate failure and accurate consequences.
- Generation must handle longer Campaigns without invalidating past map, character, NPC, animal, clue or resource history. Persist and re-use prior events rather than rewriting them for plot convenience.

## Save/replay and privacy contracts

Persist:
- **Authored template ID/revision (if applicable); adventure generator ID/revision; generation seed and selected options; approved compiled manifest content hash**.
- The complete generated manifest or an immutable reference with a reliable recovery path. **A new generator release must not silently regenerate or change an old ongoing scenario.**
- Actual story state, Evolved RNG state, actor/NPC/creature statuses, character-owned knowledge, resource stocks, event ledger and any Campaign continuity ledger.

Support **fresh replay**, **replay from known seed** (explicit opt-in), **continue an existing scenario**, and **start a fresh generated Campaign** as distinct operations. A restart with a fresh seed must create a genuinely fresh compiled instance; continue/load never does.

## Generation quality and validation gates

Before play, reject/repair packages with unsupported IDs, invalid species/skills, missing physical routes, unreachable objectives, impossible equipment requirements, paradoxical NPC locations, insufficient consumables, conflicting revelations, contradictory clue/secret links, forced combat with no reasonable alternatives where the authored premise promises them, non-terminating objectives, or incompatible save/scene schemas.

Acceptance must prove:
1. A **single, unmodified core engine** runs at least two substantially different adventures, as required by the separation contract.
2. An authored template produces **multiple structurally different and still recognizable** instances from distinct seeds (vary at least two meaningful dimensions such as actual culprit/cause, objective, NPC intent, route, encounter disposition or valid ending).
3. A fresh generator produces playable adventures without assuming `generator → radio → helipad`, fixed named zones, a mandatory predator or required rescue objective.
4. Equal seed/revision/options reproduce hidden truths and exact legal Evolved resolution on replay; different seeds are demonstrably more than mere cosmetic text swaps.
5. Continuing Campaigns remember prior consequences and can generate connected new chapters; direct event editing and undoing committed game history are forbidden.
6. All variations pass Evolved mechanics, physical reachability, hidden-information privacy, Party/Focus/Spectator, seed/RNG isolation, finite-resource and save/reload tests, alongside all prior accepted baseline tests.

The first generated-adventure release need not meet every long-range generative/creative goal, but **must clearly label whether it is merely seed-shuffled content, a constrained template generator or an actual validated dynamic Game Mother**. Do not claim endless unique stories from a finite permutation table.

## Implementation order

1. Complete adventure-agnostic core extraction and a genuinely different second scenario, with no regression.
2. Define an authored **template variation schema**, authored invariant core vs configurable slots, deterministic compilation and manifest locking. Demonstrate meaningful replay variability.
3. Implement a constrained **standalone procedural Cinematic adventure** generator using typed roles, goals, physical-world constraints and director guidance; seed/validate/store.
4. Implement **Campaign episode generation** from durable histories and character goals, with continuity constraints.
5. Expand bounded AI Game Mother generation and live direction using validated manifests and effect proposals. Favor narrative coherence and replay surprise over sheer number of randomized elements.

**Non-goals:** a Zoo Tycoon population sim; a universal preset rescue plot; arbitrary randomized rule changes; infinite storage or an assertion of provably unique outcomes; force-scheduled predator attacks; rewriting history to surprise players.
