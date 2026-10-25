# Dinosaur Horror RPG — Living Game Vision and Evolved Implementation Roadmap

**Purpose:** Shared, living product vision, mechanical contract, long-range roadmap and development acceptance policy for Dinosaur Horror RPG. **Updated:** 2026-10-25 (accepted 009-B1 shared adventure-world boundary after 009-A; graphical QA pending). **Originally approved mechanical direction:** 2026-10-22. This file is a plan, not evidence that all listed systems are implemented.

**Project:** A personal-use browser RPG initially set in the Jurassic Park / Isla Nublar world. **The runtime game engine must be wholly adventure-agnostic.** The existing `After the Storm` incident is only a sample fixture, not the product's required map, rescue quest, NPC cast, creature set or dramatic structure. Future Game Mother-generated adventures must vary in objective, setting, people, species, scenes, causes and outcomes while sharing one deterministic Evolved-based engine. See the authoritative [Adventure Package / Game Engine Separation Contract](ADVENTURE-ENGINE-SEPARATION.md). The goal remains dinosaur survival horror, action, wonder and human stories—not park management.

## 009-B1 — Physical-world data extraction (accepted, 2026-10-25)

A reusable `createAdventureWorld(compiled)` adapter now validates and privately projects rooms, starts, finite physical inventories, aliases, item labels and graph navigation for any compiled package. The existing Party game uses that adapter for world start/room displays/map movement and item labels. Eight focused tests target correct world differences, no teleporting, immutable copies, manifest tamper rejection and legacy Party action/save parity (478/478 passed on accepted main, Actions 40240771068; Pages 40240770843 passed). This is **not** completion of 009-B: the second adventure still does not run through Party, and named Nublar objectives, creatures, escort/scene logic and endings remain in the shared runtime. Follow with generic objective/action resolution, instance ownership in saves, independent second-scenario Party play, then seeded variants. Do not declare CI or manual browser QA passed without verification.

## 009-A milestone — executable adventure definition foundation (implemented candidate, 2026-10-25)

The first reusable adventure compiler is in `src/adventure-definition.mjs`: versioned JSON-only manifests, physical reachability and conservation-oriented item registry checks, acyclic objectives and typed effects, initial creature placement, seeded hidden variant choices, reproducible content fingerprints and save-binding identity. `adventures/after-the-storm.mjs` adapts the accepted 7-zone Nublar incident; `adventures/ridge-survey.mjs` is a **different research mission definition** with five physical locations, distinct goals, an ordinary walk-out ending and multiple selectable hidden factual circumstances. These are independently valid **data manifests**; The Long Count is **not playable through Party** until 009-B. Source and tests: [009-A technical report](ADVENTURE-MANIFEST-009A.md).

New Party-v3 saves for the existing playable incident contain its declared adventure ID, revision and deterministic fingerprint, while older v3/v2 saves without this optional field remain valid. **470 deterministic Node tests targeted**, including all 454 prior gameplay regressions. No change to the actual Evolved check or combat RNG. The current Party engine and directors **still import `SCENARIO` and hardcode the prototype's named rescue logic**. The next acceptance gate requires 009-B generic action/objective/scene handling and actual second-adventure play via the **same unchanged core**; compilation of two packages alone is insufficient.

## Non-negotiable priority — modular adventures (architecture correction, 2026-10-25)

**This precedes 007-M2 scenario-specific repairs or additional hardcoded Cinematic scenes.** The current implementation still directly imports the `SCENARIO` singleton and embeds `control/shed/generator/radio/beacon`, a fixed Velociraptor, named Mara Velez, hardcoded story events and rescue assumptions into `src/party-engine.mjs` and supporting modules. Historical descriptions of "isolated" scenario content were aspirations, **not an accurate description of implementation**.

Separate (1) Evolved mechanics, physical world/action semantics and validated state; (2) typed, independently loadable adventure manifests with roles/objectives/creature and NPC instances; and (3) a bounded AI Game Mother that generates or directs such instances, never bypassing the engine. Preserve complete accepted *After the Storm* behavior as one test package, with a migration contract for saved party-v3 incidents. Make the engine run an **independent second adventure with different geography and objectives without altering core code** before claiming decoupling.

