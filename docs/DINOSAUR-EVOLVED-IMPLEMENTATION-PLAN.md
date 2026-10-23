# Dinosaur Horror RPG — Living Game Vision and Evolved Implementation Roadmap

**Purpose:** Shared, living product vision, mechanical contract, long-range roadmap and development acceptance policy for Dinosaur Horror RPG. **Updated:** 2026-10-23 (approved Alien adaptation scope correction and scene-framing slice; accepted 007-L2a, 007-L2b still next). **Originally approved mechanical direction:** 2026-10-22. This file is a plan, not evidence that all listed systems are implemented.

**Project:** A personal-use browser RPG initially set in the Jurassic Park / Isla Nublar world. Keep scenario/franchise data separate so a future original dinosaur-survival setting can reuse the underlying game. The finished experience should be an Alien Evolved-style cinematic/campaign Jurassic Park RPG with credible animal encounters, wonder, human drama, rules consequences and a capable Game Mother—not park management.

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

**Recovered accepted gameplay baseline:** Checkpoint **007-L2a**, app version **0.7.12**, **324/324** deterministic tests, main commit `e10d7f8971ff0194d138633438a7204aac0d8897`; both final Actions and Pages succeeded. The subsequent first **read-only cinematic scene-framing** slice is separately validated and does not complete 007-L2b or the autonomous Game Mother. **Interactive desktop/mobile graphical gameplay smoke remains outstanding.** Refer to [../project-state.json](../project-state.json), newest [../audit.md](../audit.md) and current GitHub main for later accepted state.

| Domain | Accepted playable subset | Open work / honest limits |
| --- | --- | --- |
| Character Lab and roster | Nine Jurassic career mappings; 12 skills; Evolved-inspired seeded individual d6/stress checks; manual/auto/hybrid 1–8 character setup and launch | Several of 27 talent hooks have no world effects; source-complete advancement, panic and specialist capabilities remain partial |
| Party/Character/Spectator | Independent 007-series party incident, shared persistent world, knowledge-bounded offline director, atomic mode/camera switches, spectator controls | Generative companion conversation, richer agendas/relationships, complete NPC simulation and full free-form actions not yet live |
| Combat and injuries | Seeded initiative, quick/full budgets, raptor slots, defense choice, surprise/ambush, wounds and medical clocks in growing Evolved-inspired subset | Species-specific attacks, complete equipment/armor/ammunition, environmental complications and complete edition parity remain |
| Pursuit, stealth and vision | Zone-bound routes/sound, finite individual lamps, timed searches, individual/group movement, directional short-range sightlines, named physical cover, and **007-L2a route-constrained slow stalking plus creature-facing light perception** | Dynamic physical occluders, changeable weather, distinctive raptor attack/pursuit tactics, scent/wind, additional simulated species and finer geometry remain |
| Wonder and discovery | Four optional world-anchored scenes, each saved to one survivor's private journal without time/dice cost | Distant herbivores are presently ambient-only; physical herbivore interactions are future scenario features, but persistent herd populations are not a requirement |
| AI Game Master | Separate legacy 006.2 browser/Cloudflare Worker v006 supports bounded parsing, narration and four typed improvised actions | New party incident is primarily offline/deterministic; fully conversational multi-actor GM, compound actions, persistent dialogue and Worker integration are pending |
| Scenarios and presentation | Playable seven-zone island incident; initial local cinematic scene framing; park objectives, wonder scenes and saves | Conditional event/encounter director, multi-scene campaign, NPC dialogue, richer park content and graphical QA are pending |

**Technical nuance:** The legacy 006.2 solo game and manually deployed Worker v006 are *separate from* the newer 007 party game; neither inherits new 007 mechanics automatically. Party save kind `dinosaur-party-incident` remains schema **v3** with v2→v3 migration and optional later fields. Old solo saves remain isolated. The private Evolved PDF is never committed to GitHub. Source parity is incremental, not complete.

Detailed feature truth lives in the latest accepted audit and implementation reports—not in older individual checkpoint summaries, which are historical records. An older paragraph using "planned" does not overturn a newer validated checkpoint.

## 5. Near-term milestone roadmap and dependency gates

Milestone labels below express the current accepted order, **not immutable dates**. Before work, inspect newer `main` and adjust if later validated work has already advanced the plan. Never replay completed milestones.

### 007-L — Spatial and species-grounded survival (IN PROGRESS)

- **007-L1 complete in automated acceptance:** Authored directional one-exit sightlines separate from travel/hearing; solid foliage/door occlusion; local named cover checked with seeded Mobility; actor-only glimpses; one Velociraptor sensory profile with saved `patrol / investigate / stalk / search / engage` stages. Wonder and Dread personal discoveries preserved. **307/307** tests and CI/Pages passed; manual browser verification remains outstanding.
- **007-L2a accepted on main:** Velociraptor low-alert stalking now differs from high-alert investigation by physical movement cadence (one legal zone per four vs two exploration actions); actual creature-facing constraints and sound-guided turning, finite clue decay and validated, persistent hunt records are implemented without changing attack tables. **324** deterministic tests cover the retained mechanics and new cases; final main CI/Pages and manual graphical QA are separate.
- **007-L2b next:** Complete environmental perception with relevant changing obstructions/weather; implement grounded and tested approach-versus-attack choices, original Velociraptor encounter tactics and consequences without cheating Evolved combat/defense or target knowledge. Do not call the whole 007-L milestone complete until this follow-up is accepted.
- **Gate:** Successful legal/blocked passage and line-of-sight tests, seeded search/pursuit/cover/attack replay, no leaked hidden animal information, compatibility across all three modes, saves and previous tests. Test quiet/violent and nonviolent animal behavior where actually implemented. Report manual graphical testing honestly, separately from CI.

Reference: [Stalking and Facing 007-L2a](DINOSAUR-STALKING-007L2A.md), [Spatial / Velociraptor 007-L1](DINOSAUR-SPATIAL-007L1.md), [Lighting and Timed Search 007-K](DINOSAUR-LIGHT-STEALTH-007K.md), [Pursuit 007-J](DINOSAUR-PURSUIT-007J.md).

### Parallel scene track — first cinematic scene framing

- Initial **read-only** character-local scene overlay now exposes scenario opportunity and tone in each existing room and reflects only committed public mission progress. It does not spend time/RNG, summon animals or preordain outcomes.
- Next implement a **typed, validated scene/event contract** and Evolved-style encounter/danger pressure. Build a short multi-scene *After the Storm* Cinematic adventure with legitimate wonder, meaningful problem-solving, an encounter, recovery and player-influenced outcome.
- This work can proceed in parallel with accepted 007-L2b and 007-M mechanical necessities. Do not gate scene play on persistent populations, ecology or a complete island simulation.
- **Gate:** all three control modes, local knowledge, scenario and legal encounters, no fabricated items/animals, reproducible outcomes, saving and real browser QA. See [Scene Contract](CINEMATIC-SCENE-CONTRACT.md).

### 007-M — Physical resources, equipment and park systems (AFTER 007-L VALIDATION)

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
