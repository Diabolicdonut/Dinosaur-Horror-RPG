# Dinosaur Horror RPG — Engineering audit

## Checkpoint 009-B2b2c2c2a — Adventure-independent Evolved Combat Scheduler (accepted source, final deployment verification pending) — 2026-10-26

**Recovery:** Authoritative main `2d56eb4793bb7fd753644070f1e314b1f26fd01a` accepted 009-B2b2c2c1 v0.7.30 (583 regressions), with no open PRs. The user-requested full multi-round research combat is still a staged implementation.

**Implementation:** New `src/adventure-combat-scheduler.mjs` defines generic Evolved numbered initiative with source speed 1–2 animal slots, deterministic seed-based ordered cards, authentic quick/full actor action budgets, explicit initiative ownership, spend limits and newly seeded next-round card draws. No Nublar or research room/species text is hardcoded. Every update returns a new state; malformed cards, unsupported actions, incorrect active actors and forged budgets are rejected. This is infrastructure for 009-B2b2c2c2, **not live playable combat**, creature AI, injury clock or source weapon rules.

**Validation:** Eight new regression tests plus 583 accepted = **591/591** PR #40 exact head `75f5ae419d74fa5257fd15b50bf16251683b14c5` in Actions 40326573259. Merged code commit `272f31fef09683ceb9345a4cfb4d2578442e74b3`, independent main Actions 40326736184 SUCCESS (591/591) and Pages 40326735763 SUCCESS; manual graphical QA remains outstanding. Historical saved scenarios unchanged. Next integrate and validate actual combat actions and clinical timing. Desktop/mobile graphical QA outstanding.


## Checkpoint 009-B2b2c2c1 — Player-Selected Evolved Opening Defense (accepted) — 2026-10-26

**Recovery:** GitHub accepted main `e719bb9df12bfa2f15edf2bec802fa46ef06b37b`, 009-B2b2c2b v0.7.29, 572 passing tests and both Actions/Pages green, zero open PRs. Isolated Dinosaur project scope; no other repositories or Worker secrets used.

**Mechanics:** The research adventure now offers an explicitly chosen defense **when a genuinely colocated, seed-real predator's Evolved awareness and initiative generate an attack**. New authored *Long Count* revision **7** uses the validated `evolved_reaction` creature contact contract, and the exact earlier revision 6 manifest is copied immutably to `adventures/ridge-survey-rev6.mjs`. Source detection and initiative still occur only after real completed actor travel/survey actions; if they produce a threatening strike, the normal actor queue pauses until the actual victim chooses **Defend** (source Evolved Close Combat opposed defense) or **Decline** (no defensive roll). The source creature attack can miss, wound or cause critical injury, not a cinematic automatic hit. The reaction adds one 10-second combat clock unit, **not** a duplicate exploration action. The pending reaction is bound to real actor, animal, seed, room and action beat; state validation rejects tampering and unsupported travel or objective actions while a strike is outstanding.

**Player and AI:** Reuses existing Nublar Party browser's defend/decline reaction panel and typed `react defend` / `react decline` parser, with legitimate Party, Focus and Spectator ownership. Autonomous companions choose a source defense when the AI controls the victim. The broader Party UI and source version module chain are updated.

**History:** Rev1–6 existing research saves continue their exact previous rules and source fingerprints; this feature only starts for newly created Rev7 research sessions. Nublar rescue, source Nublar combat, legacy solo and Cloudflare Worker remain unchanged.

**Testing:** 11 new regression cases, old baseline 572, **583 candidate tests**. New tests check the source opportunity, quiet seeds, forced-reaction bypass rejection, defended and declined outcomes, one 10-second clock step, deterministic dice, Focus/Spectator AI agency, tamper rejection, historical rev6 behavior and Nublar isolation. An initial CI test failure exposed a double-escaped typed command regex, fixed before subsequent green candidate checks. Final exact PR head and independently merged main Actions and Pages remain acceptance gates. Manual desktop/mobile graphical smoke not performed.