**Development sequence:** audit named imports and actions → define/validate adventure format → extract `After the Storm` behind a generic interface → create and play a second distinct scenario → test saves/replay/Evolved and actor privacy → add **meaningfully seeded replay variants to pregenerated templates** → generate original standalone Cinematic adventures → generate continuing Campaign chapters from persistent history → expand validated AI Game Mother authoring/direction. Endings emerge from decisions; the generator does not require generator–radio–helipad, mandatory predators, a fixed arc or ecological simulation. Read [Architecture contract](ADVENTURE-ENGINE-SEPARATION.md) and [Replayability/generation contract](PROCEDURAL-ADVENTURES-REPLAYABILITY.md) before adding new gameplay capabilities.

## Core product goal — surprise even when replaying known adventures

Ship several well-authored, pregenerated adventures, **each with meaningful per-playthrough seeded variability**, and ultimately an open-ended generator of original Cinematic adventures and continuing Campaigns. The player should not be able to memorize a fixed culprit, animal appearance, danger trigger, clue location or evacuation route merely from selecting an adventure they've played before. Different seeds can change *actual causal circumstances*, not only descriptive text, while preserving an authored adventure's identity, the Evolved rules, physical plausibility, fair clues and player freedom.

A new procedural Cinematic adventure may have a different premise, route, cast, problem and conclusion from any prewritten module; a continuing Campaign generates chapters based on persistent character/world consequences. The director can respond unexpectedly **without retrospectively changing established hidden truths or committed state**. A valid adventure also permits wonder, quiet resolution, voluntary danger avoidance and tension that rises/falls rather than a predictable forced scare cycle.

The new requirement is documented in [Procedural Adventures and Replayability](PROCEDURAL-ADVENTURES-REPLAYABILITY.md). **Neither procedural authored-template replayability nor open-ended generation is currently implemented.** This remains behind the prerequisite scenario/engine separation and second-adventure gates.

## 1. Core premise — Alien RPG translated into Jurassic Park

**This project adapts *Alien RPG Evolved Edition* into Jurassic Park.** It preserves Alien's actual dice, stealth, encounter and danger procedures, Game Mother discretion, cinematic acts/events, campaign continuity, stress, combat, injuries and agency. It is **not** a wildlife-population or zoo-management simulator.

The three source themes translate directly:
- **Dinosaur Horror:** Isolation, stalking, fear, extreme risk and survival consequences.
- **Sci-Fi Action:** Rescue, urgent repairs, vehicles, park systems, human conflict and daring escapes.
- **Sense of Wonder:** Magnificent dinosaurs, extraordinary scale, natural history, beauty and curiosity.

**Believable encounters rather than continuous ecology:** A Brachiosaurus or Parasaurolophus may remain peacefully wondrous. A Triceratops or Stegosaurus may be calm, indifferent, startled, dangerous or defensive in credible circumstances. A carnivore need not attack on sight. Encounter causes and mechanical consequences should make sense, but animals do not require always-running needs, breeding, feeding, territory and herd systems. Alien-style authored events, encounter/danger pressure and GM discretion provide dramatic opportunities without guaranteed combat.

**Scene-based campaign cadence:** A rescue/escape mission can span investigation, wonder, action, threat, recovery and interpersonal drama in distinct linked scenes. The overarching problem persists while scene-by-scene tension rises and falls. Scenes present situations and possibilities; player actions determine outcomes, including avoidance and unexpected resolutions. No fixed scare cadence or scripted movie reenactments.

**Governing contracts:** [Cinematic and Campaign Scenes](CINEMATIC-SCENE-CONTRACT.md) and [Wonder and Dread](WONDER-AND-DREAD-DESIGN.md). Prior planning language describing persistent populations, herd migration, feeding schedules and long-term ecology as mandatory acceptance criteria is **superseded**. These are optional additions needing explicit gameplay justification, not development prerequisites. Previously accepted per-character Wonder discoveries remain.

**Target experience:** Create a party, roleplay freely in a sequence of Jurassic Park situations, meet believable dinosaurs and people, resolve choices through Evolved, experience horror/action/wonder in contrast, and carry consequences across Cinematic adventures or Campaign chapters. Complete AI scene direction is still future work.

## 2. Non-negotiable mechanical and AI doctrine

1. **Source fidelity.** The privately supplied *Alien RPG — Evolved Edition* is the primary authority for applicable mechanics: four attributes, 12 broadly usable skills, seeded d6 base/stress pools, pushes, extra successes/stunts, Resolve, stress responses/panic, talents, passive/opposed checks, exploration/combat timing, initiative/action budgets, injuries, equipment and recovery. Keep source dice internally even when hidden in the interface; do not substitute a percentage-only resolver. Use original 2019 Alien rules for historical comparison and Year Zero Mini as tertiary background. All deviations are specifically accepted, documented and tested Jurassic adaptations.
2. **Original thematic implementation.** Park careers, animals, equipment, scenarios, prose and creature capabilities are original adaptations, not wholesale copies of published character descriptions, creature tables, pages or art. Never commit or redistribute the user's private rulebook or secrets.
3. **Natural-language first.** The eventual player interface accepts objective, target and physical method in ordinary language, not a required command list or tabletop skill vocabulary. Buttons/debug action names can coexist as accessibility shortcuts while the full interface is built.
4. **One authoritative deterministic world.** Pure engine code validates physical reality, ownership, timing, skill/talent eligibility, state transitions, dice, injuries, item use, world creatures and victory/failure. Random results, seeded state and accepted proposals are journaled for replay; no model writes arbitrary state.
5. **AI GM, bounded by validation.** AI interprets intention, suggests suitable rule/attribute/skill/typed effects, portrays dialogue and narrates only committed, visible outcomes. The GM is intended to be a full conversational referee, not merely a parser or flavor generator, but must not fabricate inventory, roll outcomes, dinosaur positions or secret observations.
6. **Information security inside the fiction.** Each survivor and computer-controlled companion uses only own sight, hearing, memory, known plans and believable communication. Separately filter authoritative world, bounded adjudication context and player-facing narration; no omniscient companion decisions or narrator spoilers.
7. **Stable replay and compatibility.** Keep save migrations explicit, preserve accepted events, record changing control owners and action costs, and test replay across actor modes. Browser, Worker, private model tokens, legacy solo and party incident have separate compatibility/deployment boundaries.
8. **Consequences without compulsory dice.** Routine possible acts do not require rolls; impossibilities do not become possible because an AI proposes them. Uncertain consequential acts use exact eligible mechanics, valid resources and real time/action costs.

**Authority order for mechanical conflicts:** newer explicitly accepted Dinosaur Horror decisions and documented house rules → Evolved Edition → 2019 Alien for approved comparisons only → Year Zero Mini for tertiary context → old prototype solely as evidence of its implemented behavior. This plan cannot silently supersede a newly accepted decision or declare an unimplemented rule complete.

Read [Evolved Rules Authority](EVOLVED-RULES-AUTHORITY.md), [Hybrid AI GM Architecture](ARCHITECTURE-AI-GM.md), [Referee Contract](REFEREE-CONTRACT.md) and [Model Routing](MODEL-ROUTING.md) for finer distinctions. Specific model assignments are implementation policy and may change after evaluation; their names are not part of the game vision.

## 3. Characters, agency and creation contract

**Character mechanics:** Keep the four Evolved attributes (Strength, Agility, Wits, Empathy) and the 12 internal broadly accessible skills: Heavy Machinery, Stamina, Close Combat, Mobility, Ranged Combat, Piloting, Observation, Comtech, Survival, Command, Manipulation and Medical Aid. Untrained skill attempts are allowed. Starting characters use the accepted Evolved 10-point skill allocation, career starting caps and a career talent, with separate character-validating code. Method can justify a non-default attribute/skill pairing; career never functions as an exclusive class lock.

**Original park career mappings** currently include Tactical Response Specialist, Park Ranger/Security Officer, InGen Representative, Young Visitor, Field Medic/Veterinary Technician, Park Operations Supervisor, Pilot, Park Maintenance Technician and Paleontologist/Geneticist. Preserve the accepted nine-career mapping and 27 adapted career talents; audit each world-dependent talent effect before claiming it works in live play. Long-term advancement, relationships, fears, agendas and story consequences must be persisted—not replaced by character regeneration.

**Any/all-character creation:** A player may manually construct, automatically generate or hybrid-edit any or every slot in a 1–8 person party. Lock or reroll chosen attributes, careers, talents, inventory and identity as allowed; one shared Evolved-based validator approves all variants. Character-generation RNG is separate from live scenario RNG. Characters are approved before play, then change only through legitimate progression and consequences.

**Three runtime-switchable agency modes—one simulation:**
- **Party:** Human controls all playable survivors' decisions; dinosaur and outside NPC behavior remains simulated.
- **Character/Focus:** Human controls one chosen survivor; bounded AI directs the others. Human can switch controlled survivor without rewriting world events.
- **Spectator:** AI directs the playable party through the same scheduler, with Pause/Step/Resume and viewing pace; this is active browser simulation, not a background-running service.

Control mode and camera/viewpoint are independent. Mid-play changes apply at safe action boundaries; they never grant free actions, reroll results, reset initiative or leak another character's knowledge. AI companions should eventually make differentiated decisions based on relationships, objectives, fears and curiosity, but the existing offline bounded director is **not yet generative companion roleplay**.