**Acceptance:** [PR #38](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/38) exact documentation-inclusive head `3fecb3c0ce50ec175612df42a48e29e6faa3ab29` passed **583/583** via [Actions 40316080352](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40316080352). Merged source main `130e8dc57c9b0f97e6e49eb5049bd922111fceb8` independently passed [Actions 40316221185](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40316221185) **583/583** and [Pages 40316221383](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40316221383). The acceptance-ledger-only follow-up requires separate GitHub checks. Manual graphical desktop/mobile smoke still outstanding.

**Remaining limitations:** This is **one opening strike's explicit reaction**, not complete 10-second combat rounds, ongoing multi-slot initiative, ranged combat options, a full clinically ticking injury clock or autonomous human NPCs. Next milestone **009-B2b2c2c2** advances real combat-turn architecture.


## Checkpoint 009-B2b2c2b — Source-Evolved Predator Opening Contact (accepted) — 2026-10-25

**Recovery:** Current accepted `main` `43ca8ffa720d1df4c5e7530fb4094b67a3e1926d` is 009-B2b2c2a, version 0.7.28, 560 passing regressions, Actions and Pages green, no open pull requests. New implementation advances that state rather than the user's older earlier reported checkpoint.

**Implementation:** Authored research revision **6** introduces a validated `threat:{protocol:'evolved_contact'}` for an actual seed-dependent patrolling Velociraptor. Generic `src/adventure-predator-contact.mjs` resolves **opening contact after an actual Party action** only if a capable living survivor and actual eligible predator occupy the same zone. It calls previously accepted Evolved passive detection, numbered initiative (two source-speed dinosaur slots), source creature attack and Mobility defensive dodge, followed by injury enrichment when necessary. Genuine outcomes include harmless sighting, avoided attack, successful defensive reaction, or damage and possible critical injury; an encounter never implies automatic harm or off-map monster appearance. Contact records validate current and reconstructed patrolled room, actor, beat, source awareness and attack flags. Remote animal information is not displayed to actors elsewhere. An actor may use a legal physical exit next turn.

**History:** `adventures/ridge-survey-rev5.mjs` preserves the exact previous predator-patrol-only definition; Rev1–5 saved expeditions never retroactively acquire hostile contact rules. Rev6 is the new authored scenario. Nublar rescue and separate solo/Worker remain unchanged.

**Testing:** 12 new focused cases plus existing 560 for **572/572 candidate**. The previous patrol-only no-RNG case continues to test actual immutable Rev5 rather than incorrectly asserting contact consumes no dice in Rev6. Browser module cache revisions and historical browser tests refreshed. Exact-head GitHub CI, merged-main Actions and Pages still required. Manual desktop/mobile graphical gameplay QA outstanding.

**Acceptance:** [PR #36](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/36) exact final head `a6ed68d6631b1a772a5efca68d386442939e888e` passed **572/572** regression tests in CI [40267769753](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40267769753). Source main `99d204b0a99292e36b1799d8de65a340e7070e23` independently passed [Actions 40267847224](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40267847224) **572/572** and [Pages 40267847147](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40267847147). Acceptance-ledger-only PR must pass its own checks. No desktop/mobile graphical smoke has been performed.

**Limitations:** This is source opening initiative and automatic defensive reaction, **not full 10-second Evolved combat rounds** or explicit choice-driven attack/reaction turn budget. Independent human NPCs, full medical death-clock, generated Cinematic stories and Campaigns are not yet implemented. Next milestone 009-B2b2c2c builds those shared combat capabilities.


## Checkpoint 009-B2b2c2a — Seed-Conditional Persistent Predator Presence (accepted) — 2026-10-25

**Recovery:** Accepted GitHub main `10cb0fd53d458ed18d4df3bda51614d85aaa3b43`, 009-B2b2c1 v0.7.27, 547/547 tests with Actions+Pages successful and zero open PRs. Strict isolation: Dinosaur Horror RPG only.

**Playable scope:** A validated adventure now supports an initial creature gated by a specific hidden, compiled seed variant, plus an authored, adjacent-room patrol route and cadence. `src/adventure-creatures.mjs` instantiates only actually present animals and advances their physical positions on completed actor rounds without spending Evolved RNG, teleporting, spawning cinematic attackers or retroactively rewriting a situation. The actor sees the predator only when colocated; remote tracks become local clues at the authored site. A companion observing an actual research raptor can choose a real connected retreat rather than invent unsupported attack rules. The original *Long Count* revision **4** is preserved as an exact immutable file; newly started revision **5** has a 50/50 authored predator-presence variation with a Velociraptor patrolling the forest-blind / river-crossing edge or no predator at all. The variation is deterministic for a seed, not a live random spawn.

**Verification:** Added 13 focused regression tests for populated/quiet seeds, physical graph validation, old rev4 saved facts, turn cadence, seeded visibility, hidden facts, locally aware companion retreat, journal tampering and Nublar parity. Previously accepted 547 cases retained (**560/560 candidate**). Browser cache revisions and previous UI regression assertions updated. Final exact PR #34 head and independently merged main GitHub Actions and Pages are required before acceptance. Actual manual desktop/mobile graphical QA remains outstanding.

**Acceptance:** [PR #34](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/34) final candidate head `b4a7903577f99624012789d6467640dde9c6a3aa` passed **560/560** in CI [40265841463](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40265841463). Source merged main `1a30ff1ffd73a4cb98de0ba767b082b1bafc9551` independently passed [Actions 40265924855](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40265924855) **560/560** and [Pages 40265924390](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40265924390). Documentation-only acceptance merge requires separate CI/Pages. Manual desktop/mobile graphical smoke not completed.

**Explicit limits:** This is predator *presence, awareness and position*, not autonomous hostile combat: the second adventure still lacks predator initiative/attacks, defensive reaction, source-aware stealth pursuit, critical injury time ticks and independent human NPC minds. Physical predator sightings will not injure the party in this milestone. Next **009-B2b2c2b** must implement genuinely source-legal confrontation or avoidance when a predator shares a survivor's room, not make it appear for dramatic pacing.


## Checkpoint 009-B2b2c1 — Voluntary Local Dinosaur Peril and Evolved First Aid (accepted) — 2026-10-25

**Recovery:** GitHub `main` `307e529578151f255f4a70d14ff1e4f6bbda4b18` accepted 009-B2b2b v0.7.26 (533/533), Actions and Pages passed, no open PRs. Work is strictly isolated to Dinosaur Horror RPG, no Worker changes.

**Source-grounded playable feature:** New generic `AdventureDefinition.perils` is optional, strictly validated data requiring a known species instance physically located in a real room, a bounded Evolved skill and modifiers, and optionally a compile-time hidden-variant match. New reusable `src/adventure-perils.mjs` gates voluntary actor-local opportunities and uses the existing Evolved `resolveSkillCheck`, `applyCreatureAttack`, and `enrichInjuries` procedures; no artificial auto-hit or free injury. The actor must opt to face a risky path, choosing alternatives is always possible. Source Mobility success avoids contact, failure allows a real creature attack roll that might still miss or cause damage and critical injury. One actual exploration action is charged and causal peril records are validated. The scenario selector/controls expose it via existing optional danger controls.

**Medical continuity:** The same selected Party runtime now permits actual Evolved Medical Aid and Command rally checks on injured, physically colocated teammates. This supports recovering from an injury caused by the new encounter; it does not yet implement the full autonomous time-based lethal-injury clock in research sessions.

**Versioned content:** Exact *The Long Count* revision 3 preserved immutably at `adventures/ridge-survey-rev3.mjs`; new revision **4** adds one seed-dependent peril to a cautious, nonviolent research expedition. Revisions 1–3 retain all original fingerprints, scenes and quiet gameplay. The Nublar rescue scenario, solo mode and Cloudflare Worker remain untouched.

**Evidence:** Added 14 tests: strict type/creature and provenance checks, seed/room agency, seeded Evolved evasion/real damage/miss, nonrepeatability, state tampering, wonder coexistence, physical first aid and Command, original Nublar parity and previous revision compatibility. **547 candidate automated tests** (533 prior). Final PR #32 and separately merged-main Actions/Pages required for acceptance. No hands-on graphical desktop/mobile QA performed.

**Acceptance:** [PR #32](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/32) exact head `4425acd1e561ab700ea67db01eda626436d557a1` passed 547/547. Source main `631daf8f185656e57a5056660b9370bdc6d65e67` independently passed [Actions 40263956091](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40263956091) and [Pages 40263955789](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40263955789). This docs-only acceptance PR still requires validation and final Pages success. Manual graphical QA outstanding.

**Deferred:** This is *not* active predator hunting, independent human NPC behavior, medical round/shift timers, fully generic creature battle AI, natural-language AI GM or procedural scenario generation. Continue 009-B2b2c2 with source-authorized autonomous NPC/creature and combat-turn architecture.


## Checkpoint 009-B2b2b — Optional Three-Act Cinematic Events (accepted) — 2026-10-25

**Recovery:** GitHub main `f5a993ae448233196114d259d541251891f595c3`, accepted 009-B2b2a v0.7.25 and 522/522 regressions; main Actions and Pages successful, no open PRs. Exclusive Dinosaur project scope maintained.

**Implementation:** Adds genuinely adventure-agnostic, data-only `cinematic` format validated alongside an authored AdventureDefinition: three ordered acts with explicit *objective prerequisites*, optional authored scene events with physical room, theme, optional real creature presence, optional second colocated capable survivor and optional compiled latent variant match. New `src/adventure-cinematic.mjs` derives the active Setup/Tilt/Showdown act from already committed mission objectives. It returns only currently local, eligible, actor-specific, one-time scene opportunities. A voluntary `scene <id>` action records actor, room, act and beat; it does not advance time or turns, spend Evolved dice/RNG, modify stress or injury, teleport a creature, add items or change mission success. Unavailable, repeated, forged and out-of-order scenes are rejected. There are no forced cinematic events and no compulsory predator attacks.

**New authored module:** *The Long Count* revision **3** adds six optional Wonder, Discovery, Human and Dread scenes organized into three acts. It retains the physical survey, safe route, seeded research obstacles and natural animal behavior from revision 2. Exact revision 1 and revision 2 manifests remain immutable separately; older saves continue their original definitions and do not suddenly gain new scenes. The same Party/Focus/Spectator interfaces show the current act and available optional scenes through existing browser controls; no new Worker or legacy solo changes.

**Validation:** 11 new tests added, for **533/533 candidate** (522 previously accepted + 11). Earlier test routes were adjusted to use an actually safe ridge route when the ford is flooded. Browser module cache identifiers and dependent UI assertions updated to load the new scenario. PR #30 final head and independently merged main CI/Pages must be confirmed. Manual graphical desktop/mobile QA remains outstanding.

**Acceptance:** [PR #30](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/30) exact documentation-inclusive validated head `4f8e8b962bf0849de54b4723499fe1380dcb8478` passed **533/533** (Actions 40262219451). The source merged main commit `e37a83bd25c568a9f5f0f9c9c10a58c7e23ce1f8` independently passed [Actions 40262285692](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40262285692) **533/533**, and [Pages 40262285718](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40262285718) deployed successfully. The documentation-only acceptance follow-up is subject to independent checks. Actual desktop/mobile graphical gameplay QA remains outstanding.

**Limit:** This is source-bound optional Cinematic *structure*, not actual fully generated stories, autonomous human NPCs, source-faithful predator rounds or medical-combat parity across scenarios. The survey's existing nonviolent wildlife response is unchanged. Next 009-B2b2c should generalize physically situated NPC and animal encounters and source Evolved danger mechanisms across adventures, then eliminate remaining two-runtime transitional duplication.


## Checkpoint 009-B2b2a — Causal Seeded Complications and Wildlife Response (accepted) — 2026-10-25

**Recovery:** Main `2f33d2990f8b45618e178fb1c157a7d6471bee75`, accepted 009-B2b1 v0.7.24, **508/508** regression cases, GitHub Actions and Pages successful; no open PRs and no cross-project inputs.

**Implementation:** First actual runtime application of independently compiled scenario **seed variations** in *The Long Count*. New `src/adventure-situations.mjs` projects a validated AdventureInstance's chosen hidden circumstances into local physical cues, a typed hazardous passage Evolved check, typed objective check modifiers, and a typed non-hostile wildlife response. The data-only schema rejects impossible exits, unsupported check skills, nonadjacent animal movement and unknown objectives. The flooded ford can stop a crossing after a real Mobility check, charging one exploration action and preserving an alternate ridge route; wind-damaged equipment makes radio transmission harder; missing/reordered records make research harder. Selected clues are visible only when a survivor is physically at the authored clue location. The original adventure seed fixes the choices reproducibly without consuming the Evolved action RNG or leaking remote facts in actor views.

**Wonder and danger:** A peaceful Parasaurolophus can always be watched without a roll, time still passes as appropriate; grazing animals permit a cautious approach without a roll. A seeded wary animal responds to a failed Survival approach by moving from its actual ridge location to the adjacent forest blind, instead of spawning a predator or automatically attacking. Valid saves reject forged relocation without a recorded failed approach. Nublar, the solo game and Worker unchanged. Browser module revisions updated coherently so prior cached Party modules do not suppress new logic.

**Tests:** +10 initial regression cases for seed identity, schema validation, local-only secrets, Evolved passage success/failure, alternate access route, objective modifiers, safe watching, real adjacent animal flight, save tampering and original rescue parity. Retained 508 previous cases for **518/518**, validated in PR #27 and merged source main `590c639421caed0f7920813fc72be6c4707efab2` (Actions 40259944918 and Pages 40259944941 both successful). A separate compatibility correction PR #28 adds four tests, targeting **522/522** final. Final PR #28 and resulting merged-main CI/Pages remain to be verified independently. Manual graphical QA remains outstanding.

**Save continuity correction:** The first variant commit changed the research manifest while retaining `revision:1`, unintentionally changing the fingerprint of existing Party saves. PR #28 corrects this before final acceptance: preserves the *exact* historical revision 1 definition in `adventures/ridge-survey-rev1.mjs`; increments mechanically enriched research definition to revision **2**; selects validation, objectives and cues according to saved bound revision. Old saves keep their original ford/wildlife behavior; new revision 2 incidents use the new seeded consequences. Added four revision/forgery tests. Browser module revisions are refreshed to load the correct current manifests, preserving all other scenarios.

**Acceptance:** [PR #27](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/27) delivered initial situation-level mechanics; its merged main `590c639421caed0f7920813fc72be6c4707efab2` passed Actions 40259944918 and Pages 40259944941 (518/518). [PR #28](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/28) fixed old-save fingerprint/revision continuity and added four regression tests; its exact final head `b1d0b3577020ba840d6c2511b6762061c9a3154a` passed **522/522**, then accepted source main `f53cd9e8403627bb423b021f6ce0cbebf51a5485` independently passed [Actions 40260540618](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40260540618) **522/522** and [Pages 40260540169](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40260540169). The documentation-only acceptance follow-up must pass its own checks. Manual browser desktop/mobile QA remains outstanding.

**Deliberate limits:** Not full 009-B2b2: research adventure still does not simulate active predators, injury/combat ecology, dynamic weather, companion/NPC relationships, three-act scene sequencing or procedural Campaigns. This is constrained *situation-level seed variation* (difficulty, path and animal reaction), NOT evidence of structurally different complete generated stories or cinematic playthroughs. Next 009-B2b2b: reusable three-act Cinematic framework with optional events and physically grounded triggers; then continuing creature, medical and NPC extraction.


## Checkpoint 009-B2b1 — Selected Second Party Adventure (accepted) — 2026-10-25

**Recovery:** Verified current GitHub main `c96fc43b76f354a56eb29903b1c690cb20815363`, accepted 009-B2a v0.7.23, 494/494, Actions/Pages green, no open PRs. No other project inputs used.

**Implementation:** The Party API now accepts an `adventureId`, preserving the original Nublar execution path while selecting a separate `ridge-survey` instance through `src/adventure-party-runtime.mjs`. The second adventure has a different five-zone world, research objectives, source Evolved Observation and Comtech attempts, actual physical inventory and teammate transfers, optional nonhostile Parasaurolophus observation, and a routine non-helicopter walk-out ending once earlier objectives are committed. The same Party/Focus/Spectator control public API, browser camera, action controls and saved session path work with the selected instance. The companion director follows the selected map and research objective instead of sending everyone to the Nublar generator. The browser now offers two selectable modules and displays scenario-specific objectives. A typed, data-only `interaction` field declares each research objective's in-room target and valid Evolved skill, with `null` reserved for routine no-roll actions. An unapproved player objective command cannot auto-complete goals.

**Save/security:** New survey Party-v3 saves bind the exact adventure revision and fingerprint, enforce correct rooms, physical item conservation, known flags, causal objective history, valid actor identifiers, and reject foreign Nublar saves under the survey identity. Actor views do not display other actors' inventories or distant item stock. The compiled hidden variant facts remain private but are not yet materialized as different gameplay consequences.

**Validation:** Fourteen targeted new tests plus the 494 previously accepted cases target **508/508**. An initial PR run caught 15 legacy UI tests requiring the obsolete cache revision string and two faulty new test assumptions concerning actual actor turns and item ownership. Corrected those assertions without weakening simulation guards. Latest candidate source commit `217b197d17819d3208d2af93b3546b9e2fdb5208` passed **508/508** in candidate CI [Actions 40246695292](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40246695292). Final documentation-inclusive PR and merged-main CI/Pages remain separately required.

**Acceptance:** [PR #25](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/25) final candidate head `e9789c2e80a580bf63ffa1eb2ad83817403118fa` passed **508/508**. Accepted source main `33b2d5b1500ad6e65109e787ed2baae942d6701d` independently passed [Actions 40246877401](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40246877401) and [Pages 40246876975](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40246876975). The acceptance-ledger-only merge is subject to its own checks. No manual graphical desktop/mobile smoke was performed.

**Limits / next:** This is a **second playable exploration-and-objectives slice**, not feature-parity or final 009-B independence. The original survival/combat/guide/dinosaur director remains Nublar-bound; the survey's peaceful animal currently has no autonomous behavior or Evolved combat. Its seeded facts do not yet drive changing causal encounters. A later milestone must unify directors, creatures, events, saving and all mechanics behind selected AdventureInstances. No generic procedural Cinematic/Campaign generator, full AI Game Mother, or manual browser QA is complete.


## Checkpoint 009-B2a — Evolved-Gated Generic Objectives and Endings (accepted) — 2026-10-25

**Recovery:** Accepted main `39616750a3667fc25a18d606c35ee6c19aa9e163`, 009-B1 v0.7.22, 478/478 regressions, Actions/Pages both successful; no open PRs. No work from other projects was used.

**Implementation:** New `src/adventure-objectives.mjs` validates a compiled adventure before resolving authored objectives. An objective commits only after a deterministic engine-authorized successful action, with the correct actor physically present, the authored prerequisite chain satisfied, and no previous completion. Transactional flag and ending effects use the JSON manifest. It never rolls Evolved dice, authorizes an action by itself, changes action cost, teleports creatures or accepts an AI state patch. The *After the Storm* generator, radio, and beacon still use their existing source Evolved skill procedures but now hand successful authorized outcomes to this reusable service. The traditional rescued/lost Party-v3 UI meaning is maintained at the Party boundary, not hardcoded into the generic service.

**Continuity and security:** New Party saves may include an `objectiveRecords` history; preexisting valid Party-v3 saves without it continue to load, with previously true flag effects providing safe legacy progress inference. Records reject unknown/duplicated objective IDs, wrong physical rooms/actors, future or reversed timestamps, inconsistent saved effects and skipped prerequisites. A direct player-authored "objective" action is rejected; normal Evolved success remains mandatory for authored machinery. Existing action RNG, stress, chase, medical, item and party mode behavior is unchanged.

**Validation:** **494 total targeted**: retain all 478 accepted 009-B1 regressions and add 16 tests of both unrelated adventure objective graphs, legal source authorization, position checks, prerequisites, typed end effects, mutation isolation, legacy saves, spoofed histories, and generator Evolved success/failure. PR CI, accepted-main Actions/Pages and real graphical smoke must be confirmed separately.

**Acceptance:** [PR #23](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/23) final validated head `dcdc9bdc9f3297718afb1f3b12034f4c81ee8d25` passed **494/494** and merged as main `15748b3ae6cc03880e31ca2d455bdc028217fbfe`. Its independent accepted-main [Actions 40241948021](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40241948021) and [Pages 40241947584](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40241947584) both succeeded. Manual browser desktop/mobile QA remains outstanding.

**Remaining:** 009-B2a is a subsystem milestone, **not** the full 009-B two-playable-adventures gate. The research survey can resolve its objective sequence through the standalone domain service but cannot yet run as a Party browser scenario. Creature/NPC/director/state selection remain Nublar-specific. Next: 009-B2b AdventureInstance selection and complete runtime extraction; then seeded authored variability, original generated Cinematics, continuing Campaigns and typed AI Game Mother.


## Checkpoint 009-B1 — Generic Adventure World Boundary (accepted) — 2026-10-25

**Recovery:** Inspected main `2e74ab434f8bc0bf818c67d348009885deb589ab`, accepted 009-A v0.7.21, 470/470 previous tests with successful Actions and Pages, no open PRs. The approved adventure separation and replay contracts remain authoritative.

**Incremental implementation:** Added `src/adventure-world.mjs` as a data-only physical-world projection of a fully validated, versioned compiled AdventureInstance. Both the existing Nublar package and independent `ridge-survey` package use the same room lookup, finite room inventory copying, item labels, physically adjacent exit matching, shortest-path distance and movement step selection. The interface rejects tampered compiled content and never imports `SCENARIO`, Evolved combat code or adventure-specific directors.

**Integration:** The existing Party engine now reads its start position, starting items, room item stock, displayed room descriptions/names, exit names, pathfinding and movement destination matching from the accepted compiled After the Storm manifest instead of the hardcoded scenario singleton. Existing optional scene features, rescue rules, NPCs, creatures, Evolved rolls, stress, saves, control modes and historical narrative remain unchanged. Added eight targeted adapter/parity tests; **478 total targeted** (470 prior + 8 new). Final PR and accepted-main CI/Pages must be checked before reporting acceptance.

**Acceptance:** PR [#21](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/21) exact final head `14095601a154d33ad639a3cd34a592d4e531f7e9` passed **478/478** after correcting a test that had incorrectly inspected the *next* active survivor's view instead of the actor who moved. Merged main `99a044cf873d51ef500004092cabca1630713fad` separately passed [Actions 40240771068](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40240771068) and [Pages 40240770843](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40240770843). There were no changes to core Evolved dice or the Worker. Physical manual desktop/mobile graphical QA remains outstanding.

**Not yet complete:** The Party engine still has many Nublar-specific imports and is not able to run the research-survey fixture; generic objective resolution, scene/NPC/creature routing, saved selected instances, procedural adventures, and Game Mother are **not** implemented. Next checkpoint should complete generic objective/action interface and extend it without changing Evolved mechanics. Desktop/mobile hands-on QA remains outstanding.


## Checkpoint 009-A — Executable Adventure Definition, Separate Fixtures and Bound Saves — 2026-10-25

**Recovery:** GitHub `main` `e9d0cdc983aee53eee1744ef9a1ea2bd551c1ffd`, checkpoint **007-M1 v0.7.20**, **454/454** accepted regression cases, main Actions [40211967800](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40211967800) and Pages [40211968071](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40211968071) successful, zero open pull requests at recovery. Authoritative [adventure separation](docs/ADVENTURE-ENGINE-SEPARATION.md), [procedural replayability](docs/PROCEDURAL-ADVENTURES-REPLAYABILITY.md), checkpoint, previous game engine and scenario were inspected. Scope remains exclusive to Dinosaur Horror RPG.

**Actual code delivered (first foundation, not complete extraction):** `src/adventure-definition.mjs` now validates versioned JSON-only adventure definitions, bidirectional connected maps and physical starts, authorized item identities/stock, explicit declared initial flags, objective prerequisites and typed `flag`/`end` effects, bounded physically located creature instances, and multiple authored hidden-fact choices pointing at real clue locations. It rejects invalid IDs, disconnected maps, undeclared items and effect types, impossible/cyclic objectives, forged creature locations and invalid clue pointers. A deterministic seeded compiler creates a serializable versioned instance with chosen hidden facts and canonical **non-cryptographic** content fingerprint. The generation seed is separate from the Party engine's Evolved check RNG. Because a naive xorshift of low neighboring seeds biased initial variants, a final integer avalanche mix was added; this is a deterministic content-choice quality correction, not an alteration to combat mechanics.

**Two authored data packages:** `adventures/after-the-storm.mjs` projects the accepted `SCENARIO` map, item stock and existing rescue structure into a validated manifest; `adventures/ridge-survey.mjs` defines a **genuinely different** field-study premise, five-room path network, ordinary walk-out ending and two seeded dimensions of research obstacles and animal disposition. `src/adventure-catalog.mjs` exposes list, validated copy and deterministic compile by ID. **Neither content variation nor the Ridge Survey fixture is yet wired to the current Party action loop. The full two-adventure runtime acceptance gate is NOT met.**

**Actual existing-runtime integration:** New `newPartyIncident` saves carry an `adventureBinding` with manifest ID/revision/schema version/fingerprint for accepted After the Storm. `isPartySave` rejects an incompatible changed binding, yet previously valid Party-v3 saves and v2 migrations lacking the optional binding remain valid. Existing `SCENARIO` behavior, Evolved dice, stress/panic, combat, physical dinosaur pursuit, named guide, Wonder, inventory and actor control stay unchanged. The browser's versioned module paths were refreshed. The existing Party engine and director still have singleton SCENARIO and hardcoded generator/radio/beacon/rescue logic; documentation explicitly says so.

**Tests:** Retained **454** existing tests, added **16** checks in `tests/adventure-definition-009a.test.mjs` for different maps/objectives, original Nublar parity, reproducible compilation, broad different-seed variant diversity, source content copy isolation, fingerprint stability/tamper detection, invalid physical graphs/item counts/effect scripts/creatures/prerequisites, new game save binding, legacy save compatibility and unchanged Evolved seeded action behavior; **470** target. Initial PR #20 runs exposed authored slot identifier validation and a seed-distribution weakness; corrected in code. A separate test had incorrectly demanded adjacent generation seeds produce different outcomes and was changed to assert actual distinct known seed examples plus broad-seed diversity. Exact final PR and accepted main CI/Pages must be verified separately.

**Limitations/next:** This is **009-A** only. No full engine/adventure separation, no usable second scenario, no completed procedural Cinematic or Campaign generation, no AI Game Mother. **009-B** must route every generic world action/director/save/objective/ending through a selected compiled AdventureInstance and pass two genuinely different end-to-end adventures and existing Evolved tests. The manual desktop/mobile graphical smoke remains unperformed. See [009-A report](docs/ADVENTURE-MANIFEST-009A.md). Preserve all legacy solo 006.2 and Worker v006 isolation and avoid further hardcoding *After the Storm* branches into the core.


## Architecture refinement — Variability in Authored Adventures + Procedurally Generated Cinematics/Campaigns — 2026-10-25

**User direction:** The game should ship **several pregenerated adventures**, but those adventures should **change meaningfully between runs**. The ultimate product should permit an **open-ended number of newly generated Cinematic scenarios and continuing Campaigns**, maintaining player uncertainty about human motives, threat presence, clues, difficulties and outcomes. Being familiar with an authored module must not mean knowing exactly what to expect next.

**Recovery:** GitHub main at start: `da17db8b8b07abba0f8d71b6192ab70877eff390`; accepted 007-M1 v0.7.20 and **454/454 regression tests**; main Actions [40210971102](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40210971102) and Pages [40210970636](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40210970636) successful. Prior architecture decision and tracking Issue #18 already required scenario/engine separation. No product runtime implementation of generation or replay variation existed.

**New authoritative contract:** [Procedural Adventures and Replayability](docs/PROCEDURAL-ADVENTURES-REPLAYABILITY.md) now defines (1) authored adventure **templates with substantial seeded variability**, (2) newly compiled **procedural Cinematic adventures** without a fixed rescue plot and (3) procedurally generated **Campaign chapters** governed by persistent character/world consequences. Variability concerns actual source of crisis, cast/relationships, valid NPC agendas, physical routes, species/dispositions, clues, resources, Wonder/danger/downtime, and real endings; *not* altered Evolved dice, retroactive hidden facts, arbitrary creature teleports or forced scares.

**Mechanism:** A seed/versioned adventure compiler establishes an internally consistent, validated manifest and locked initial latent truths using an RNG independent of gameplay Evolved dice. The bounded Game Mother proposes source-valid *typed events and effects* in reaction to player choices, but may not silently change culprit/hidden facts, break physical reachability, mint items or overturn resolved outcomes. Continue/load uses the same compiled manifest, event history and party knowledge; fresh replay may compile a different accepted variant. Campaign generation must respect prior resolved scenes, injuries, relationships and actor knowledge.

**Test gates:** First satisfy adventure-engine separation with two genuinely different playable adventures. Then demonstrate *same-seed reproducibility* and *different-seed structural replay diversity* for authored templates (not just different prose), plus validation of original generated Cinematics and coherent continuing Campaign chapters. All save versioning, physical conservation, actor privacy, Evolved source fidelity and the existing **454 accepted regressions** remain mandatory.

**Status:** **Planning/documentation change only.** No generated adventure compiler, replay variant engine, dynamic Campaign generator or AI Game Mother work was implemented or validated by this doc-only milestone. Existing party gameplay and 454-case suite remain unchanged; graphical desktop/mobile QA still outstanding. Issue #18 and the living roadmap now reflect the refined priorities.

## Architecture correction — Adventure/Engine Separation — 2026-10-25

**User requirement:** The eventual game must generate genuinely new and unpredictable Cinematic/Campaign adventures; the *After the Storm* scenario must never define the reusable rules engine or dictate every story's premise, location IDs, goals, supporting characters and outcome.

**Current accepted baseline:** GitHub main `1cd360a732982189130c8381ee17d1ca980bbf73` (007-M1 / v0.7.20 / 454 automated tests), Actions [40162256262](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40162256262) and Pages [40162256266](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40162256266) both successful. No new mechanics or browser release created by this architectural documentation.

**Finding:** `src/scenario.mjs` is already partly data-only, but **engine independence is not implemented**. `src/party-engine.mjs` imports it as a singleton and hardcodes the current rescue objectives, generator/radio/beacon, named zones, Velociraptor instance, fixed scenario-specific NPC encounter state and end condition. `src/cinematic-director.mjs`, `src/cinematic-scenes.mjs`, `src/cinematic-continuity.mjs`, `src/cinematic-danger.mjs`, `src/cinematic-encounters.mjs` and `src/cinematic-escort.mjs` mix reusable effect machinery with *After the Storm* plot/characters. Other affected modules are to be inspected, not presumed generic. Earlier prose claiming complete separation was inaccurate and has been corrected.

**Authoritative architecture:** [docs/ADVENTURE-ENGINE-SEPARATION.md](docs/ADVENTURE-ENGINE-SEPARATION.md). Game mechanics (Evolved dice, stress, initiative, injuries, world movement, perception, inventories, actions and saves) are stable generic services. Every adventure is independently authored/generated, validated and loaded as its own versioned manifest with physical locations, objectives, scene triggers, actual NPC/creature instances, encounter options, resources and conclusions. The Game Mother may generate a new adventure or propose scenes and typed effects, but may not mutate game state directly, conjure owned items, force rolls or rewrite historical events. Generated situations permit wonder, uncertainty, different goals and outcomes without an always-on ecological sim.

**Acceptance gate:** First migrate *After the Storm* behind a generic adventure interface while preserving previous 454 tests, v3 party saves, three control modes and source Evolved mechanics. Then create a **substantially different** second playable scenario and demonstrate both run without editing shared engine logic; validate independent maps, distinct objectives, outcomes, Evolved seeded replays, information privacy and version-bound save/reload. Add dependency checks preventing core-to-adventure imports. **Do not claim modularity or adventure generation complete until these tests pass.**

**Status:** Documentation and prioritization only. No core refactor, second adventure or generator implemented by this change. Prioritize this work **ahead of 007-M2** or more one-off Cinematic changes. Physical manual desktop/mobile QA remains outstanding.


## Checkpoint 007-M1 — Two Finite Lamp Replacement Cells — 2026-10-25

**Recovery:** Actual GitHub `main` was `de72f0e9ef0e885ae512f6d89a60bcb1144486a8`, **008-C1 / v0.7.19 / 440/440** tests, final [Actions 40160909599](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40160909599) and [Pages 40160909518](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40160909518) successful; no open PRs. Read project-state, latest audit, roadmap, existing lamp depletion/turn rules, scenario room inventories, give/take, save validation, camera, companion and all old equipment tests. Preserved all accepted 008-C1 guide, 008-B3 quiet wildlife, actor Wonder, Evolved skill/medical/stress/combat, shutter/rain/predator, three control modes, unrelated solo 006.2 and Cloudflare Worker v006.

**Implementation:** Author **exactly two** original sealed replacement cells, one in the **Maintenance Shed** and one at the **Emergency Helipad**, using existing rooms and ordinary item pickup/transfer (including same-room actor requirements). New `src/finite-resources.mjs` defines stable `battery_cell` item, stock limit two, personal carrying count, valid local replacement choices and a saved physical conservation bound. The engine accepts `battery replace` / ordinary natural-language equivalents only for an actual owner of a rechargeable-by-swap light below maximum charge who carries the physical cell and is out of combat. Successful swap consumes **one real cell** permanently, records before/after charge, restores the already accepted `LIGHT_CAPACITY_STRETCHES` maximum, costs a normal exploration turn and leaves the lamp **OFF**. Turning on light requires a separate accepted action and retains raptor detection, darkness and hidden-world rules. No arbitrary Evolved skill check or free light gain.

**Integrity:** New optional Party-v3 `batterySpent` initialized to zero; quantity counted across `rooms[].items`, actor `inventory[]` and `batterySpent`, rejecting illegal stock beyond two. Valid legacy party saves without the field or without new cells stay loadable; no schema bump. The browser presents only the currently viewed actor's carried spare count, charge and action availability, **not offsite stock or another survivor's reserves**. Original consumables, medical clocks, NPC escort, solo 006.2 and separate Cloudflare Worker v006 remain unaffected. Battery items are fungible and not independently serial-numbered; full unique provenance per cell is a deferred extension, not falsely claimed now.

**Tests:** Retain accepted **440** regression cases; add **14** focused tests under `tests/finite-batteries-007m1.test.mjs` for valid authored placement, pickup/transfer, committed consumption, spent stock, restored lamp charge, separate lamp-on action, no duplicated/remote items, rejecting nonlamp/full-charge conditions, legacy saves, privacy and browser parser, targeting **454**. First PR #16 candidate [40162021440](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40162021440) passed **454/454**, 0 failures. Final documentation-inclusive PR and accepted-main Actions/Pages are required separately. **Real interactive desktop/mobile browser smoke remains outstanding.**

**Next:** Further bounded 007-M2 park tools or move toward 007-N typed conversational Game Mother and a completed standalone Cinematic rescue adventure. Avoid unnecessary island-wide ecology or energy management.


## Checkpoint 008-C1 — Original Park Guide Escort and Accountable Rescue Consequences — 2026-10-24/25

**Recovery:** Actual GitHub `main` `9cb9e3d5181b198ea0e24c1b7b350b46a680043d`, accepted **008-B3 / v0.7.18 / 424/424**, Actions [40160097813](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40160097813) and Pages [40160096998](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40160096998) both successful. No open pull requests. Recovered authoritative `project-state.json`, latest audit, living roadmap, existing scene/guide-like dialogues, rescue generator/radio/beacon operations and deterministic Party engine. Preserved private *Alien RPG Evolved Edition* authority, Wonder, physical predator/squall/shutter, existing wildlife, three control modes, all previous cases, party v3 save/v2 migration, original 006.2 solo and Worker v006.

**Original Cinematic rescue thread:** One original visitor-services employee **Mara Velez** is authored at **Visitor Center Lobby** in `src/cinematic-escort.mjs`. A capable survivor physically in that room can choose a **one-time context-dependent conversation** (no free cure/time/dice) or a true **Evolved Manipulation** check to persuade Mara to accompany the party; action time, deterministic rolls, stress, push, wound modifiers and failure are authoritative. A failed attempt is recorded and cannot be freely farmed; another present survivor can try. Success names the sole legitimate escort. Only when that exact escort **successfully traverses an actual adjacent movement edge** does Mara change rooms; staff-card door, shutter and escape conditions remain enforced. An actual co-located teammate may take over escort; Mara can be sheltered at the real reinforced control room and picked up again, or accounted for at the actual helipad, each costing a normal exploration action. No remote map-knowing companion AI and no invented item or wildlife activity.

**Player-influenced rescue ending:** The **existing successful Comtech beacon activation** remains the core mission victory; it now commits a factual Mara epilogue distinguishing **mustered at pad**, **physically at pad but not accounted for**, **left sheltered in control**, or **elsewhere unaccounted for**. The game does not fabricate her pickup if she was left on the island; it also does not force her escort or change all existing survivor rescue contracts. A literal Evolved NPC combat/medical sheet and autonomous NPC dialogue are **not implemented** in this increment, which is explicitly documented rather than disguised.

**Integrity:** `parkGuide` is an optional schema-v3 state; earlier saves without it assume the original lobby-bound waiting guide. Validation rejects forged IDs, duplicate conversation/persuasion records, invalid status, invalid zones, remote escort and invalid shelter/muster locations. Local browser projects only the guide physically present to the viewed survivor; a postgame epilogue is a public final fact. Existing Party/Focus/Spectator ownership, multi-PC creation, action budgets, seeded combat/stress/medical clock, original Wonder journal, prior 008-B3 calm Parasaurolophus and scripted survivor conversations, solo 006.2 and Worker v006 are unchanged.

**Validation:** **424** accepted regression cases retained and **16** new tests in `tests/cinematic-escort-008c1.test.mjs` targeting **440 total**. Initial PR #15 candidate GitHub Actions [40160684489](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40160684489) passed **440/440**, 0 failures. New documentation revisions need final exact-PR-head CI; accepted main Actions and Pages are separate acceptance gates. **True desktop/mobile interactive graphical smoke has not been performed.** See [008-C1 NPC escort rules](docs/CINEMATIC-ESCORT-008C1.md).

**Next:** Expand finite 007-M rescue gear/tool choices and further connected Cinematic human drama, then 007-N typed and bounded natural-language Game Mother. Do not build a wildlife population simulator as a prerequisite to believable dinosaur situations.


## Checkpoint 008-B3 — A Peaceful Parasaurolophus and Actual Survivor Dialogue — 2026-10-24

**Recovery:** GitHub `main` `1caf0cb40b6de0728e646a140241a696fbc2fb48`, accepted **008-B2 / v0.7.17 / 405 tests**. GitHub Actions [40066106647](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40066106647) and Pages [40066106457](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40066106457) both successful; no open PRs at start. Preserved original Jurassic scenario, private Evolved mechanical authority, deterministic movement/combat, all three party modes, personal Wonder, previous conditional scenes, pressure, danger, physical raptor, shutter, squall, v3 saves and isolated solo 006.2 / Worker v006.

**Authored living-dinosaur scene:** New `src/cinematic-encounters.mjs` situates an original non-combat **Parasaurolophus** across the jungle drainage stream and bank. It is an actual authored locale with persistent scene status, **not** a new always-simulated herd or monster attack token. The survivor can **watch** peacefully, paying ordinary exploration time with no unnecessary dice, or **approach** through the existing Evolved **Mobility** check (seeded real skill dice, Stress, push and injury effects). Success preserves a calm encounter; failure causes retreat into foliage with actual **noise 2** passed to the physical Velociraptor hearing/pursuit code and recorded on the accepted action. No free damage or compulsory monster appears. The animal is obscured by the real authored squall, and a genuine nearby Velociraptor's arrival/position persistently causes withdrawal rather than convenient respawning. Witness/approach histories and departure cause persist for valid participant IDs, and local character views respect which survivors have actually seen the animal.

**Human interaction:** Survivors can now choose two local **actor-to-actor** conversations: a genuine health/stress **check-in** or a discussion of their **real current rescue plan**. This is optional authored dialogue between existing living, capable, same-room survivors, disallowed in combat. Unique speaker/recipient/topic records persist, with beat and valid physical zone; remote/fabricated/dead participants are rejected without mutations. These are deliberately no-roll, no-time narrative conversations without a free Stress cure, wound treatment, new NPC or unbounded model dialogue. Companion AI remains the accepted bounded offline policy.

**Integrity:** The engine alone commits actions, RNG, elapsed time, Evolved outcomes and sound. The browser adds local **watch**, **approach** and **talk** choices. Optional `wildlifeEncounter` and `dialogueRecords` in party **schema v3** are backward compatible when absent, reject forged/duplicate identities, and do not alter v2 migration, personal Wonder, previous cross-scene consequences, legacy solo or Worker. Source and expected results detailed in [008-B3 specification](docs/CINEMATIC-ENCOUNTERS-008B3.md).

**Validation:** Accepted baseline **405** retained and **19** focused tests added under `tests/cinematic-encounters-008b3.test.mjs`, **424 total**. Initial PR #14 run [40159837344](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40159837344) had **423/424** because an actually propagated noise value was missing from the new action journal; fixed, and subsequent PR run [40159872826](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40159872826) passed **424/424**, no failures. Latest documentation-inclusive PR and accepted-main Actions/Pages must still pass separately. **Manual desktop/mobile real graphical smoke remains unperformed.**

**Next:** Develop a fuller Cinematic adventure with original human NPC dialogue, branching rescue/recovery outcomes and finite 007-M tools, followed by bounded 007-N Game Mother proposal processing. Full source-verified Evolved encounter/danger-timer and Campaign parity, a full NPC system and dynamic herbivore populations remain future work; a Zoo Tycoon simulator is not an acceptance prerequisite.


## Checkpoint 008-B2 — Earned Cross-Room Discoveries and Cinematic Continuity — 2026-10-24

**Recovery first:** Current `main` `7791f0c772bb5f2b116891cfbec94676185a8b1f`, accepted **008-B1 / v0.7.16 / 389/389** regression tests. GitHub Actions [40065152590](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40065152590) and Pages [40065152207](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40065152207) both succeeded. No open PRs at recovery. The last accepted 008-B1 scene danger, real Evolved skill engine, Party/Focus/Spectator, v3 save format, Wonder discoveries, 008-A d6 pressure, physical shutter/squall, Velociraptor, solo 006.2 and Worker v006 were preserved. Real desktop/mobile hands-on graphical QA is still unperformed.

**This actual game increment:** Added `src/cinematic-continuity.mjs`, a pure actor-local projection of previously committed investigation results, discovered clues, gate repairs and rescue flags. The authored control-room consoles investigation now contains an original auxiliary-generator priming diagnostic. Only a survivor who **actually succeeded** on the existing paid Observation check to study the consoles receives the retained `control:consoles` discovery and may earn a **+1 situational Heavy Machinery base die** on that *survivor's* later normal generator start in the Maintenance Shed. It uses the exact previously accepted Evolved `result()` resolver, with unchanged seeded dice, stress/push/wound treatment, action time, ability to fail and ordinary generator noise; its action journal records whether the bonus was applied and which successful observation supplied it. Another actor never gains the bonus merely because a teammate learned it. Studying the consoles is optional and skipping it does not prevent generator use.

**Connected scenes:** `src/cinematic-director.mjs` now contains **eleven** typed optional Cinematic scene opportunities instead of seven. Four new, grounded beats are unlocked by the current character's prior successful console study, successful jungle tracks study, physically braced paddock gate, or genuinely sent distress call. Current location matters, the original physical storm/wonder constraints remain and events can be skipped without forced danger. The local `sceneForActor` narrator and browser `sceneConsequences` surface relevant continuing effects, including a braced gate visible to anyone actually standing there, a private failed repair remembered only by that survivor, prior track evidence without remote omniscience, and a successful distress call without inventing rescuers. The resulting gameplay connects *investigation → meaningful mechanical knowledge → repair*, and *physical optional danger → changed local scene*, within the already persistent rescue mission and its three derived acts. **No monster spawn, ecology sim, NPC invention or compulsory encounter** was added.

**Save and scope:** Uses existing party v3 actor `observed`, `sceneRecords`, `dangerRecords`, actual mission flags and action journal; no schema bump or mandatory new saved field. Existing v3 saves and v2 migration, three agency/camera modes, local knowledge separation, personal Wonder journals, Evolved stress/panic and other combat procedures remain intact. This is original Jurassic scenario writing and an original source-compatible situational modifier—not a claim to a published Alien generator table. Private Evolved PDFs, unrelated projects, original solo and existing Worker deployment were not modified.

**Validation:** **389** accepted tests preserved, **16** new tests at `tests/cinematic-continuity-008b2.test.mjs`, targeting **405 total**. Initial feature PR #13 candidate [40065841783](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40065841783) passed **405/405**, 0 failures. Later documentation must pass fresh final-PR-head validation, then independent final-main Actions and Pages on the accepted SHA. **Manual desktop/mobile interactive graphical smoke remains outstanding.**

**Next:** Proceed to bounded 008-B3 genuinely connected scenario episodes with human dialogue, recovery, meaningful optional physical dinosaur encounters and player-driven variation, and 007-M finite tools as applicable. The 007-N typed/conversational Game Mother, complete source-verified Evolved Last Survivor/Cinematic procedure parity, and physical peaceful herbivores remain future work. Do not substitute an always-running island animal ecosystem for cinematic roleplaying. See [008-B2 design and test report](docs/CINEMATIC-CONTINUITY-008B2.md).


## Checkpoint 008-B1 — Real Evolved Paddock Danger and Cinematic Act Continuity — 2026-10-24

**Recovery:** Inspected current GitHub main at `f8b4e42bdb2c7302f3dd2e6e1f9a03520b5f7d21`, accepted **008-A / v0.7.15 / 377/377 deterministic tests** with successful final Actions [40064428874](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40064428874) and Pages [40064428629](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40064428629). No open PRs at session start. Preserved the existing Evolved dice, stress/push, physical raptor, character-owned Wonder, typed 008-A scene events and pressure, room geometry, weather/shutter, Party/Focus/Spectator, legacy 006.2 solo and Worker v006. Manual desktop/mobile interactive game QA remains outstanding.

**Player-facing connected incident:** `src/cinematic-danger.mjs` derives an actor-readable **three-act Cinematic frame** from actual committed scenario objectives: (I) silent blackout, (II) restored power with distress signal pending, and (III) distress/helipad beacon/evacuation. This is deliberately a read-only, nonforced connection among already-playable rooms and objectives. The player may skip, observe, investigate or revisit rooms in any allowable order; no scripted film reenactment, artificial NPC, forced climax, teleport or GM-only inference.

**One mechanical optional scene danger:** The already authored bent **Raptor Paddock Gate** now offers `danger brace-paddock-gate` / an **Attempt challenge** button only to an actually present, capable survivor who has not already attempted it, while out of combat and before anyone secures it. This is an **original Jurassic hazard**, not copied from any proprietary Evolved event table. The engine rolls the accepted **Heavy Machinery** skill with Evolved seeded base/stress d6, valid push, current wound modifiers and stress side effects, using the established `result()` wrapper. A successful check permanently braces the existing gate; a failed check produces noise **3** through the same physical sound/Velociraptor hearing code, creating a real possible complication without guaranteeing an encounter, injury or monster appearance. Both successes and failures consume a legitimate exploration action and Evolved time. No item is fabricated or required for the gate brace; loose damaged gate components are already scenario-authored. A different on-site survivor can try after a failed individual attempt.

**Save and knowledge:** Party v3 acquires only optional `dangerRecords` with unique actor/event, valid authored zone, beat, successes and Boolean outcome; optional Boolean `flags.paddockGateBraced` defaults to false in old saves. Invalid or duplicate forged records reject. Repair status is visible to characters **at the gate only**; it is explicitly excluded from remote `partyView.flags` and corresponding companion observation. Personal Wonder discoveries, 008-A pressure/scene records, all other actor privacy, older v3 saves and v2→v3 migration are unchanged. The live browser shows current act, available optional challenge and local repaired state.

**Tests:** All **377** previously accepted tests preserved, **12** focused new tests under `tests/cinematic-danger-008b1.test.mjs`, target **389 total**. Initial candidate [40064947979](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40064947979) passed **389/389**, 0 failures. Subsequent docs commits require final PR head and accepted-main GitHub Actions/Pages checks, reported separately from **unperformed desktop/mobile graphical smoke**.

**Limits/next:** This is **008-B1**, not a complete mechanical danger-system implementation, full Evolved Last Survivor/Cinematic RAW event parity, full autonomous AI Game Mother, connected multi-adventure campaign, human NPC dialogue or physical peaceful herbivore encounters. Continue **008-B2** mechanically meaningful conditional scene outcomes and truly connected cinematic chapters, plus finite 007-M park gear/repairs; preserve the three Alien-to-Jurassic pillars and never mandate island-scale wildlife simulation. Details: [008-B1 specification](docs/CINEMATIC-DANGER-008B1.md).


## Checkpoint 008-A — Typed Cinematic Scenes and Bounded Actor-Local Encounter Pressure — 2026-10-24

**Recovery:** GitHub main `c2dc99ec329b5ff23f3be8a81a585825df1a2d77`, checkpoint 007-L2b2 v0.7.14, **362/362 accepted deterministic tests**. Both main Actions [40062731738](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40062731738) and Pages [40062731838](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40062731838) were successful. No open PRs at start. Manual desktop/mobile graphical gameplay smoke remained outstanding. Read accepted roadmap, `project-state.json`, new scene contract, private Evolved authority references, current party action parser, director, Evolved dice utilities, camera privacy and previous tests. This work remains exclusive to Dinosaur Horror RPG.

**Implemented player-visible narrative:** `src/cinematic-director.mjs` now authoritatively defines **seven original typed Cinematic event opportunities** in the existing seven-zone scenario. They are visible only for the current actor in the proper physical room when immutable preconditions (power, actual distress signal or committed squall) permit them. Player may activate via `scene <event-id>` or an **Experience scene** button. `partyStep` accepts each event only once per actor with a validated ID and local preconditions, committing actor-private `sceneRecords` and actor events. These strictly narrative actions are deliberately **free** like accepted personal Wonder moments, do not manipulate RNG/game time/stress, create a dinosaur, move people, change inventory/objectives or force combat. Existing Wonder discoveries and the initial scenario mission continue unaffected. Autonomous companions currently pursue the accepted bounded goal policy; this checkpoint does **not** claim an AI scene-directing Game Mother.

**Original encounter-pressure adaptation:** Accepted outdoor exploration (`move / sneak / rush / investigate / wait`) adds a **character-specific d6 pressure check** with one die by default plus earned pressure, a quiet-motion reduction and rushing increase, capped at six. Every **1** raises that survivor's level up to five. The check seed derives from the initial accepted seed, beat and actor ID; it records faces on the accepted action but consumes **no global mechanical RNG** and **never spawns, teleports, attacks or auto-summons an animal**. At the top level, a heavy-footfall clue is emitted to the actor **only if the existing physical Velociraptor is within legal audible proximity**; otherwise no creature cue is invented. Pressure does not force rising terror on peaceful Wonder actions.

**Evolved fidelity:** This is a **documented original Jurassic scene/pressure house rule inspired by the Evolved Last Survivor and Cinematic approach**. It is *not* an exact transcription or implementation of all published encounter/danger timers, full Campaign/Cinematic GM procedure, three-act campaign engine or source signature-attack tables. Existing Evolved dice/stealth/stress/combat, medical injury, physical shutter/storm and the full prior 007-L sequence stay untouched. The next milestones may implement additional source-grounded danger/event effects explicitly; elaborate Zoo Tycoon ecology is not a prerequisite.

**Persistence/security:** Two optional party-save-v3 fields (`sceneRecords`, `scenePressure`) default to empty for older v3 saves. Save validation rejects forged unknown events, wrong room, duplicate actor-event records, future beats, unrecognized actors and illegal pressure values. Action ownership still uses Party/Character/Spectator `partyStep`; camera modes do not reveal distant scene availability, other survivors' scene journals or hidden dinosaur position. Legacy solo 006.2, Worker v006, Character Lab, v2→v3 upgrades and personalized Wonder journals remain compatible. No private Evolved files or secrets entered GitHub.

**Tests and gates:** Baseline **362** retained; **15 new** focused tests under `tests/cinematic-director-008a.test.mjs`, target **377**. The additional final regression disallows the distant herbivore scene during sight-obscuring heavy rain, re-enabling it after the squall. Initial PR run [40063940016](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40063940016) flagged two old assertions due to a stale party director browser import, fixed without removing tests. The next candidate run [40063985601](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40063985601) passed **376/376**; new documentation commits must receive final-PR-head Actions verification. Accepted main CI and GitHub Pages require independent verification; actual interactive desktop/mobile graphical QA remains unperformed.

**Next:** Develop a *source-verified* typed mechanical danger-event contract and first connected multi-scene Cinematic adventure with genuine quiet, meaningful repairs and believable physically present dinosaur encounters. Advance finite 007-M physical park tools/batteries in parallel. Do not prematurely claim full Evolved Last Survivor timer parity, actual multi-scene AI GM, human NPC dialogue, additional simulated herbivores or completed graphical QA. See [the 008-A report](docs/CINEMATIC-EVENT-DIRECTOR-008A.md).


## Checkpoint 007-L2b2 — Physical Service Shutter and Bounded Tropical Squall — 2026-10-24

**Recovery:** GitHub `main` recovered at `beefa2a98599a3a47bd46afa75c18b83410ca726`, accepted **007-L2b1**, version **0.7.13**, **346/346** deterministic tests, Actions [40061545463](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40061545463) and Pages [40061545274](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40061545274) successful. No open PRs at start. Manual desktop/mobile gameplay smoke outstanding. Existing Evolved initiative/defense/dice, original physical cover and predator pounce, actor-owned Wonder and Dread, 007 series three control modes, and 006.2 solo/Worker v006 were preserved.

**Playable 007-L2b2:**
- Authored one genuinely **operable storm shutter** at the shared Maintenance Shed / Jungle Service Path doorway. Existing `use` action operates it from either side with real time/action cost; default open. Closing prevents dinosaur and survivor travel in either direction, blocks light/sight across that opening, attenuates (does not magically extinguish) sound, and makes a stale approach-pounce route ineligible. Invalid blocked travel is refused *before* rolls or elapsed game time. The player UI shows its local status and disables blocked routes.
- Added **one deterministic tropical squall** at exploration stretches **2–3** of *After the Storm*. It occludes the authored jungle–helipad and shed–jungle one-zone sightlines while preserving same-room sight, movement, sound, creature action economy, seeded rolls and combat damage. Conditions derive from the committed exploration clock; no random/global weather simulation, creature spawns or ecology.
- `src/dinosaur-environment.mjs` supplies pure shutter and weather context; `dinosaur-visibility`, `dinosaur-pursuit`, `dinosaur-hunt`, `dinosaur-encounter`, and `party-engine` consume the appropriate physical conditions. Companion AI uses only locally passable exits, and separated actor views cannot read the shutter state from global mission flags. Normal actor/character camera, save/replay, original predator reactions and Wonder discoveries continue to function.

**Compatibility and authority:** Private Alien Evolved exploration/stealth, initiative, combat and injury rules remain governing; shutter/rain effects are **original, limited Jurassic scenario adaptations** fully documented in `docs/DINOSAUR-ENVIRONMENT-007L2B2.md`. The optional Boolean `flags.serviceShutterClosed` is compatible with existing party v3 saves (absence means open); invalid nonboolean values reject. Party v2→v3 migration remains. No private book files, copied creature tables, Worker edits, standalone solo modifications or unnecessary population/ecology simulation.

**Validation:** All **346** prior cases retained, **16** additional tests in `tests/dinosaur-environment-007l2b2.test.mjs`, **362 total**. Initial PR run [40062504129](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40062504129) failed due to omitted commas in new scenario description text, corrected immediately. Corrected PR run [40062545619](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40062545619) passed **362/362**. Further documentation commits require fresh final PR run and final accepted main Actions/Pages checks; **manual desktop/mobile graphical gameplay remains unperformed**.

**Next:** With 007-L bounded core environmental and attack mechanics implemented, advance *Alien*-style **typed scene/event/encounter pressure** and **007-M physical resources** as complementary, scenario-driven tasks. Genuine narrated cinematic adventures and the multi-actor AI Game Mother are still future work. Do not claim all Evolved source rules, full campaign engine, animal population simulator or graphical QA complete.


## Checkpoint 007-L2b1 — Earned Velociraptor Pounce and Lit Concealment — 2026-10-24

**Recovery:** Began at `main` `fc47d92479a7a14713f5c942d3632c8a4409842e`, accepted **007-L2a** plus read-only cinematic scene framing, version **0.7.12**, **333/333** tests, final Actions/Pages green, graphical browser smoke pending; no open PRs. Read current `project-state.json`, the Living Game Vision, Alien-to-Jurassic scene contract, 007-L1/007-L2a movement/sightline rules, Evolved attack/defense procedures, combat scheduler and acceptance tests.

**Original Jurassic combat addition (not copied Alien attack table):** `src/dinosaur-encounter.mjs` validates a living, actually colocated, physically exposed target. It specifies the existing regular bite (6 attack dice, 2 base damage) or a distinct approach pounce (**7 attack dice, same damage**) only when a genuinely traversed adjacent stalk/investigation route ended in the target's zone, the reinforced staff door was legitimately passable, and the attack is the first attack after that approach during combat round one. A pounce earns **one extra die, not a free attack or guaranteed damage**. Prior attack records prevent repeated pounces; an old/blocked/impossible hunt or a later round falls back to the ordinary bite. The existing separate +2 dice surprise rule, initiative cards, pre-strike Close Combat defense/legacy prepared dodge, armor subtraction, critical wounds and medical timers remain unchanged. The committed action journal now records the specific tactic and exact dice; actual seeded attack and defensive rolls remain in the accepted Evolved-style resolver.

**Concealment correction:** A physically hidden survivor with an active personal lamp in the predator's **same** zone is exposed; attempting to hide with the lamp already on rejects before a dice/time charge, and switching on a light while under cover reveals the actor. Previously accepted dark physical cover, authorized Observation search, actor-only visibility and no remote omniscience remain intact. The combat scheduler now handles legacy v3 hidden/light-on cases as exposed rather than falsely excluding them.

**Engineering:** Live party/browser modules and versioned static imports updated for the newly written encounter code, with no changes to original 006.2 solo, Worker v006, character creation or personal Wonder journals. Save kind `dinosaur-party-incident` **v3** and v2→v3 migration remain unchanged; no mandatory island/ecology simulation, other species or artificial scene events. The revised Evolved fidelity/house-rule specification is [007-L2b1](docs/DINOSAUR-ENCOUNTER-007L2B1.md); roadmap still prioritizes scene-led Cinematic/Campaign play.

**Validation evidence:** **333** previously accepted tests preserved, **13 new** tests (`tests/dinosaur-encounter-007l2b1.test.mjs`) for **346 total**. Candidate run [40061415753](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40061415753) passed after correcting an outdated browser import assertion; later documentation commits require a fresh final-head run, and post-merge `main` Actions and Pages must be checked separately. **Desktop/mobile interactive graphical play remains untested**.

**Limits and next:** This is **007-L2b1**, a validated partial 007-L2b feature. The bounded **007-L2b2** environmental-visibility/physical-obstruction gate remains, then 007-M scenario supplies and 007-N typed natural-language Game Mother. The separate scene/event director and encounter/danger pressure can progress in parallel; no Zoo Tycoon-style simulator prerequisite.


## Alien-to-Jurassic scope correction and first Cinematic scene framing — 2026-10-23

**Recovery:** Started from accepted main `e10d7f8971ff0194d138633438a7204aac0d8897`, checkpoint **007-L2a**, v**0.7.12**, **324/324** accepted tests; Actions and Pages passed, desktop/mobile manual gameplay smoke outstanding. No open PRs at start. Preserved current Velociraptor stalking/facing, accepted 007-K personal Wonder journals, Party/Focus/Spectator controls, Evolved mechanics, party saves v3/v2 migration, legacy solo 006.2 and separate Cloudflare Worker v006.

**Design correction:** User clarified that the goal is a faithful *Alien RPG Evolved Edition* adaptation with **Dinosaur Horror, Sci-Fi Action and Sense of Wonder**, not Zoo Tycoon ecology. Corrected the living roadmap, Wonder design, README and added `docs/CINEMATIC-SCENE-CONTRACT.md`. Mandatory island-scale animal populations, feeding, breeding, herd migration and needs simulation are no longer acceptance gates; credible species-specific **encounter** behavior and GM-driven cinematic events/pressure remain required. Campaigns should comprise linked player-responsive scenes of varied tension, not uninterrupted escalation or scripted film reenactments.

**First implemented scene slice:** Added pure `src/cinematic-scenes.mjs` with one location-based situation/opportunity for each of the seven existing zones and objective-grounded variants for restored power, radio and helipad. `partyView` now projects `cinematicScene` only for the chosen actor's present zone; `src/party-app.mjs` displays scene title, tone, current opportunity and possible approaches alongside existing physical affordances. No scene event spawning, new species, rolls, resource/time use, fight enforcement, hidden facts, migration, Worker change or save-schema change. Asset query updated to load new browser UI.

**Validation target:** Retain 324 earlier tests and add nine in `tests/cinematic-scenes.test.mjs` (local projection, seven scenes, conditional objective flags, no hidden dinosaur inference, no RNG/time mutation, actor privacy, save/restore, invalid-action preservation and browser wiring), for **333 total** expected. Test on GitHub Actions candidate and final accepted main; verify Pages independently. **Manual desktop/mobile graphical QA remains unperformed** and is not included in automated results.

**Next:** Continue **007-L2b** species-appropriate Velociraptor attack eligibility/constraints as the next accepted raptor milestone, while developing a typed optional/conditional scene-event and source-grounded encounter/danger pressure boundary in parallel. The first fully playable multi-scene Cinematic adventure and generative Game Mother remain future work. No mandatory virtual-ecosystem detour.


## Checkpoint 007-L2a — Route-Constrained Stalking and Directional Predator Vision — 2026-10-23

**Recovery:** Inspected GitHub main at `f12693c3ac15f830aff1127a0b622c6ae7d8bc3a`, checkpoint 007-L1 version 0.7.11; 307 previously accepted tests, GitHub Actions and Pages successful, manual desktop/mobile browser smoke still outstanding. Read current Living Game Vision roadmap, Wonder and Dread, Evolved authority, spatial/pursuit/stealth reports, all relevant engine and regression files. No newer active PRs or accepted gameplay were present when work began. Preserved checkpoint 007-K lighting, 007-L1 physical cover, personal Wonder discovery journals and original scenario.

**New playable behavior:** Implemented deterministic `src/dinosaur-hunt.mjs`, integrated into `src/party-engine.mjs` and facing-aware `src/dinosaur-pursuit.mjs`. Strong clue alert 4–6 triggers investigation movement every **two exploration actions**; alert 1–3 creates deliberately slower actual stalking every **four exploration actions**. Both take at most one physically traversable graph edge, and both lose interest with existing finite decay; blocked doors prevent passage. The Velociraptor now orients to the first legal path segment of an actually heard clue and faces its onward route, enabling one-zone directed observation of switched-on flashlights only through approved authored sightlines. After the light goes out, historic `lastClue=light` no longer grants current sight. Separate sound paths remain unaffected. An optional `lastHunt` state saves beat, origin/destination, blocked status and phase; validation rejects nonadjacent movement, future beats, blocked teleportation and impossible facing. Initial facing is chosen lazily from the animal's actual map location on first exploration action for old saves and authorized combat test worlds, not hard-coded to an assumed paddock.

**Authority and adaptations:** Privately supplied Alien RPG Evolved Edition stealth/exploration pp. 54–58 and initiative/combat pp. 59–67 remain the procedural baseline. The 2/4-action pursuit cadence, zone-facing and clue/visibility heuristics are **explicit, tested original Jurassic house rules**. They do not replace existing Evolved-style skill rolls, separate base/stress dice, full/quick action budgets, surprise, player-chosen defensive interruptions, injury, death or medical timing. No new copyrighted creature/attack tables or unapproved combat bonuses were introduced.

**Validation:** All **307 previously accepted tests** retained, with earlier UI asset-version assertions updated rather than removed. **17 additional tests** in `tests/dinosaur-stalking-007l2a.test.mjs` cover legal and blocked route pacing, hearing-vs-vision and facing, actual hunt travel, finite stale interest, invalid records, seed/RNG consistency, spectator/camera privacy, old v3 saves and JSON replay, actor-only Wonder journal, and extinguished-light cues. **324 total** expected. Latest green candidate GitHub Actions run **39980066133** validates the source before final audit/roadmap changes; require a successful final-branch run and then a post-merge main Actions and Pages check. **Manual interactive browser testing remains outstanding** and is never included in the automated count.

**Compatibility:** Save kind `dinosaur-party-incident`, version **3**, v2 migration, human/AI ownership, 1–8 Character Lab, personal Wonder scenes and the separate 006.2 solo implementation remain unchanged. Cloudflare Worker v006 source/deployment unchanged; no Worker redeploy. New `facing` and `lastHunt` are optional, validated creature properties. No private book pages, secrets or user-uploaded files committed.

**Outstanding:** 007-L2b requires species-appropriate approach/attack eligibility, dynamic occlusion/weather, original raptor combat consequences and grounded environmental interaction. The full 007-L milestone is **not** complete. 007-M batteries/repair systems and 007-N bounded GM remain gated. See [007-L2a source-fidelity report](docs/DINOSAUR-STALKING-007L2A.md) and the [living roadmap](docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md).

## Roadmap reconciliation — Living vision and status normalization — 2026-10-23

**Recovery:** Inspected GitHub `main` at accepted 007-L1 commit `81b9d49f56c470cb33208ba94a0d642710ce1429` (v0.7.11; 307/307 Node tests; final main CI [39957604441](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/39957604441) and Pages [39957604697](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/39957604697) successful). No new mechanics, private materials, Worker, solo game or save-schema changes were introduced by this documentation task.

**Living plan:** Revised `docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md` into the shared long-range vision and roadmap: preserved Evolved source authority, exact seeded dice and three ownership modes; added permanent Wonder and Dread/ecology requirements, current implemented-vs-pending truth, 007-L1 current state, 007-L2 → 007-M → 007-N gated milestones, longer-term animals/NPCs/campaign systems, user-facing end-to-end acceptance and agent-friendly change-management/read order. `README.md` now links the living plan. `project-state.json` now points to the roadmap and corrects stale top-level implementation, milestone acceptance (307 tests, not 280) and already successful 007-L1 Pages status. Historic checkpoint reports are retained as historical snapshots.

**Validation boundary:** Documentation/state consistency update only; test/Pages runs for the docs change must be checked on the final accepted commit. Actual desktop/mobile interactive gameplay smoke is **still outstanding**; no new gameplay claims or release-version bump. Further mechanical work continues at **007-L2**.


## Checkpoint 007-L1 — Spatial Visibility, Physical Cover and Velociraptor Senses — 2026-10-23

**Recovery and concurrency:** Began from authoritative 007-K `5bcf9f169b7e222fc40e890f24efd51b087c3ea7` (280/280 CI and Pages green, manual smoke outstanding). During this development the project's other validated Wonder and Dread additions reached `fdc7e77e84ae8f371fa18007f665f8bda50ae5b5`, adding 10 personal ecology-discovery tests (290 total). Rather than overwrite the new features, rebuilt this milestone on that newer validated head and preserved authored wonder scenes, personal journal and browser UI. Earlier conflicting draft PRs #2 and #3 are superseded by the reconciled PR #4.

**Playable 007-L1:** Added `src/dinosaur-visibility.mjs`: directional, bounded one-exit sightlines; jungle canopy, locked staff door, physical cover; a Velociraptor-only sensory profile with observation, hearing, search and decaying awareness stage. `src/dinosaur-pursuit.mjs` now uses source-owned visibility instead of assuming all traversable exits permit sight. `src/party-engine.mjs` resolves `hide behind [existing cover]` with the real actor's seeded Mobility and saves validated `coverId`; stationary cover cannot travel between rooms. Existing one-stretch active searches now derive timing and dice from species profile. Actor-visible adjacent animal glimpses require personally powered light and do not expose distant zone coordinates. Offline AI's `src/party-director.mjs` sees only its local sensory projection and may seek actual nearby cover. Party browser shows relevant distant warnings and named concealment controls without offering impossible cross-room attacks. Complete 007-K lighting, combat, stress, defense and recovery mechanics remain.

**Rules fidelity and house rules:** Private Alien RPG Evolved Edition stealth/hiding and time sections, printed pp. 54–58, govern dice/time principles; pp. 59–67 continue to govern existing action costs and combat. Seven-zone directional geometry, Velociraptor sight/hearing attributes, cover placements and awareness stage labels are original Jurassic-specific rules and do **not** purport to copy Evolved creature tables or licensed materials. `stalk` currently records approach state, not a complete special stalking movement or attack feature.

**Validation:** 290 previously accepted tests, including Wonder and Dread, retained. 17 new deterministic spatial, cover, sightline, privacy, seed/replay, control and UI regressions added, giving **307 total**. Candidate's latest fully implemented test pass: 307/307 on [GitHub Actions run 39957104770](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/39957104770); commit's later audit documentation requires final CI verification before acceptance. The original 006.2 solo prototype, private rulebook, v3 save kind and Cloudflare Worker were not altered. A final main workflow, Pages deployment and **manual graphical desktop/mobile gameplay** must be checked separately; do not count unavailable browser QA as passed.

**Remaining 007-L2:** real species-specific stalking/ambush choices, direction and dynamic occluding objects, changing conditions/weather, attack signatures and consequences, all physically grounded and seeded. **007-M** inventory batteries, repairs and park hazards is gated on completion/validation of 007-L. **007-N** bounded compound natural language is also gated. See [007-L1 report](docs/DINOSAUR-SPATIAL-007L1.md).

## 007-K Wonder Pass — Beauty, living ecology, and personal discoveries — 2026-10-23

**Design decision:** Wonder and beauty must be equal creative pillars with suspense, survival and horror. Dinosaurs are living animals with natural behaviors, not merely hostile monsters. Peaceful observations should sometimes remain peaceful. See `docs/WONDER-AND-DREAD-DESIGN.md` for the durable creative and future ecology contract.

**Implemented authored slice:** Four optional in-world discoveries were added to the existing location-specific scenario: rainforest vistas from the control room; awe at the lobby's vast skeletal natural history; the living fern/epiphyte ecology along the jungle path; and a distant herbivore vista from the helipad. The latter is explicitly ambient, **not** an added position-bearing combatant. `partyStep` handles a voluntary `wonder`/admire/take-in action outside combat. It saves a personal, persistent journal and an actor-scoped wonder event while leaving beat, dice seed, dinosaur movement, stress, medical clocks, inventory and flags unchanged. Duplicate discoveries and remote observations are rejected. Older party v3 saves without the optional journal remain valid. The Party browser presents a quiet-scene button and personal memories.

**Validation:** Ten new `tests/wonder-and-dread.test.mjs` cases cover original natural history, scenic wildlife boundaries, no time/RNG/world mutation, per-actor private journal, save/load compatibility, noncombat safety, actor incapacitation, parser and UI. Total target **290 automated cases**; final CI verifies accepted count.

**Release safety:** 007-K remains the accepted mechanical checkpoint; this is a small thematic/content pass, not an unvalidated new mechanical checkpoint. Browser script/module/CSS query revision `007kw` prevents stale version display. The isolated solo game and manually deployed Cloudflare Worker are unchanged. The User's private Evolved rulebook is not committed or copied.

**Next:** Implement meaningful *persistent* herbivore ecology and wonder-aware companion/director behaviors, with full actor-specific sight and memory; keep the 007-L spatial/predator development track intact. Peaceful animals must never become arbitrary combat hazards merely to produce tension. Manual graphical gameplay QA remains outstanding.


## Checkpoint 007-K — Active survivor lighting, timed dinosaur searches and group movement — 2026-10-23

**Recovery and authority:** Inspected authoritative GitHub `main` at accepted commit `3e8c9f5ed3728d94df6db3492b95fc0c59593775` (007-J, v0.7.9; 257 passing Node tests; successful GitHub Actions and earlier Pages deployment). No newer accepted work existed. Retained the primary *Alien RPG — Evolved Edition* private-source hierarchy: time, stealth, hiding, darkness and searching from printed pp. 54–58, movement/quick-full action budgets pp. 59–67, with an explicit Jurassic-original battery model, light-visible predator search heuristics and sound levels. Did **not** commit or reproduce any private rulebook contents.

**Playable 007-K:** Authored `src/dinosaur-pursuit.mjs` actor-owned light detection and physically adjacent visible-lamp source; integrated `src/party-engine.mjs` individual on/off action, finite 12-stretch charge depleted at true exploration-stretch boundaries, private predator clue and timed one-stretch active search (real seeded observation even in an empty zone), search interruption, loss of source interest, alert decay, legal room routing, scene-filtered darkness and per-actor group plans. `src/evolved-encounters.mjs` now negates darkness only for that actor's switched-on working lamp. Added normal/quiet/noisy movement choices, leader-initiated formation travel with **no free teammate movement**, and quick/full costs in `src/combat-turns.mjs`. `src/party-director.mjs` bounded AI reads only the actor-specific current light state and locally announced plan, spending a real turn to illuminate or follow, so Character/Spectator use the same legal engine calls as Party. The browser `party.html` and `src/party-app.mjs` now offer lamp toggles, battery readout, quiet/rush/formation controls with consistent 007k cache revision.

**Validation:** Retained all **257 earlier tests**, updated versioned UI assertions, and added **23 deterministic tests** in `tests/dinosaur-lighting-007k.test.mjs`. Tests cover new versus legacy carried lamps, personal darkness and equipment variants, battery timer and failure, legal/illegal and blocked visual routes, private dinosaur search state, seeded empty/occupied-zone searches, interruptible pursuit, fading alerts, valid/invalid group routing, individual sound and skill rolls, spectator following, save/reload and mode/camera stability, privacy of dark-zone sightings and old UI/Worker isolation. **280/280 Node tests passed and syntax checks succeeded** in [GitHub Actions run 39907713408](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/39907713408) at candidate commit `f3e26be41c683cdf721fbd845345ad8c521f3037`. Merge/head CI and GitHub Pages are separate final checks. GitHub Pages deployment and manual interactive browser QA remain separate verification gates; do not describe unperformed browser playtesting as passed.

**Compatibility:** Party save remains kind `dinosaur-party-incident`, schema **v3**, and retains v2→v3 migration. New optional `actor.light`, `state.groupTravel`, and dinosaur `search`, `searchHistory`, `lastClue` fields are validated, serialized and replayable. Older v3 actors without light metadata keep accepted 007-J auto-illumination until toggled. Medical timing, critical wounds, initial roster, control modes, defensive interrupts, initiative and actor-private events remain. The 006.2 solo prototype, `src/engine.mjs`, `worker/index.mjs`, and manually deployed Cloudflare Worker v006 were not modified; no redeployment required.

**Limitations:** Abstract seven-zone map has no directed flashlight beams, continuous vision cones, realistic obstruction, wind/scent, species-specific active search or attack tables, replacement batteries, simultaneous group movement/consent UI, or unbounded conversational adjudication. The exact **12-stretch** battery capacity, source-zone light attraction, and volume tiers are documented Jurassic house rules, not claimed as Evolved RAW. Graphical smoke-testing in Party/Character/Spectator, mobile/desktop, active search save/reload, lighting and physical pursuit remains an outstanding manual acceptance task. See [the 007-K rules-fidelity report](docs/DINOSAUR-LIGHT-STEALTH-007K.md).

**Recommended next milestone:** **007-L** — species-specific sensory models and behavioral tactics, sightlines and cover occlusion, resource pickups/recharging, and believable park survival consequences, with the existing deterministic engine and save contract preserved.

## Checkpoint 007-J — Map-constrained predator pursuit, sound and stealth travel — 2026-10-23

**Recovery first:** Inspected current GitHub main at commit `e5dcd0f34d9163ed9479a8bba6a614899c4c048d`. That state already contained a validated **007-I** defense-choice and group-stealth implementation (**241/241 tests**, successful GitHub Pages deployment). Continued forward without replaying 007-I or disturbing its authoritative defense/reaction, wound, surprise and party save logic. Consulted the privately supplied *Alien RPG — Evolved Edition* stealth sections on printed pp. 55–58. Sound reach, reinforced barriers and Jurassic animal pursuit are deliberately original zone-level extensions, not claimed as verbatim source rules.

**New gameplay and files:** Added `src/dinosaur-pursuit.mjs` with graph-validated velociraptor exits, shortest-route source pursuit, locked staff door blocking, door-attenuated sound range and authored lighting states. Integrated hearing/alert and last-noise memory into `src/party-engine.mjs` instead of omniscient pursuit. When the animal moves one real zone near a survivor, that survivor hears a private unlocated footstep warning. Ordinary player travel remains available; **sneak/creep/move silently** is now a bounded Mobility skill action, zero noise on success and audibly failed on a miss, preserving concealment only if it was earned and the destination has cover. `src/combat-turns.mjs` assigns quiet movement a full action. `src/evolved-encounters.mjs` incorporates -2 human group Observation dice in dark outdoor zones, canceled by each actor's own light but not by a companion's light. Creature dice remain unchanged. `src/party-director.mjs` chooses quieter approaches across exposed outdoor paths without consulting hidden dinosaur coordinates. `party.html` and `src/party-app.mjs` add Sneak to choices, local lighting and client revision 007j.

**Validation:** New `tests/dinosaur-pursuit.test.mjs` contains **16 tests** for legal animal graph movements, unbreached/barrier-open paths, muffled sound, character-specific darkness, actor-local warnings, valid/invalid quiet travel, Mobility-based success/failure, seeded state compatibility and spectator stepping. Existing **241 tests** retained, making **257** total. Implementation CI recorded **257/257 pass, 0 failures** on GitHub Actions; latest docs/audit HEAD requires the final verification. No manual graphical browser testing claimed.

**Compatibility:** Party saves remain version 3; the optional `lastHeardBeat` is backward compatible. The old 007-C party migration, manual/generated Character Lab, three control modes, explicit pending defense reactions, actor-owned medical intervals, surprise and initiative holds remain unchanged. No modifications to original 006.2 solo engine/save or Cloudflare Worker. No Worker redeployment is necessary.

**Boundaries:** The reinforced door is not magically breached by animals; a future authored action must do so explicitly. Carried flashlights are assumed available; on/off illumination, batteries, changing sightlines, wind/scent, an exact stealth stretch scheduler and species-specific signature attacks are still unimplemented. This checkpoint is a bounded park-zone hearing/pursuit simulation, not full Evolved RAW or the ultimate freeform AI GM.

**Next:** 007-K should implement controllable lighting and exact-time stealth searches, then expand dinosaur ecology, pursuit and hazards, with full deterministic regression coverage.


## Checkpoint 007-I — Player-Chosen Close Defense and Group Stealth — 2026-10-22

**Recovery:** Inspected authoritative `Diabolicdonut/Dinosaur-Horror-RPG` `main` at accepted 007-H `4102352974bfb7110cc577051d97e5f19278856a`, then source combat engine, director, browser UI, tests and project state. Used the user's private *Alien RPG — Evolved Edition* for stealth (printed pp. 55–58), melee defend (p. 62) and ranged dodge distinction (p. 65). No private pages or copyrighted published creature tables entered GitHub.

**World mechanics:** `src/party-engine.mjs` permits the scheduled velociraptor to select an actually colocated victim **before** the strike roll, then persist a validated `combat.pendingReaction` until the defender acts. On human-owned victim initiative interruptions, the player chooses **Defend** (one quick action; opposed CLOSE COMBAT cancels attacker successes) or **Do not defend** (save action budget). Neither option can alter a previously rolled strike: the target selection is saved independently of the attack die roll. Ambushes and exhausted quick budgets never offer an illegal reaction. The pending state validates its round/card/beat/actor, survives save/reload and keeps one creature action rather than inventing free predator strikes.

**Control modes:** `src/party-director.mjs` routes response ownership to the actual targeted survivor. Party and human-focused Character mode require human choice, while AI-owned companions in Character/Spectator make a deterministic close-combat defense if legal. Mid-reaction mode switch changes future control but does not reroll target or reset state; the Follow camera shifts to the endangered survivor. Existing direct engine callers retain their previous prepared Mobility-dodge fallback when not opting into player-reaction mode, preserving prior accepted deterministic test contracts; **the playable app uses explicit Close Combat response rules**.

**Stealth:** New `detectGroupCreature` in `src/evolved-encounters.mjs` makes each present survivor roll passive OBSERVATION, using only the highest result in the group against one creature pool; a guard's +2 applies to their own roll. A zone's active hidden search makes a single OBSERVATION roll, revealing no more than one hidden survivor per success. It does not expose remote actors or grant a detection roll just for entering concealment. Shared dinosaur world remains single and map-constrained, with individual knowledge and stealth state.

**Browser:** Added `#reaction-panel` with human **Defend / Do not defend** before-roll buttons, target label, safe command lock and status, integrated `007i` versioned HTML/JS/styles and matching nested imports. Original Character Lab launches Checkpoint 007-I. The original solo 006.2 engine/save and Cloudflare Worker v006 are untouched and require no redeployment.

**Validation:** `tests/defensive-reactions.test.mjs` adds **13** cases for declare-first timing, selected defense/decline, quick-payment, false-responder rejection, ambush and exhaustion, Focus/Spectator takeover, AI policy, deterministic saved response and UI contract. `tests/grouped-stealth.test.mjs` adds **7** cases for best-of-group detection, passive rolls without stress/pushing, guarded bonuses, proper search-success reveals and seeded live scene fidelity. These augment the previous **221** to **241 Node tests**. During verification, one new passive-dice regression initially asserted a numeric count where the resolver returns an empty push event array; this was corrected. The implementation has subsequently passed the full 241-test CI on main.

**Limits:** This is still **not** complete Evolved RAW: explicit ranged dodge interaction, more complicated defensive special attacks, source-exact lighting/crawlspaces, party movement modes and creature signature attacks remain incomplete. The game uses a current room-based map and deterministic offline AI; no manual graphical browser smoke testing has been performed in this session. Source-parity and save handling are recorded in `docs/DEFENSE-STEALTH-007I.md`.

**Next checkpoint:** 007-J detailed park stealth pursuit/encounter timer, coordinated party movement, environmental sight/noise and species-specific behavior, without destabilizing the legacy 006.2 game or existing Party/Character/Spectator saved incident.


## Checkpoint 007-H — Surprise, ambush, held initiative, survivor-turn death rolls — 2026-10-22

**Recovery:** Inspected authoritative GitHub `main` at the accepted 007-G commit `e3cb7a2ea12a98fbc43846b3cb3d2343ab7ed58a`; confirmed existing 209-test injury/clinical release, its successful GitHub Actions and GitHub Pages deployment. Grounded new procedures in the privately supplied *Alien RPG — Evolved Edition* printed pp. 59–61 (surprise, ambush, holding off) and p. 68 (round-lethal death checks). No private rulebook contents, files or illustrations published.

**Mechanics implemented:** `src/evolved-encounters.mjs` allocates the first numbered cards to valid surprising attackers before seeded unique-card draws. `src/combat-turns.mjs` validates source-style **holding off** only with an unplayed, later initiative card: swaps the two combatant identities while preserving the card numbers, existing action budgets and already committed records; adds a capped hold journal. Ambush applies +2 dice only to an initial strike, with defense/dodge forbidden for its surprised target, and records one-time surprise consumption. `src/party-engine.mjs` permits a concealed person to ambush a colocated unaware velociraptor; a predator that observes exposed survivors first can take card #1 for its opening ambush. The incident logs all card changes and initial attack modifiers.

**Corrected medical timing:** A live character turn now ends with that specific survivor's round-lethal STAMINA check, not an unrelated round-boundary medical tick. `src/combat-turns.mjs` calls the existing no-stress, unpushable `deathRoll` after the active actor's action budget is exhausted or the turn is ended, records seeded check details, and honors a delayed turn after holding initiative. `src/evolved-injuries.mjs` allows the combat-wide medical clock to defer `round` interval checks so they aren't duplicated; stretches/shifts continue as earlier. Broken-but-living survivors retain initiative opportunities for medical timing.

**Browser and autonomy:** `party.html` and `src/party-app.mjs` now show a pending ambush and **Hold for [Combatant] (#Card)** options generated from the unplayed cards, plus parser support for `hold off to card N`. Client revisions updated to `007h`. Actor decision ownership is unchanged across Party, Character and Spectator; camera switches do not spend RNG/time. `characters.html` launches 007-H.

**Validation:** Added 12 deterministic `tests/initiative-hold-ambush.test.mjs` tests for surprise priority and uniqueness, actual predator and human ambush bonuses/dodge restriction, card swapping without time/RNG/budget cost, invalid holds, deferred actor death rolls, prevention of duplicate roll at next completed round, spectator continuation and compatible command parsing. Retains 209 existing tests, for **221 total**. Encounter, medical and browser contract tests are all included in GitHub Actions; final HEAD CI and Pages acceptance must be checked.

**Compatibility and fidelity gaps:** Uses optional `combat.surprise`, `combat.holds`, `medicalChecks` and wound metadata in existing party v3 saves. Prior party v2 migration, current party world/AI, old singleton 006.2 save and the Cloudflare Worker are untouched. The game still uses prepared automatic defense instead of explicit out-of-turn player confirmation and doesn't implement the full multi-attacker ambush/dialogue, range nuance or all infection/mental trauma effects. See `docs/SURPRISE-INITIATIVE-007H.md`. Browser graphical smoke not claimed.

**Next:** Player-authorized active reaction to an imminent raptor attack, multi-attacker stealth positioning and remaining Evolved injury/clinical consequences with stable saved world boundaries.


## Checkpoint 007-G — D66 critical injury and medical time — 2026-10-22

**Recovered authority:** Current GitHub main at 007-F `6abc30e4dbe82356490782805fbbd3b7257e8e3b`; user-private Evolved Edition printed pp. 68–71 for breaking, D66 critical injuries, death checks, stabilization, surgery and wound healing, and p. 55 for round/stretch/shift durations. No proprietary rulebook PDF or long text reproduced in public files.

**Implementation:** Added `src/evolved-injuries.mjs` with all 36 source-inspired D66 injury codes, original short Jurassic survival condition labels, numeric penalties, movement/arm constraints, lethal survival intervals, deterministic no-stress/no-push Stamina checks, three-success stabilization, exact procedural separation of First Aid / COMMAND Rally / shift Surgery, and D6-based injury healing. Safe recovery uses elapsed stretches, while Recovery Care doubles time spent attended. Full death/medical consequences are actor-owned persistent events, not AI narration.

**Live world changes:** `src/party-engine.mjs` now enriches genuinely sustained wounds, applies skill and movement penalties, updates medical clocks on world time advancement, emits death/healing events, handles bleeding-caused additional critical wounds and supports `aid pc-X`, `rally pc-X`, `surgery pc-X` and `rest`. In `src/combat-turns.mjs`, Rally consumes a quick action, while lower-limb injuries convert movement to a full action. Human and AI actors use one authoritative resolver. `src/party-director.mjs` allows locally aware medics to treat a nonbroken lethal casualty and safely qualified colleagues to rally; it never grants knowledge of a remote dinosaur or patient. The 007-G client displays injury labels, unstable intervals and treatment actions.

**Automated QA:** `tests/evolved-injuries.test.mjs` adds **25** focused tests checking every D66 code, penalties, 10s/10m/6h timers, Stamina-only death rolls, stabilization after three successes, First Aid (including ambulatory lethal casualties), worsening failure deadlines, COMMAND rally non-stabilization, medical gear Surgery, long healing and Recovery Care, historical-save compatibility, live skill modifiers, movement cost changes, injury-induced secondary bleeding and companion decision boundaries. Together with the 184 previously accepted regressions, expected **209** automated checks. Final GitHub CI is authoritative. Prior CI also caught a stale 007-F cache revision assertion after the browser app was updated; the assertions were versioned to 007g.

**Safety/isolation:** Same isolated party schema v3 and legacy `dinosaur-party-incident-007c` save key. Only optional injury metadata is lazily added; no migration of unrelated 006.2 singleton saves. No Cloudflare Worker source, keys or config were touched.

**Source fidelity boundaries:** Time intervals follow 10-second rounds, 10-minute stretches and six-hour shifts within Evolved's ranges. The *round-level* death-check scheduler currently checks at completed round boundaries, not strictly after the affected actor's own turn as the book states. Condition #43 is not mapped to a full mental disorder because the source explicitly calls for group consent; infection/sickness #46, prosthetics, and long-term complication subtleties are not yet finished. First aid uses the existing room/zone resolution rather than a more granular Adjacent position, and +1 for park medical equipment is a transparent local modifier. See `docs/CRITICAL-INJURIES-007G.md` for exact details.

**Next gate:** End-to-end live-browser medical QA, then deeper Evolved death timing, infectious conditions and optional mental trauma, plus surprise/ambush, advanced defensive interrupts and species-specific threats.


## Checkpoint 007-F — Live initiative and action economy — 2026-10-22

**Recovery:** Inspected current main at accepted 007-E commit `ef5a134aa0513546c7946686d9405da6ab6751d8`, the authoritative party engine/director, character and encounter modules, controls, action tests and source scenario. Rules mapped to user's private *Alien RPG — Evolved Edition*, printed combat/initiative pp. 59–61 and supporting combat/damage pp. 62–71. No copyrighted rulebook tables, prose or art copied into public code.

**Implemented:** `src/combat-turns.mjs` now schedules seeded unique 1–10 initiative cards for local exposed survivors and two Velociraptor Speed turns per round, redrawing cards after each completed round. Actor turns enforce full+quick (either order) or two quick actions; unsupported excess actions are rejected without time, inventory, skill rolls or RNG changes. `end` yields unused budget. Prepared defenses spend quick capacity before the actual seeded dinosaur attack; no free automatic dodge. All accepted card actions, including predator attacks, append to the same authoritative world ledger.

**World integration:** `src/party-engine.mjs` transitions from exploration into a real combat phase upon observable dinosaur contact; delayed dinosaur attacks occur on its drawn initiative, not arbitrary exploration adjacency ticks. Combat ends on creature defeat or absence of local exposed opponents. `src/party-director.mjs` treats dinosaur slots as AI-owned irrespective of Party/Focus/Spectator and preserves single-action spectator stepping and pause behavior. Browser `party.html` exposes active card, round, action budget, End Combat Turn and elapsed combat time; client/style cache revised to 007f.

**Separate clocks:** New optional `clock` tracks exploration actions/stretches apart from completed combat rounds/seconds. Previous v3 party saves without combat/clock remain accepted; earlier v2→v3 migration is unchanged. No legacy solo 006.2 save, `src/engine.mjs`, Worker credential or Cloudflare Worker source modified.

**Validation:** Added `tests/combat-turns.test.mjs` (**17 tests**) for initiative uniqueness/order, double-speed monster turns, legal and illegal action combinations, seeded reproducibility, actor-source authorization, reserved dodge expenditure, mid-combat mode switches, deterministic spectator stepping, malformed saved budgets and old-save/time compatibility. Existing 167 tests retained. Target/final total **184**. GitHub CI has reported pass on implementation and README commits; the audit/controller HEAD still needs its workflow acceptance.

**Known fidelity gaps:** Initiative holding/trading and ambush first-card priority, human-confirmed out-of-turn defense selection, source-exact ranged cover/ammo and many full combat creature options are not yet implemented. Critical injury and death-roll timing remain the prior 007-E limited adaptation, not full Evolved RAW. See `docs/COMBAT-INITIATIVE-007F.md` for fidelity matrix and future tasks. Graphical manual browser smoke has not been claimed.

**Next milestone:** 007-G source-specific critical injuries and death/medical clocks, then surprise/ambush and deliberate interrupts while keeping mode switching, RNG and all existing saves stable.


## Checkpoint 007-E — Dinosaur survival encounter alpha — 2026-10-22

**Authority:** User-private Alien RPG Evolved Edition, printed pp. 54–73 for time, stealth, initiative, actions, armor, damage, injury and panic. Public code uses original procedures and original park content, not reproduced rulebook pages.

**Implemented:** `src/evolved-encounters.mjs` adds seeded source-based initiative and quick/full action budgets, passive creature detection, armor/damage, D66 critical injury classification, panic and medical aid. `src/party-engine.mjs` integrates physical dinosaur attacks, death/incapacitation, cover searches, wounds, panic events, trained treatment and dinosaur defeat in the shared island. `src/party-director.mjs` grants AI companions only their actual local knowledge and equipment. Party, Character and Spectator all use the same consequences. `party.html` and `src/party-app.mjs` expose new survival controls with revision 007e.

**Validation:** Added twelve standalone encounter tests and twelve integrated party-survival tests, preserving 143 earlier tests (**167 total**). Prior guaranteed-rescue spectator fixture is now a no-predator objective test: actual dinosaur-horror runs are allowed to be fatal. No manual browser verification is claimed.

**Known source gaps:** Drawn initiative and quick/full action budgets are tested independently but **not yet enforced by the current round-robin party scheduler**. Attacks per roster cycle, simplified D66 effects/death timers, and partial panic responses are documented house-rule/prototype limits, **not complete Evolved RAW**. See `docs/SURVIVAL-ENCOUNTERS-007E.md`.

**Compatibility:** Earlier party saves remain accepted, original 006.2 solo game and Cloudflare Worker unchanged; frontend-only Pages build.


## Checkpoint 007-D — Three dynamic control modes and grounded spectator AI — 2026-10-22

**Recovery source:** GitHub `main` checkpoint 007-C `e0a80cc56882f7630f11f9a3d74b637fb4d6870d`. Existing party engine, Character Lab, Evolved checks and source scenario were inspected. Strict Dinosaur Horror repository isolation observed.

**Implemented production code:**
- `src/party-engine.mjs` v3 adds authoritative player/AI action ownership, actor-scoped visited/attempted memory, persistent control settings and journals. Existing party v2 saves are explicitly validated and upgraded without losing RNG, actions, item ownership, character status or dinosaur state; **old solo 006.2 saves and engine are untouched**.
- `src/party-director.mjs` adds **Party, Focus/Character and Spectator**, a selectable human character, independently selected follow-turn or fixed camera, non-temporal atomic switching, bounded actor-local observations, deterministic offline AI companion action proposals, journaled decisions, and stale-epoch/beat rejection.
- `party.html`, `src/party-app.mjs` and CSS implement runtime mode selection, actor takeover, camera controls, Pause/Step/Resume, 400/800/1200/2000ms display pacing, saved control state, automatic pause on hidden tab/reload, and compatibility with validated Character Lab roster launches. Character Lab now labels the launch **Dynamic Party 007-D**.
- **Autonomy without omniscience:** AI director receives a restricted per-survivor view (own career, inventory, visits, personal attempted clues, local rooms/items, visible dinosaur and nearby allies, abstract shared mission milestones), *not* true dinosaur coordinates or other actors' private knowledge. Only deterministic `partyStep` approves and commits skill checks and outcomes. AI proposal, goal and commit index are logged for replay.
- **Same survival rules regardless of controller:** manual and AI resolve identical seeded Evolved-style d6 checks and shared time. Switching agency/camera does not advance world time, mutate RNG or reroll consequences. Pause blocks automatic action; Step commits exactly one AI-controlled actor action.

**Regression coverage:** Added `tests/party-director.test.mjs` (**24 tests**) for mode ownership, focus takeover, non-temporal switches, camera independence, pause/step, expected-epoch stale guards, seed/replay determinism, AI actor knowledge isolation, version 2-to-3 save migration, malformed control/save rejection, and live UI contract/syntax. Retained **119 earlier tests**, yielding **143 total**. A 400-beat bounded spectator integration test demonstrates successful physical keycard collection, genuine generator power restoration, distress radio operation, and beacon rescue conclusion using the same legal world engine. Legacy browser contract test was updated for new revision.

**CI recovery:** Initial commits changed the live 007-C page/version before updating the page-specific regression assertion, causing GitHub CI failure. Updated the assertion to the 007-D URL/header. New tests and the extended 400-action spectator objective acceptance now pass in GitHub CI. The final checkpoint controller/audit commit still requires its own workflow verification.

**Unfinished mechanics / disclosures:** Companion behavior is a **bounded deterministic offline decision policy**, not Sol/LLM-driven general improvisation or freeform conversation. Character relationships and agendas are still rudimentary. The shared party action clock is a simplified round robin, NOT full Alien Evolved quick/full combat action economy. Predator encounters currently increase stress; severe injuries, armor, death, pursuit, full panic action effects and most world-dependent talents are deferred. This checkpoint does not claim full Evolved RAW fidelity.

**Files/authority:** See `docs/CONTROL-MODES-007D.md` for precise behavior, control boundaries and QA, plus the accepted baseline `docs/MULTI-CHARACTER-CONTROL-MODES.md`. No private copyrighted source PDFs were distributed.

**Deployment:** Frontend and local game modules only, no Cloudflare Worker changes or manual repaste needed. GitHub Pages deployment and interactive browser smoke remain distinct validation gates.

**Next:** Start 007-E source-faithful Evolved action economy and dinosaur perception/combat, preserving these dynamic controls and versioned migration checks.


## Checkpoint 007-C — Playable multi-character Party Incident (alpha) — 2026-10-22

**Recovery:** Inspected authoritative GitHub `main` at prior accepted checkpoint 007-B (`2dbbe50b75b86c72d1e24156ed58c1f40aa2bcb6`), source `src/scenario.mjs`, original `src/engine.mjs`, Evolved check/character code, current project controller, user-approved control mode and generation contracts. Preserved the legacy 006.2 incident source and Cloudflare Worker unchanged.

**New mechanics code:** `src/party-engine.mjs` implements a separately versioned game state containing an Evolved-valid roster (1–8 independent actors); stable IDs, physical locations, distinct skills/talents/stress/inventory/observations; room item persistence; existing scenario objectives and dinosaur; authenticated actor-ID action ownership; one round-robin roster scheduler and shared action-beat clock; staff-card door restriction; legal movement, item pick-up/transfer, concealment, authored-detail investigation, generator/radio/beacon repair, and waiting. All skill checks call existing `resolveSkillCheck` with the actual acting survivor's seeded values. Failed attempts spend time where appropriate but do not silently consume props. Unsupported/objectless actions fail without RNG or time cost. Part of the existing `src/scenario.mjs` authoritative world is reused; no duplicate map.

**New UI:** `party.html`, `src/party-app.mjs`, `src/party.css`: readable multi-survivor roster and acting-actor highlight; single-actor camera selection independent of turn ownership; exits, affordance-dependent objective controls, bounded natural-language orders, optional push and debug dice, personal event journal, independent Save/Load/Export and objective status. `characters.html` adds **Launch Party Incident 007-C**; Character Lab transfers **only validated** rosters using distinct session storage. A direct visit to party page can load a valid latest lab draft or seed-generate a default party.

**Creature knowledge:** One persistent dinosaur traverses connected exits in a deterministic interim hearing/patrol model; proximity increases exposed characters' stress but **combat/damage/death are intentionally not invented**. World includes hidden predator state, while scene projections show it only when in a relevant actor's room. Personal event projection excludes other actors' private investigations. Individual per-actor knowledge is not automatically shared.

**Save policy:** New schema `kind=dinosaur-party-incident`, `version=2` and browser key `dinosaur-party-incident-007c`. Old checkpoint 006.2 solo key, saves, engine, Worker v006 and API keys remain untouched. Explicit old-solo-to-party save migration is postponed, not claimed.

**Tests:** Added `tests/party-engine.test.mjs` with **19 checks** covering legal roster and independent actor stats, turn ordering and shared time, action authorization, inventory and card hand-off, room restrictions, authored investigation, seeded replay, filtered knowledge, independent saves, unsupported target failure, and syntax/browser transfer contract. All prior suites remain. Target/current total **119 tests**. Github workflow must confirm the final controller/audit commit before calling the checkpoint validated.

**Limitations:** Only human-managed Party mode operates in 007-C. Focus, autonomous companions, full spectator play, exact Evolved combat timing and initiative, critical injuries, real dinosaur attacks, complete world-targeted talents, and unbounded AI referee are not yet implemented. A simplified action-beat exploration counter must not be mistaken for full Evolved RAW encounter time.

**Launch/restart hardening:** A deliberate new Character Lab launch now takes precedence over an older Party Incident autosave and consumes its one-time session handoff; ordinary reloads restore the current party. The save retains a separate validated original roster so Restart recreates exactly the intended party, not a post-injury or newly edited draft. Added an independent validator test for tampered starting rosters (bringing tests to 119).

**Next:** Browser smoke test the party launch and objective path, then implement one general actor scheduler with user/AI decision ownership, safe mode switches, knowledge-bounded autonomous companions and spectator pause/step. Preserve the option to revert to the old solo page. The full boundaries are recorded at `docs/PARTY-INCIDENT-007C.md`.


## Checkpoint 007-B — Independent Evolved d6, Resolve and talent rules sandbox — 2026-10-22

**Recovery and source:** Inspected GitHub main checkpoint 007-A (`669b09b1ea7a61089523f1f3b58aedfb9322009f`) and the user-supplied private *Alien RPG — Evolved Edition*, chapter 3 skills pp. 42–44 and talents pp. 48–51, and stress/panic pp. 72–73. This milestone implements mechanical rules, not copyrighted text.

**Implemented:**
- `src/evolved-checks.mjs`: Deterministic seeded d6 stream; attribute + skill base dice; stress dice; individual faces and successes; success quality; modifiers and assistance; active/passive checks; pushing with locked successes, appropriate extra stress dice and no-push conditions; Resolve stress response and lasting effects; repeat response stress; separate panic classification; actor-specific opposed tests; earned cinematic story-point conversion of one die to a six; no direct mutations.
- Source-mapped Jurassic Park talent hooks for existing character careers: bonuses to active investigation, grappling, dodging, first aid, surgery, rally and vehicle maneuvers; appropriate skill/attribute substitutions; context-specific second pushes; voluntary extra stress; omission of stress dice without erasing effective stress level; Strength damage resistance check; group safe-rest stress recovery; preliminary action-cost, nursing and ammunition hooks. All 27 selected talent identities have a documented mechanic contract, but **many world-dependent talents are not yet mechanically complete**.
- `characters.html`, `src/characters-app.mjs` and CSS: isolated **Field Assessment / Hidden Dice** check sandbox, letting player test a validated survivor with skill, situation, stress, signed modifiers, push count and seed; dice remain concealed by default but optional debug reveals exact rolls and stress results.
- `tests/evolved-checks.test.mjs`: reproducibility, push limits, stress die ones, response restrictions, passive checks, attribute switching, talent scopes, optional story point, recovery, damage resistance, opposed comparisons and no hidden game-state mutations. `tests/characters.test.mjs` updated for UI version and controls.
- `docs/EVOLVED-DICE-TALENT-STATUS.md`: detailed matrix differentiating implemented numeric hooks from pending world-state procedures.

**Failure and recovery during CI:** An added group recovery test incorrectly used the randomly generated tactical character's starting talent rather than equipping the named stress-recovery talent. GitHub CI caught the expectation mismatch (expected 1 stress, got 2). Fixed test fixture to explicitly equip `Steady Under Fire` at commit `761c921a`. Subsequent validation at commits `793ccfd8` and `761c921a` succeeded, and the full test count reaches **100** at the current checkpoint.

**Non-goals / safety boundary:** This standalone rules lab does not touch `src/engine.mjs` or the Cloudflare Worker v006, does not start incidents with generated parties, and does not enact dangerous world consequences for unvalidated AI plans. Panic's specific movement/turn loss, injuries, supplies, equipment creation, action scheduling, and all remaining talent effects require future source-faithful world integration. No Cloudflare repaste needed; no real manual browser smoke claimed.

**Next implementation gate:** persistent multiple human actors, one authoritative Evolved decision scheduler and save migration, then connect the validated party generator to new incidents. Introduce full-world context approval and accurate mechanical talent effects when their prerequisites actually exist.


## Checkpoint 007-A — Usable character-generation vertical slice — 2026-10-22

**Source verified:** Privately uploaded *Alien RPG — Evolved Edition*, Core Concepts pp. 25–27 and careers pp. 31–39, plus project controller and prior accepted mode/generator contracts.

**Production code committed:** `src/characters.mjs` provides nine original Jurassic Park careers mapped to Evolved's key attributes and three key skills; all twelve skill categories; core 14-point attribute budget, 10-point skill budget, career starting caps, one career talent selection, two original starting items, calculated Health and Resolve, stable actor IDs, seeded per-slot generation, independent revision streams, individual field locks, manual editing, and common validation. Character generator does not consume the gameplay engine's random stream.

**User-accessible browser preview:** `characters.html`, `src/characters-app.mjs`, `src/characters.css` provide a responsive roster editor for 1–8 characters. Player can auto-generate entire party, manually edit each value, switch careers, lock individual attributes/skills and other fields, regenerate unlocked parts, review errors, save draft separately in localStorage, and export a validated JSON party. Home `index.html` now links to the Personnel Registry.

**Source and fidelity ledger:** `docs/EVOLVED-CHARACTER-MATRIX.md` records rulebook references, exact portions covered, original park-theme substitutions, and outstanding work. The lab uses standard legal allocation with an original *weighted seed generator* rather than Evolved's optional lifepath or roll-attribute creation procedures; themed talent names are placeholders whose mechanics are not yet active. This is candidly marked in the browser.

**Tests:** `tests/characters.test.mjs` adds 12 tests for nine career mappings, legal character generation across 120 seeds per career, budgets, conditional caps, derived stats, consistent seeded results, distinct IDs, lock preservation/conflicts, manual validation, source-isolated state, client contract and JavaScript syntax. Existing 65 automated tests retained, target **77 / 77**. GitHub Actions reports validation success at changes through `ba65e95`; final controller commit pending its own push check.

**Boundary:** The live incident still runs separate checkpoint 006.2 single-character engine, and the Worker remains v006. A roster exported by Character Lab is **not** a playable incident save; multi-character progression, Party/Focus/Spectator control, Evolved talents in action, active AI companions and dinosaur perception are pending. No Worker or original engine implementation files were changed. No Cloudflare redeployment needed.

**Next gate:** Implement faithful career talent effects, then actor-ID dice/actions and party save migration, and finally connect Character Lab-generated validated rosters to new incidents. Browser-specific manual QA of the new lab has not been performed; CI static/browser-file contracts and Node tests have passed.


## Mixed manual / automatic / hybrid character creation — 2026-10-22

**User decision:** Allow each playable character to be fully auto-generated, entirely custom-built, or a hybrid using locked/preferred components. The player may use this for **any or all** characters in a party, independently of three accepted Party/Focus/Spectator runtime control modes.

**Specification committed:** `docs/CHARACTER-GENERATION-MODES.md`, `docs/MULTI-CHARACTER-CONTROL-MODES.md`, `docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md`, project controller and README. Preserve career-specific Evolved Edition starting limits, all twelve skills, legal starting talent/gear, derived Health/Resolve and clear manual/automatic/hybrid validation. Generate setting-appropriate individual identity, background and agenda without arbitrary mechanical bonuses. Use separate seed for character generation; only unlocked/unfilled slots/fields regenerate. During live game, control changes never rewrite character statistics or remembered events; advancement replaces retcon.

**Implementation status:** This is a committed product design and Phase B implementation requirement, **not a deployed character creator**. No engine, save, web UI, AI Worker or mechanical validation test code changed. Current released 006.2 still controls one fixed player character and requires a future schema migration.

**Recommended implementation gate:** Finish Evolved character schema and validator, then support seeded manual, automatic and hybrid party setup before building AI companions or spectator simulations.


## Party / Focus / Spectator dynamic-control requirement — 2026-10-22

**New user-approved gameplay direction:** Three modes are switchable during the *same* continuous dinosaur incident: **PARTY** (human decisions for all playable human characters), **FOCUS** (human decisions for one active selected character, AI companions for the others), **SPECTATOR** (AI decisions for all, with pause, step and takeover). Separate decision **agency** from UI **viewpoint**; changing camera must not grant new world knowledge to characters.

**Architectural consequences:** The next implementation should create a first-class roster of separately initialized, Evolved-compliant careers, skills, talents, stress, inventory, injury, location, motives, knowledge and action points. One actor-ID-based deterministic scheduler must enforce Evolved timings in all modes, while actor-level AI proposals remain bounded and cannot directly modify dice or the world. Validated autonomous intentions must be journaled for repeatable replay. Mode switches apply at safe action boundaries without undoing committed state or spending turns twice. Spectator auto-advances only while actively running the simulation and stops on pause or user takeover.

**Development change:** Updated `docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md` to integrate multi-actor modeling in Phase B before autonomous companions, mode switching and full spectator simulation in Phase D. Added `docs/MULTI-CHARACTER-CONTROL-MODES.md`; updated `project-state.json` and README. This is an original Dinosaur Horror feature, not an attribution to Evolved RAW.

**Runtime status:** No game engine, browser client, Cloudflare Worker, existing save format or automated tests changed. This is a *design specification*, not a claim of implemented spectator controls. Continue to treat current checkpoint 006.2 implementation and its open user smoke-test gate honestly.


## New primary design acceptance — Faithful Evolved mechanics, hidden rolls, Jurassic Park theming — 2026-10-22

**User decision:** Retain *Alien RPG — Evolved Edition* mechanics as faithfully as possible (dice pools, twelve trained skills, careers, selectable talents, stress, Resolve, panic, pushes, combat, injuries, action timing, equipment). Re-theme setting, professions, talents, equipment and dinosaur threats for Jurassic Park. Retain the actual **seeded dice rolls behind the screen** and let players describe attempted actions freely, while the AI selects valid skill/attribute/talent adjudications without requiring players to speak in rules terms.

**Supersedes:** The earlier plan to replace all Evolved d6 pools with a bespoke numeric percent-outcome system before porting Evolved. Numeric probabilities may be calculated for testing, balancing or optional transparency but are *not* the authoritative resolution method for the initial faithful port.

**Source clarification:** Evolved Core Concepts p. 26 gives twelve independently usable skills, starting career-related skill caps (career up to 3; other skills up to 1), ten distributed skill points, one starting career talent, and untrained attempts. Career is a specialization, **not** a class-exclusive skill list.

**Public code/copyright boundary:** Reimplement mechanics in original code and original themed prose, without publishing the private PDF or reproducing long authored excerpts, scenario text, graphics or original tables. Record every deliberate house-rule departure separately and test it.

**Written and committed:** `docs/EVOLVED-RULES-AUTHORITY.md` revised to explicitly supersede the percent-first proposal; `docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md` added with phase gates, career analogues and skill/talent contracts; project controller and README updated.

**Release status:** Documentation only. No `src/engine.mjs`, `worker/index.mjs`, page scripts, save formats, or Cloudflare code changed in this pass. Current browser build 006.2 remains the limited Year Zero-inspired prototype and is NOT a complete Evolved conversion.

**Next implementation action:** Start Phase A source-to-engine rules inventory, then Phase B character careers/skills/talents and full Evolved dice/stress implementation with reproducible tests; only then retrofit natural-language translation and dinosaur creature ecology.


## Rules authority decision — 2026-10-22 (no runtime migration)

**User-directed decision:** Newly uploaded, privately held `Alien RPG - Evolved Edition.pdf` is primary rules authority for Dinosaur Horror RPG from this point forward. Previously used 2019 Alien RPG core and Year Zero Mini references become historical/secondary and supplemental respectively. Future approved, documented Dinosaur Horror mechanical deviations take precedence where deliberate.

**Source-grounded findings:** Evolved Core Concepts pp. 25–26 includes Strength/Agility/Wits/Empathy, twelve skills, Resolve and Health formulas. Using Skills p. 42 explicitly discourages unnecessary rolls and lets the GM require a check when stakes warrant it. Using Skills p. 43 explicitly allows nondefault attribute/skill pairings when the method supports them. P. 44 treats some passive checks secretly and separately from normal stress responses.

**Adopted interface doctrine:** Use player's natural-language intention and method, not a list of allowed verbs or exposed skill commands. GM interprets and recommends suitable attribute/skill combination, difficulty and time constraints. Engine checks physical feasibility against true state, rolls or samples seeded probability, and applies only validated persistent effects. Keep trained skill or expertise distinctions internally to preserve professions. Reusable engine effect primitives and action economy remain necessary and do not become visible player "commands".

**Implementation status:** Documentation/authority changes only. `src/engine.mjs`, `worker/index.mjs`, browser build 006.2, the prior user's saved game, and all existing tests are unchanged. Real-world free-form adjudication, Evolved stress/Resolve/Health procedures and computer-native outcome distributions are *planned*, not implemented. Do not falsely claim RAW parity. See `docs/EVOLVED-RULES-AUTHORITY.md` and updated `docs/RULES-BASELINE.md`.

**Next development gate:** Evolved mechanism inventory and design of typed natural-language method-to-action-effect adjudication with deterministic tests before any Worker/browser schema rollout.


## Checkpoint 006.2 — Old debug report reuploaded; browser asset freshness — 2026-10-21

**New user report:** "It's still not working." Uploaded `dinosaur-rpg-debug-turn-3-1792611940565(1).json`.

### Evidence / finding

- Full bytes of the new upload compared with prior `dinosaur-rpg-debug-turn-3-1792611940565.json`: **identical SHA-256 `f94dafc4ac0aca549cf9f2181445ba3ada261b344716062fdecb89d24e747f2a`** (54,872 bytes).
- Both reports generated at **2026-10-21T19:45:40.561Z** and identify browser build **006**, turn 3, with no new command history. They predate checkpoint 006.1 bug fixes. The second upload **cannot establish that the 006.1 repair failed** or that the latest scripts are being served to the browser.
- GitHub Actions `pages build and deployment` confirmed **success** at accepted 006.1 commit `a977b6f04457ebc51e60938f3a7dde0e9e4c2a60`. This demonstrates that 006.1 was published, but not which version the user's browser loaded. The Worker was independently verified in the previous report as version 006.

### Implemented

- HTML now references `src/app.mjs?v=006.2` and `src/style.css?v=006.2`.
- App imports of `engine.mjs`, `scenario.mjs`, `diagnostics.mjs`, plus engine's scenario import, use matching revision `?v=006.2` to avoid stale browser ESM module caches when HTML deploys.
- HTML shows a literal **BUILD 006.2 · LOADING** until the corresponding app script executes and sets **BUILD 006.2 · READY**; a mismatched or stuck marker diagnoses broken/stale app execution.
- New **GET LATEST GAME CODE** button navigates to a cache-busted query-string revision; it retains game saves and `GAME_TOKEN` in localStorage, does not reset incidents.
- Debug file names are prefixed with actual client version: `dinosaur-rpg-debug-build-006.2-turn-...`, preventing confusion with older versions.
- New browser UI contract test checks all versioned imports, build indicator, refresh control and non-clearing of saves. Expected **65 automated tests**.

### Next validation

Open `https://diabolicdonut.github.io/Dinosaur-Horror-RPG/?revision=006.2` and confirm the literal browser **BUILD 006.2 · READY**, not merely Cloudflare Worker 006. Only then retry hiding behind the rolling cabinet from turn-3 autosave. If broken, export a new **build-006.2** JSON, which will contain the actual post-fix action and save-repair diagnostics.

**No Cloudflare Worker code changes** in 006.1 or 006.2. Do not tell the player to repaste Worker 006.


## Checkpoint 006.1 — Live referee test and consistency repairs — 2026-10-21

**Evidence:** User exported `dinosaur-rpg-debug-turn-3-1792611940565.json` after playing in published GitHub Pages. Browser build `006`, Worker `006`, status `OPENAI RESPONDING`, token accepted, three successful Sol referee calls and three successful Sol narrator calls, no provider errors, turn 3, seed 1993. This is a genuine live integration test rather than only mocked tests.

### Verified action sequence
1. **Distract:** `paperweight → utility` at turn 1. Agility + Mobility, six dice `[6,3,4,3,3,5]`, one success; paperweight consumed. Live AI referee ~4.08s, narrator ~2.86s. Hidden raptor stayed unalerted; narration incorrectly implied a successful distraction of an animal without evidence.
2. **Barricade:** `rolling_cabinet → utility` at turn 2. Strength + Mobility, five dice `[2,1,3,4,4]`, zero successes. The engine correctly rejected the barricade but **incorrectly consumed the rolling cabinet despite failure**, leaving no cover and no working barrier. Referee ~2.76s, narrator ~2.96s.
3. **Conceal:** `behind rolling_cabinet` at turn 2. Sol correctly returned `clarify` given its filtered context showed no available cabinet. **Root cause was a state-model bug, not an AI hallucination:** the prior failed barricade erroneously removed the physical prop.
4. **Investigate:** `consoles` at turn 3. Wits + Observation, `[5,6,2,6,2]`, two successes, but result simply repeated the normal console description instead of addressing the stated question about tampering.

### Fixes in Checkpoint 006.1 (GitHub main)

- Failed barricades now spend time but **retain** the physical prop for cover/retry; successful barricades move the prop to an installed barrier that can still be used for cover, cannot barricade two exits, and has tracked durability.
- `repairLegacyBarricadeSave()` reconstructs incorrectly consumed cover from the immutable accepted-action history on autosave recovery and manual LOAD. The repair preserves turn, saved dice/RNG, player/dinosaur state and history; it does not roll again. It also restores installed cover metadata for successful legacy barricades when evidence remains in the journal.
- Distraction success now confirms a thrown object's placement and directional noise only, **not** that an unknown dinosaur actually reacted.
- A successful `consoles` investigation now supplies specific, evidence-limited information about tampering, without falsely concluding sabotage or introducing unsupported plot consequences.
- `tests/engine.test.mjs` adds five seed-specific and migration regression tests; total suite **64 tests**, with successful GitHub Actions validation after correcting one migration-wording test edge case.
- Client build label `006.1` makes the new UI code identifiable via **EXPORT DEBUG**. Existing `GAME_TOKEN` browser storage and saves remain supported.

### Deployment and next action

**Cloudflare Worker v006 is already live and correct. No Cloudflare code update is needed.** Changes are exclusively the GitHub Pages browser engine/scenario/client code. On site reload, the user’s existing turn-3 autosave will be repaired in place (if its journal matches the observed failed cabinet attempt) and show a recovery message. User should then retry hiding behind the cabinet and export another debug report if needed. The post-fix browser smoke test remains unverified.

**Next action:** `verify-v0061-autosave-recovery-and-concealment-in-browser`.


## Checkpoint 006 — 2026-10-21

**Objective:** Add the first actual AI Game Master **adjudication** pipeline, allowing improvised actions while retaining deterministic world authority. Recovery-first inspection confirmed `main` at accepted checkpoint 005 (`e43d5b7f666b6898483570c8006732f971e093a0`). No completed baseline or accepted rules were reset.

### Code changes

- **Authoritative environment data:** `src/scenario.mjs` contains 14 grounded scene props distributed across seven rooms. Each prop has an ID, label and allowed uses (`distract`, `barricade`, `cover`).
- **Engine:** `src/engine.mjs` provides `applyRefereeProposal`, with only four supported actions: `investigate` (Wits/Observation), `distract` (Agility/Mobility), `barricade` (Strength/Mobility), `conceal` (Agility/Mobility), plus rejection/`clarify`. All skill checks, resource consumption, noise-origin behavior, barriers, dinosaur motion, stress and turn advancement are resolved by seeded deterministic code.
- **Validation:** Action types, rule IDs, fields, target/source IDs, current turn/location, local prop abilities, exits and keycard protection are verified before any game-state mutation. Arbitrary extra proposal fields and hallucinated props are rejected. Historical accepted adjudication records are saved with dice outcomes, initial RNG and current state.
- **Compatibility:** Older v005 saved games without `improvisation` still load; first approved new action adds the persistent state. Old local commands and offline mode remain functional.
- **Worker:** Added `POST /v1/gm/adjudicate` with strict Structured Outputs schema. Sol medium reasoning selects one *proposed* action only; it does not roll or return world patches. `GET /v1/gm/status` reports **006** and `models.adjudicate`.
- **Browser:** Improvised commands route to new referee, or fall back to referee when Luna returns `clarify`. Ordinary supported commands remain local. UI exposes available props, records proposals/validation in existing diagnostics, and narrates committed outcomes. Stale Worker versions surface **UPDATE WORKER**.
- **Model policy:** `worker/wrangler.jsonc`, `docs/MODEL-ROUTING.md` and `docs/REFEREE-CONTRACT.md` record the new Sol role and scope.

### Testing and acceptance

- Extended the test suite from **38 to 58** automated checks (14 additional engine tests, 5 additional Worker mocks, 1 additional UI contract test). Existing tests remain preserved.
- Tests cover real die-roll dispatch, persistence/replay, older saves, no arbitrary AI patches, no nonexistent props, no remote teleportation, resource consumption, important item protection, barricade blocking, typed Sol response, auth and malformed proposal failure.
- GitHub Actions success on the updated code confirms Node syntax and mocked route contracts. **Cloudflare v006 has NOT yet been manually deployed or tested against the live OpenAI API.**
- We explicitly do not claim broad free-form rules adjudication, arbitrary item/world creation, multi-action sequences, actual model accuracy or full Alien RAW compliance. These are later milestones.

### Manual release gate

User must paste the entire updated `worker/index.mjs` into existing Cloudflare `dinosaur-rpg` Worker and **Deploy**. Existing `OPENAI_API_KEY` and `GAME_TOKEN` secrets remain sufficient. Test authenticated Worker status reports v006, then try distraction/cover/barricade/investigation through GitHub Pages. If behavior is unexpected, export full debug JSON.

**Next action:** `manual-cloudflare-v006-deploy-and-first-adjudication-smoke-test`.


## Checkpoint 005 — 2026-10-21

**Report:** User typed “Check outside the window” in the control room. Opening-room description repeated, no apparent response. User supplied a full redacted checkpoint 004 diagnostic file.

### Root cause proven by the diagnostic file

- Game was at seed 1993, turn 0, room `control`.
- Worker was **online and authenticated** (v004 status request HTTP 200); OpenAI was **actually responding**.
- Intent parsing HTTP 200 (~2255 ms): `{"action":"look","target":"window","push":false,"rule_id":"observation"}`.
- Engine emitted only `SCENARIO.rooms.control.description`, with `accepted:false`, unchanged turn/RNG.
- Browser narrator gated on `result.accepted` and therefore never attempted narration.
- Failure was an **unimplemented targeted observation and overly narrow narrative eligibility condition**, not an OpenAI/Cloudflare configuration problem.

### Changes

- `src/scenario.mjs`: authored location-specific static observations for each of the 7 rooms (rain-streaked control-room window, consoles, radio, reception, exhibits, maintenance door, generator, jungle, gate, beacon, etc.). No unseen predator positions or unsupported plot facts exposed.
- `src/engine.mjs`: support `look <target>` and close English variants without AI, resolve target against visible authored `observations`, suggest local inspectable targets on unknown requests, and return `narratable:true` for resolved free observations. **`accepted` remains false for free actions by design**; no time, dice, inventory, stress or dinosaur movement changes.
- `src/app.mjs`: send available inspection IDs to AI for intent resolution, display **INSPECT** quick actions, and trigger AI narration when either a time-consuming action was accepted or a free observation was resolved.
- `tests/engine.test.mjs`: four additional regression tests (exact AI window object, natural inspection phrases, no remote predator leakage, and receipt of item state after pickup), total suite expected **38 tests**.
- README and state controller updated; no Cloudflare Worker code touched in this checkpoint.

### Validation / boundaries

- Automated GitHub Actions run for regression tests completed successfully at commit `02ddb8c030c22fe9c5eada63938beedc1dd1c32e`.
- GitHub Pages auto-publication and live post-fix AI narration have **not** been independently browser verified.
- This is a focused fix, **not** a generic arbitrary-action GM adjudicator: only authored observation targets resolve; unknown targets receive a safe clarification rather than fabricated outcomes.
- Because the existing Worker already returned the correct `look/window` action, **no fresh manual Cloudflare paste is required**.

**Next:** `confirm-in-browser-window-observation-and-expand-perception-contract`.


## Checkpoint 004 — 2026-10-21

**User request:** Display AI connectivity/active-state, optionally remember GAME_TOKEN across future site visits, and export complete diagnostics to investigate game anomalies, including an earlier report that the introductory prompt repeated.

### Recovery and scope

- Inspected current `main`, existing browser script, HTML/CSS, Worker, engine, and checkpoint.
- Existing accepted checkpoint 003 preserved. No changes to seeded simulation mechanics.
- Existing GitHub Pages client uses a manually pasted Cloudflare Worker; commits to GitHub do not automatically refresh that Worker.

### Implemented

- Cloudflare Worker `GET /v1/gm/status`: *authenticated* no-OpenAI-call readiness check. Requires GAME_TOKEN and configured OPENAI_API_KEY; returns `authenticated: true`, selected model names, `model_call_verified: false`. A successful status check intentionally does **not** claim that OpenAI API inference has succeeded.
- Browser AI indicator with explicit disabled, missing token, checking, gateway authorized, model responded, failed states. Explicit **TEST AI CONNECTION** action; timing/status/error recording. 404 tells user to deploy newer Worker.
- GAME_TOKEN can be remembered **only with explicit opt-in** in browser localStorage, not in GitHub public HTML, game saves, or diagnostic reports. **FORGET SAVED TOKEN** erases the local copy.
- Auto-recovery of a valid autosave from localStorage on page load prevents unintended return to opening narrative, and player command echoes distinguish ignored actions from introduction.
- New `src/diagnostics.mjs`: bounded action/session log, model requests/responses and HTTP statuses, browser errors, redaction, deterministic full game state, scenario and rules config. **EXPORT DEBUG** downloads a separate report, leaving **EXPORT SAVE** available for the engine save.
- New `docs/DEBUGGING.md`, README updates, tests and CI syntax checks.

### Validation

- Expanded test suite to **34 tests**: engine behavior, Worker authentication/readiness, safe exports, UI control bindings.
- GitHub Actions validation runs automatically on main. (Do not equate mocked gateway tests with live OpenAI availability.)
- No live credential or GAME_TOKEN values accessed, recorded or committed.
- Live browser/Worker end-to-end integration **not yet verified** here. User needs to deploy updated `worker/index.mjs` in Cloudflare before testing `/v1/gm/status`.

### Next action

`manual-worker-refresh-and-first-debug-export-smoke-test`


## Checkpoint 003 — 2026-10-20

**Scope:** Assign current OpenAI API models to each Game Master role and implement server-controlled routing without changing the existing deterministic engine.

### Applied

- Official OpenAI model catalog/pricing checked for `gpt-6-luna`, `gpt-6.1-sol`, `gpt-6-astra` and supported Responses API reasoning efforts and Structured Outputs.
- `worker/index.mjs` routes player intent to Luna (`none`), narration to Sol (`low`), and the provisional NPC dialogue endpoint to Sol (`medium`).
- Server-side model override allowlist is limited to these three verified models. Client-provided requests cannot choose an arbitrary model. A Sol/Astra override of Luna's route automatically increases reasoning effort from `none` to `low`, avoiding unsupported API settings.
- Per-route output token budgets replace one global cap.
- `worker/wrangler.jsonc` updated to use the three route-specific model defaults rather than legacy `OPENAI_MODEL`.
- `docs/MODEL-ROUTING.md` records current routes, planned referee model, opt-in only Astra, pricing, costs, limitations and validation.

### Automated validation

- Added four model-routing tests in `tests/worker.test.mjs`. Expected suite: **25 total tests** (10 engine + 15 Worker).
- All new Worker role-selection tests passed under GitHub Actions at `a7ff2cfee51d22a4a39637be98602f577459bd37`.
- No real OpenAI API calls, manual Cloudflare paste, or browser QA claimed. Selected GPT-6 model availability with the user's API project has not yet been verified.

### Strict boundaries

- The Worker has **no live full AI exception adjudication route**. Sol's referee responsibility is an architecture contract, not a completed feature.
- Minor/background NPC routing and Astra escalation are planned, not silently enabled.
- This source commit does **not** update the manually managed Cloudflare Worker; paste the current `worker/index.mjs` again to deploy the new model routing.

**Next action:** `manual-cloudflare-worker-deployment-verify-and-test`.


## Checkpoint 002 — 2026-10-20

**Scope:** User supplied existing Cloudflare Worker URL `https://dinosaur-rpg.diabolicdonut.workers.dev/` and confirmed Cloudflare secrets `OPENAI_API_KEY` and `GAME_TOKEN`. This checkpoint prepares the Worker integration and GitHub Pages browser client.

### Implemented

- `worker/index.mjs`: OpenAI Responses AI intent, narration, dialogue draft endpoints; strict output schemas, no persistent world mutation; exact origin allowlist, token authentication, input bounds, 24-second provider timeout, sanitized failures.
- `worker/wrangler.jsonc`: existing Worker name `dinosaur-rpg`, both secrets required, global single-player Cloudflare `GM_LIMITER` binding (30 calls per minute per location).
- `src/app.mjs`: direct HTTPS Worker endpoint, client-side runtime bearer token (not saved), typed player action mapping, unsupported-action clarification and local deterministic commands intact.
- `index.html` and `src/style.css`: password-style token input to supply personal `GAME_TOKEN`.
- `tests/worker.test.mjs`: eleven offline Worker mock tests, covering origin, auth, strict output, upstream failures and rate limiting. Total engine + gateway automated tests: 21.
- `docs/DEPLOYMENT.md` and README: instructions for connecting existing Worker to GitHub and enabling GitHub Pages.

### Validation and boundaries

- GitHub Actions validated the browser+Worker integration and 21 tests successfully at `ca578cacb52245842d84a65812a7666188b7cfaf` and subsequent source-only documentation changes.
- **Cloudflare deployment is not claimed.** Only GitHub has been modified. The existing `workers.dev` URL could still contain the Hello World starter.
- **Live OpenAI calls are not verified.** No server-side Cloudflare credentials or API key contents were read.
- Full AI rules-exception adjudication and canonical persistent NPC conversation are **not** implemented: the current Worker deliberately refuses to invent effects the engine cannot validate.
- `GAME_TOKEN` is a single personal bearer credential. CORS alone is not authentication; rate-limiting is not a guaranteed spending cap.

**Next action:** User connects the existing Worker to GitHub Builds (branch `main`, root `worker`) and enables GitHub Pages. Then confirm `/health` and browser interaction.


## Checkpoint 001 — 2026-10-20

**Scope:** Stand up the user's new `Diabolicdonut/Dinosaur-Horror-RPG` GitHub repository with an initial personal-use *Jurassic Park* cinematic survival-horror prototype.

### Repository recovery

- Original repository was verified to exist and to be empty at the beginning of implementation.
- No earlier source, history, checkpoints, or accepted progress were overwritten.
- Privately uploaded reference PDFs were located in Library. *Year Zero Mini* v1.1 was machine-readable; the large *Alien RPG* PDF is primarily image-based, so a detailed rules-as-written comparison is explicitly deferred rather than fabricated.
- Neither rulebook has been committed.

### Implemented

- Data-isolated 1993 Isla Nublar scenario with seven connected sectors, access gates and objective flags.
- Browser command interface, tactical sector map, health/stress indicators, event log, save/load/export.
- Seeded deterministic simulation with persistent items, a persistent raptor, dice, stress and simplified panic/evasion.
- Optional localhost OpenAI Responses gateway for bounded intent parsing and post-resolution prose.
- Node test harness, 10 unit/scenario checks, GitHub Actions workflow.
- Rules contract and source/reference limitations documented in `docs/RULES-BASELINE.md`.

### Validation

- First GitHub Actions run: `39462538286`, **completed: success** at commit `16d3c4e71067f2efdc5e5482cce93034e1be88c8`.
- The workflow runs `node --test` and `node --check` on source modules.
- No live OpenAI API test was performed: the user has not supplied or configured an API key, which must never be committed.
- No in-browser click-through test has yet been performed. Initial acceptance means source and automated engine tests passed, not that every UI/browser interaction was visually verified.

### Known gaps / next work

1. Browser smoke test and visual QA.
2. Exact Alien dice, push and panic mechanics comparison to source and revise deviations deliberately.
3. Species-specific hearing, visibility, scent, pursuits, attacks, injuries and survival.
4. End-to-end walkthrough tests that establish an achievable player path and fail/escape rates across many seeds.
5. Establish optional remote AI hosting and optional GitHub Pages publication (static-only game works without AI).

**Next action:** `browser-smoke-and-canon-rules-audit`