Reference: [Character Generation Modes](CHARACTER-GENERATION-MODES.md), [Evolved Character Matrix](EVOLVED-CHARACTER-MATRIX.md), [Multi-Character Control Modes](MULTI-CHARACTER-CONTROL-MODES.md).

## 4. Honest implementation snapshot (2026-10-23)

**Accepted baseline:** 008-C1 v0.7.19 at `de72f0e9ef0e885ae512f6d89a60bcb1144486a8`, **440/440** tests with main Actions and Pages successful. Candidate **007-M1 v0.7.20** introduces two finite lamp replacement cells, physical pickup/transfer and one-time accountable consumption, plus 14 tests (target **454**). The source-compatible Evolved dice/lighting/time and party v3 saves remain authoritative; not full Evolved resource or Campaign parity. Validate final accepted main Actions and Pages separately. **Hands-on desktop/mobile graphical gameplay QA remains outstanding.** The actual current main, [../project-state.json](../project-state.json) and newest [../audit.md](../audit.md) are authoritative.

| Domain | Accepted playable subset | Open work / honest limits |
| --- | --- | --- |
| Character Lab and roster | Nine Jurassic career mappings; 12 skills; Evolved-inspired seeded individual d6/stress checks; manual/auto/hybrid 1–8 character setup and launch | Several of 27 talent hooks have no world effects; source-complete advancement, panic and specialist capabilities remain partial |
| Party/Character/Spectator | Independent 007-series party incident, shared persistent world, knowledge-bounded offline director, atomic mode/camera switches, spectator controls | Generative companion conversation, richer agendas/relationships, complete NPC simulation and full free-form actions not yet live |
| Combat and injuries | Seeded initiative, quick/full budgets, raptor slots, defense/surprise, wounds/medical clocks and accepted 007-L2b1 original bite-versus-physically-earned pounce | Additional species, complete gear/ammunition/armor and Evolved parity remain beyond 007-L |
| Pursuit, stealth and vision | Zone routes, sound, finite lamps, cover, 007-L2a stalking and facing; 007-L2b2 candidate adds an authored operable shed shutter and one brief tropical squall that changes local sightlines and routes | Broader terrain, physical equipment, multiple species and deeper weather are not prerequisites for the current 007-L encounter slice |
| Wonder and discovery | Four optional world-anchored scenes, each saved to one survivor's private journal without time/dice cost | Distant herbivores are presently ambient-only; physical herbivore interactions are future scenario features, but persistent herd populations are not a requirement |
| AI Game Master | Separate legacy 006.2 browser/Cloudflare Worker v006 supports bounded parsing, narration and four typed improvised actions | New party incident is primarily offline/deterministic; fully conversational multi-actor GM, compound actions, persistent dialogue and Worker integration are pending |
| Scenarios and presentation | Seven-zone rescue incident, Wonder, optional physically situated herbivore and real companion dialogue; 008-C1 park guide rescue choices accepted | Rich autonomous NPC dialogue/combat, full Campaign arcs and manual graphical QA remain |

**Technical nuance:** The legacy 006.2 solo game and manually deployed Worker v006 are *separate from* the newer 007 party game; neither inherits new 007 mechanics automatically. Party save kind `dinosaur-party-incident` remains schema **v3** with v2→v3 migration and optional later fields. Old solo saves remain isolated. The private Evolved PDF is never committed to GitHub. Source parity is incremental, not complete.

Detailed feature truth lives in the latest accepted audit and implementation reports—not in older individual checkpoint summaries, which are historical records. An older paragraph using "planned" does not overturn a newer validated checkpoint.

## 5. Near-term milestone roadmap and dependency gates

Milestone labels below express the current accepted order, **not immutable dates**. Before work, inspect newer `main` and adjust if later validated work has already advanced the plan. Never replay completed milestones.

### 007-L — Spatial and species-grounded survival (IN PROGRESS)

- **007-L1 complete in automated acceptance:** Authored directional one-exit sightlines separate from travel/hearing; solid foliage/door occlusion; local named cover checked with seeded Mobility; actor-only glimpses; one Velociraptor sensory profile with saved `patrol / investigate / stalk / search / engage` stages. Wonder and Dread personal discoveries preserved. **307/307** tests and CI/Pages passed; manual browser verification remains outstanding.
- **007-L2a accepted on main:** Velociraptor low-alert stalking now differs from high-alert investigation by physical movement cadence (one legal zone per four vs two exploration actions); actual creature-facing constraints and sound-guided turning, finite clue decay and validated, persistent hunt records are implemented without changing attack tables. **324** deterministic tests cover the retained mechanics and new cases; final main CI/Pages and manual graphical QA are separate.
- **007-L2b1 accepted on main:** First legal approach into a survivor's actual zone can earn **one first-round pounce** (+1 attack die, unchanged damage) rather than an ordinary close bite; blocked doors, forged/used hunt records and old/successive rounds do not qualify. A powered lamp exposes colocated hidden characters and blocks newly hiding against the animal without turning off their light. Evolved initiative, declared defender choices, wound effects and party v3 saves remain. **13 tests added**, target 346; final main CI/Pages and manual graphical QA are separate gates. See [007-L2b1 encounter adaptation](DINOSAUR-ENCOUNTER-007L2B1.md).
- **007-L2b2 accepted on main:** The authored hand-operated **shed/jungle storm shutter** changes physical passage for survivors and Velociraptor, obscures sightlines and attenuates sound; it can be opened from either side using a real action. A single short **tropical squall** in exploration stretches 2–3 obscures relevant outdoor one-zone visibility but not travel, sound or same-zone combat. The optional shutter flag preserves old v3 saves. **16 tests added**, target 362, with distinct final main CI/Pages and graphical QA gates. See [007-L2b2 encounter environment](DINOSAUR-ENVIRONMENT-007L2B2.md).
- **007-L mechanical scope assessment:** Original bounded line of sight, physical cover, legal stalking/search, a grounded raptor attack choice and one changing obstruction/weather example now exist. **Do not call actual desktop/mobile visual gameplay QA complete** until hands-on play verifies them. After accepted main validation, prioritize scene/event director, Alien-style encounter/danger pressure and 007-M resource mechanics; do not extend ecology or build a global weather engine simply to enlarge 007-L.
- **Gate:** Successful legal/blocked passage and line-of-sight tests, seeded search/pursuit/cover/attack replay, no leaked hidden animal information, compatibility across all three modes, saves and previous tests. Test quiet/violent and nonviolent animal behavior where actually implemented. Report manual graphical testing honestly, separately from CI.

Reference: [Stalking and Facing 007-L2a](DINOSAUR-STALKING-007L2A.md), [Spatial / Velociraptor 007-L1](DINOSAUR-SPATIAL-007L1.md), [Lighting and Timed Search 007-K](DINOSAUR-LIGHT-STEALTH-007K.md), [Pursuit 007-J](DINOSAUR-PURSUIT-007J.md).

### Parallel scene track — first cinematic scene framing

- Initial **read-only** character-local scene overlay now exposes scenario opportunity and tone in each existing room and reflects only committed public mission progress. It does not spend time/RNG, summon animals or preordain outcomes.
- **008-A conditional scene-event and pressure foundation (accepted):** Seven typed, gated, one-time-per-character story events are now playable from real locations, with independent personal Wonder journaling. Accepted outdoor exploration makes bounded deterministic **d6 pressure checks**; sneaking reduces, rushing increases, a face of one raises local pressure, and a dinosaur sound cue requires an actually audible creature. Neither an event nor pressure can summon an animal, force combat, invent items or skip Evolved procedures. Fifteen new tests target **377**. The distant valley scene is unavailable during heavy squall, so conditional Wonder stays physically grounded. This is an **original, explicitly documented Jurassic adaptation inspired by Solo**, not full Last Survivor or Cinematic event/danger RAW parity. See [008-A details](CINEMATIC-EVENT-DIRECTOR-008A.md).
- **008-B1 gated mechanical danger and act continuity (accepted):** The current incident derives three dramatic acts solely from committed rescue flags, allowing scenery, investigation, risk, recovery and wonder at any point. At the physically damaged paddock gate a capable character may optionally attempt a **Heavy Machinery** check through the real Evolved engine. Success braces the gate permanently; failure makes a loud clang processed by the existing raptor hearing system, with no automatic hit or creature teleport. A persistent per-actor attempt record prevents dice farming, compatible optional save fields retain v3; gate repair knowledge stays local. **12 new tests, target 389**. See [008-B1 danger specification](CINEMATIC-DANGER-008B1.md). Not yet a complete connected campaign or Evolved danger table reproduction.
- **008-B2 earned cross-scene consequences (accepted):** A survivor's real, paid, successful Observation investigation of the control-room consoles reveals a generator startup diagnostic. In the shed, **that same survivor only** receives exactly +1 situational Heavy Machinery base die on the existing Evolved generator check; another party member and failed investigators do not. The original time, stress, push, injury, possible failure and noise remain. Four new optional scene beats respond to personally studied tracks, generator preparation, physically braced paddock gate, and an actually sent distress call; personal failure memories and other actors' knowledge stay private. The scene registry grows from seven to **eleven**, but neither a gate repair nor a narrative scene forces combat. **16 new tests**, target **405**. See [008-B2 specification](CINEMATIC-CONTINUITY-008B2.md). This is connected scene consequence support, not a complete branching campaign.
- **008-B3 playable peaceful animal and real survivor conversation (accepted):** One authored Parasaurolophus stands across a drainage stream beside the Jungle Service Path. The player can choose a calm, no-roll **watch** with ordinary exploration time, attempt a genuine **Mobility** approach that may remain peaceful or startle the animal into a recorded retreat/noise 2, or ignore it entirely. A committed squall obscures the encounter, and real Velociraptor presence causes herbivore withdrawal; the animal is not a combat token or a population simulator. Actual colocated capable survivors may choose one-time **check-in** or **plan** talks, grounded in health/Stress and genuine rescue status, with **no free healing**, invented NPC or generative AI claim. Optional save history remains backward-compatible, privacy is respected, and personal Wonder journals and Evolved dice are retained. **19 new tests**, target **424**. See [008-B3 specification](CINEMATIC-ENCOUNTERS-008B3.md).
- **008-C1 one guide escort with accountable rescue choices (accepted):** One original visitor-services employee waits in the lobby, and survivors can optionally **talk**, use a real Evolved **Manipulation** check to persuade her, **escort** her physically through legal park routes, hand her to another actor, shelter in the actual reinforced control room, or **muster at the helipad**. She never teleports; blocked doors and shutters apply. Successful beacon Comtech completion remains unchanged but now truthfully reports whether she was accounted for, at the helipad, sheltered elsewhere, or unaccounted. New optional party-v3 state is validated and older saves work. The guide does not yet have a separate combat/medical sheet or autonomous generative dialogue: those cannot be claimed complete. **16 new tests**, target **440**. See [008-C1 guide rules](CINEMATIC-ESCORT-008C1.md).
- **Next:** Continue fuller, original, branching Cinematic rescues and intimate human scenes; prioritize finite 007-M resource choices and a typed 007-N Game Mother. Real manual browser QA remains outstanding. Do not require full wildlife ecology or a Zoo Tycoon simulator.
- This work can proceed in parallel with accepted 007-L2b and 007-M mechanical necessities. Do not gate scene play on persistent populations, ecology or a complete island simulation.
- **Gate:** all three control modes, local knowledge, scenario and legal encounters, no fabricated items/animals, reproducible outcomes, saving and real browser QA. See [Scene Contract](CINEMATIC-SCENE-CONTRACT.md).

### 007-M — Physical resources, equipment and park systems (AFTER 007-L VALIDATION)

- **007-M1 finite lamp replacement cells (candidate):** Two original sealed physical spare cells, one at the maintenance shed and one at the helipad, use existing pickup and same-room actor-to-actor transfer. `battery replace` spends one held cell only on an owned partly depleted lamp, restores the original maximum, costs an exploration action and leaves the lamp OFF. Stock validator enforces total in rooms + inventories + spent at most two; old party-v3 saves without cells/counter remain valid. No remote stock disclosure, free recharge, second light source, arbitrary repair modifiers or island ecology. **14 new tests, target 454**. See [007-M1 equipment contract](FINITE-EQUIPMENT-007M1.md).
- **007-M2 is future work:** introduce only scenically useful repair tools/supply consumption with legitimate Evolved skill checks, scarcity and saved failure effects. Do not retrofit battery changes into an invented universal resource system.

- Replace abstract or implied consumables where appropriate with owned, finite, transferable physical batteries, replacements, charging and pickup opportunities, without invalidating legacy lamp saves.
- Add authored tools, repairs, equipment scarcity and interactions with damaged doors, fences, generators, radios, medical supplies and weather; respect electricity, barriers and physical objects.
- Require valid tools, actors, materials, Evolved skills, real time and meaningful setbacks; item transfer/spending must persist and replay.
- **Gate:** Resource conservation, time/accounting, replay and failure-safe inventory tests; no conjured objects, free battery charge, implausible repairs, rule bypasses or forced hazards. All-mode and legacy save regression.

### 007-N — Bounded multi-actor natural-language Game Master (AFTER VERIFIED MECHANICAL PRIMITIVES)

- Extend intent recognition from one command to goals/methods and actor-specific **compound** plans, e.g., "switch off my light, wedge the cabinet against the door, then hide behind it".
- Validate real entities, sequence, actor ownership, skill/attribute/talent eligibility, action costs, stale proposals, interruptions and legal typed effect primitives *before* seeded resolution.
- Narrate committed actor-visible outcomes; model consequential speech and NPC interaction using validated state-change proposals separate from free dialogue. Preserve companion agency, curiosity and secrecy.
- Evaluate/refine the Cloudflare Worker protocol and model routing only when the party engine actually needs integration. GitHub commits do not deploy an existing manually pasted Worker; document and verify deployment independently when Worker source changes.
- **Gate:** End-to-end tests for novel, ambiguous, impossible, routine and multi-actor requests; exact dice/state replays, no fabricated facts, no hidden-state leaks, bounded cost/error handling, three control modes and interruption/rollback safety.

**Sequencing policy:** Finish essential raptor interaction 007-L2b and bounded equipment 007-M, while bringing typed scene/event/encounter structure forward in parallel. Natural-language 007-N requires validated deterministic effect primitives but does not require an island ecology simulator. The full AI Game Mother remains essential, not just narration.

## 6. Parallel product tracks (not yet numbered checkpoints)

### Scene-based Cinematic and Campaign play (PRIORITY)

- Design location-linked **situations, not predetermined endings**, with optional events, understandable triggers, scene exits and consequences.
- Adapt Evolved Cinematic acts/events, standard stealth hidden-threat handling and appropriate encounter/danger timers. A clock can create pressure without magically teleporting an animal, or requiring every encounter to be a fight.
- Connect chapters and multiple adventures through injuries, equipment, agendas, objectives, discoveries, NPC relationships and world decisions. Permit scenes of normalcy, recovery, wonder and genuine safety between frightening scenes.
- Validate player choices to avert, delay or transform a threat and long campaigns that don't depend on repeating identical predator attacks.

### Dinosaur-specific encounters

- Translate species into original Jurassic creature profiles with usable size, senses, attack methods, defensive reactions and recognizable encounter behavior under Evolved procedures.
- Allow peaceful herbivores, caution, defensive aggression and predator investigation or retreat when context warrants; **herbivore does not mean harmless**, predator does not mean always hostile.
- Maintain physical positions/awareness for active encounter participants where fair resolution or saves require it. Uninteractable distant animal scenery remains authorable without simulated individuals.
- Whole-island animal populations, feeding schedules, breeding, migrations, ecological budgets and always-on herd AI are **optional and not acceptance gates**. Do not make Zoo Tycoon features prerequisites for Cinematic/Campaign play.

### Human NPCs, character stories and island scenarios

- Give meaningful park staff, tourists and scientists limited knowledge, motivations, conversation and relationships that persist when narratively consequential. NPC dialogue cannot create mechanical facts without validation.
- Support quieter human interactions, investigation, exploration, rescue, human responsibility and action. Add scenario-specific park locations, technology, vehicles and geography as needed for compelling scenes; do not require mapping the entire island.

### Evolved parity and release quality

- Finish source-grounded stress/panic, character talents, injuries, armor, park equipment, vehicles and difficult combat cases as scenarios need them. Record accepted house rules with exact differences and tests.
- Preserve Party/Character/Spectator control and valid save migration. Integrate AI Game Mother through typed event/effect boundaries, secure Worker routing and player-perspective narration.
- Validate real interactive desktop/mobile gameplay separately from deterministic tests, CI and Pages deployment.

## 7. Original A–E implementation phases — revised status

Keep the original phase structure as a long-range *work breakdown*, not a claim that each phase must be completed serially or that early accepted features need rebuilding.

| Phase | Original objective | Status at 007-L2a | Remaining exit work |
| --- | --- | --- | --- |
| **A — Rules inventory and source mapping** | Source-to-engine matrix of Evolved timing, dice, skills, stress, injuries, equipment, combat and deviations | **Partially established** through rules authority and feature-specific parity reports | Consolidate/audit uncovered and intentionally adapted cases; fixtures for each accepted rule |
| **B — Characters and core engine** | Careers, 12 skills, manual/auto/hybrid party creator, actor IDs, seeded rolls, stable saves, control ownership | **Substantially playable alpha** in Character Lab and 007 party incident | Complete world-dependent talent hooks, progression, panic effects, stronger shared simulation contract |
| **C — Combat, stealth and survival** | Full action economy, predator perception, injuries, supplies and park-specific constraints | **Active** through 007-L2a; initiative, wounds, lighting, cover, slow actual stalking and facing-aware perception implemented as bounded subsets | 007-L2b attack/occlusion behavior; 007-M resources/hazards; advanced Evolved parity and credible species encounters |
| **D — Natural-language GM and autonomous actors** | Multi-actor conversation, validated typed effects, NPC dialogue, actor-limited narration and decisions | **Partially playable:** three modes and offline companion policy; separate legacy 006 Worker only | 007-N integration, compound decisions, genuinely conversational GM, persistent social NPCs |
| **E — Cinematic living incident and transition** | Original park missions, scenes, NPCs, story continuity, alternate setting and reliable deployment | **Early alpha:** starter island incident and personal wonder discoveries | Scene/event director, connected story arcs, scenario variety, social moments, QA and release gates |

**Original Phase A coverage checklist:** character creation and Health/Resolve; skill rank/attribute pairing; base/stress dice and pushes; Resolve/panic/stunts; active/passive/opposed checks; exploration/combat clock and actions; stealth/detection; armor/injury/death/healing; gear/supplies/vehicles; creatures/NPCs. Each entry should eventually specify: private source page, rule, inputs/outputs, timing, exception, adaptation decision, implementation file, tests and status. This is not permission to publish source text.

## 8. Release-quality definition of done

A finished milestone is not "green" merely because an agent says it implemented something. Require:
- Code and data changes supported by testable source/house-rule decisions, with positive, negative, RNG-seeded/replay and invalid-input cases.
- Physically grounded simulation: durable objects and animals, consistent movement/time, deterministic dice, no free actions, no invisible resource creation and no unearned omniscience.
- Save/restore and migration tests for earlier valid party states (party schema v3 and v2→v3), continued isolation of legacy 006.2 solo saves, and integrity under mode/camera switches.
- Separate reporting of local/CI automation, GitHub Pages deployment, Cloudflare Worker deployment where applicable, and **actual desktop/mobile interactive graphical smoke**. Do not mark the last category passed without doing it.
- Updated feature-fidelity/house-rule report, `project-state.json`, newest `audit.md` entry and `README.md` as needed. Include exact accepted commit SHA and outstanding limitations.

**Target-game acceptance (future, not current):** A user can generate/customize a party, explore a beautiful living island, experience peaceful and dangerous dinosaur encounters, converse with NPCs, describe novel compound actions without engine verbs, experience real source-grounded risks, injuries and character motives, switch among Party/Character/Spectator in mid-story, and resume or replay the same causal world. A full playthrough must permit wonder to remain wonder; danger follows credible situations and Evolved procedures rather than a compulsory terror rhythm or a mandatory population simulator. Test prolonged noncombat sessions as well as survival/escape and catastrophic failure.

## 9. Continuity and change management

**Read order before any new work:** current GitHub `main` and recent commits → `project-state.json` → newest/topmost accepted `audit.md` → this living roadmap → relevant domain contracts/reports and current tests. Do not confuse older checkpoint reports with current implementation status. If `main` has advanced, preserve the newer accepted work and reconcile rather than rollback.

- The roadmap describes **where we're heading**, not the currently deployed version; `project-state.json` records current machine-readable status, and `audit.md` preserves accepted historical evidence.
- New approved design directions (mechanics, Wonder and Dread, scope, agency, narrative doctrine) must be reflected here in the appropriate *permanent* section, with links to detailed contracts. Do not just append them to a transient checkpoint.
- Newly completed features update the dated status snapshot or its references and the affected A–E row. Avoid duplicate, stale "not implemented" claims after acceptance; distinguish accepted in tests vs manual QA.
- A deviation from Evolved requires: **source behavior → Jurassic revision → rationale → exact mechanical/numeric changes → regression tests → approval status**. Unless explicitly approved, keep Evolved default.
- Never erase source rationale or validated historical audit entries, change old saves silently, invent future milestone acceptance or publish the private rulebooks.
- If dependencies or milestone numbers change, revise this plan transparently, preserve accepted checkpoints and write an audit entry identifying the decision and why.

**Scope boundaries:** No claim of complete Evolved RAW, 3D free-roaming island, continuous ecology, fully integrated scene director or conversational OpenAI GM until separately implemented and verified. Ecological realism for its own sake is not a gate for playable adventures. No mandatory multiplayer or server-backed saves is assumed for this personal-use single-player project. New capabilities can be proposed and approved without treating this document as unchangeable law.
