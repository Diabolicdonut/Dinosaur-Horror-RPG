# Dinosaur Horror RPG — Living Game Vision and Evolved Implementation Roadmap

**Purpose:** Shared, living product vision, mechanical contract, long-range roadmap and development acceptance policy for Dinosaur Horror RPG. **Updated:** 2026-10-23 (aligned to Checkpoint 007-L2a candidate and remaining 007-L2b scope). **Originally approved mechanical direction:** 2026-10-22. This file is a plan, not evidence that all listed systems are implemented.

**Project:** A personal-use browser RPG initially set in the Jurassic Park / Isla Nublar world. Keep scenario/franchise data separate so a future original dinosaur-survival setting can reuse the underlying game. The desired finished experience is a persistent, story-rich island with believable animals, beautiful discovery, human dilemmas, real survival consequences and an AI Game Master—not merely a raptor combat simulator.

## 1. Permanent experience and creative pillars

**Wonder and Dread are equally foundational.** The park is magnificent *before* it becomes terrifying. Dinosaurs are animals with ecology, needs, intelligence and variable dispositions, not universally hostile enemies or video-game monsters. A peaceful sighting may remain peaceful. Awe, curiosity, stillness, beauty, study, animal welfare and natural history are legitimate experiences independent of combat rewards or jump scares. Danger grows from believable ecology, breakdowns, human decisions and circumstance. Never force every scenic moment into a threat.

Build toward four complementary emotions: **wonder, curiosity, unease and dread**, without requiring each scene to follow that order. Preserve time for silence, ordinary conversation, beautiful landscapes, grazing herds, nesting behavior, field observations and difficult ethical choices as well as concealment, pursuit, injury, escape and dread.

**Permanent creative authority:** [Wonder and Dread Design](WONDER-AND-DREAD-DESIGN.md). Its animal-ecology, player-perspective, journal, nonviolent and narration constraints apply to all playable modes and to generative GM proposals. Distant cinematic herbivore vistas are presently **ambient scenery**, not simulated position-bearing creatures. Future interactable animals must have durable identity, location, behavior, needs and causal histories.

**The target game loop:** Create a survivor or party; enter a living park with meaningful personal motives; navigate physical places and changing conditions; freely describe plausible actions and conversations; encounter animals, people and ecological discoveries; make hard tradeoffs around supplies, risk, cooperation and stewardship; survive or fail according to the rules; and carry character knowledge, relationships, injuries and discoveries through a consistent saved story. This is a destination, not a claim of current feature completeness.

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

**Development snapshot at this roadmap edit:** Checkpoint **007-L2a**, app version **0.7.12**, **324 tests (307 retained and 17 new)** in the active validation/release process. The last recovered fully accepted base was 007-L1, commit `f12693c3ac15f830aff1127a0b622c6ae7d8bc3a`, with successful Actions and Pages. Only treat 007-L2a as accepted **after final main-branch CI and Pages verification**. **Interactive desktop/mobile graphical gameplay smoke remains unperformed**. Always consult [../project-state.json](../project-state.json), newest [../audit.md](../audit.md) and GitHub main for the latest actual release.

| Domain | Accepted playable subset | Open work / honest limits |
| --- | --- | --- |
| Character Lab and roster | Nine Jurassic career mappings; 12 skills; Evolved-inspired seeded individual d6/stress checks; manual/auto/hybrid 1–8 character setup and launch | Several of 27 talent hooks have no world effects; source-complete advancement, panic and specialist capabilities remain partial |
| Party/Character/Spectator | Independent 007-series party incident, shared persistent world, knowledge-bounded offline director, atomic mode/camera switches, spectator controls | Generative companion conversation, richer agendas/relationships, complete NPC simulation and full free-form actions not yet live |
| Combat and injuries | Seeded initiative, quick/full budgets, raptor slots, defense choice, surprise/ambush, wounds and medical clocks in growing Evolved-inspired subset | Species-specific attacks, complete equipment/armor/ammunition, environmental complications and complete edition parity remain |
| Pursuit, stealth and vision | Zone-bound routes/sound, finite individual lamps, timed searches, individual/group movement, directional short-range sightlines, named physical cover, and **007-L2a route-constrained slow stalking plus creature-facing light perception** | Dynamic physical occluders, changeable weather, distinctive raptor attack/pursuit tactics, scent/wind, additional simulated species and finer geometry remain |
| Wonder and discovery | Four optional world-anchored scenes, each saved to one survivor's private journal without time/dice cost | Herbivores are ambient-only; no durable peaceful population, herds, animal social behavior, field-guide progression or wonder-aware autonomous AI yet |
| AI Game Master | Separate legacy 006.2 browser/Cloudflare Worker v006 supports bounded parsing, narration and four typed improvised actions | New party incident is primarily offline/deterministic; fully conversational multi-actor GM, compound actions, persistent dialogue and Worker integration are pending |
| Scenarios and presentation | Playable seven-zone island incident; park systems and survivor objectives; browser UI and export/replay | Rich island geography, vehicles, alternate incidents, sustained campaign-scale narrative and hands-on graphical QA still pending |

**Technical nuance:** The legacy 006.2 solo game and manually deployed Worker v006 are *separate from* the newer 007 party game; neither inherits new 007 mechanics automatically. Party save kind `dinosaur-party-incident` remains schema **v3** with v2→v3 migration and optional later fields. Old solo saves remain isolated. The private Evolved PDF is never committed to GitHub. Source parity is incremental, not complete.

Detailed feature truth lives in the latest accepted audit and implementation reports—not in older individual checkpoint summaries, which are historical records. An older paragraph using "planned" does not overturn a newer validated checkpoint.

## 5. Near-term milestone roadmap and dependency gates

Milestone labels below express the current accepted order, **not immutable dates**. Before work, inspect newer `main` and adjust if later validated work has already advanced the plan. Never replay completed milestones.

### 007-L — Spatial and species-grounded survival (IN PROGRESS)

- **007-L1 complete in automated acceptance:** Authored directional one-exit sightlines separate from travel/hearing; solid foliage/door occlusion; local named cover checked with seeded Mobility; actor-only glimpses; one Velociraptor sensory profile with saved `patrol / investigate / stalk / search / engage` stages. Wonder and Dread personal discoveries preserved. **307/307** tests and CI/Pages passed; manual browser verification remains outstanding.
- **007-L2a completed in code (final release gates apply):** Velociraptor low-alert stalking now differs from high-alert investigation by physical movement cadence (one legal zone per four vs two exploration actions); actual creature-facing constraints and sound-guided turning, finite clue decay and validated, persistent hunt records are implemented without changing attack tables. **324** deterministic tests cover the retained mechanics and new cases; final main CI/Pages and manual graphical QA are separate.
- **007-L2b next:** Complete environmental perception with relevant changing obstructions/weather; implement grounded and tested approach-versus-attack choices, original Velociraptor encounter tactics and consequences without cheating Evolved combat/defense or target knowledge. Do not call the whole 007-L milestone complete until this follow-up is accepted.
- **Gate:** Successful legal/blocked passage and line-of-sight tests, seeded search/pursuit/cover/attack replay, no leaked hidden animal information, compatibility across all three modes, saves and previous tests. Test quiet/violent and nonviolent animal behavior where actually implemented. Report manual graphical testing honestly, separately from CI.

Reference: [Stalking and Facing 007-L2a](DINOSAUR-STALKING-007L2A.md), [Spatial / Velociraptor 007-L1](DINOSAUR-SPATIAL-007L1.md), [Lighting and Timed Search 007-K](DINOSAUR-LIGHT-STEALTH-007K.md), [Pursuit 007-J](DINOSAUR-PURSUIT-007J.md).

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

**Sequencing policy:** Do not rush into general generative adjudication before its physical/environmental effects have deterministic definitions. Nonetheless, retain full conversational GM as an essential destination, not an optional cosmetic layer.

## 6. Longer-term parallel product tracks (scope, not yet numbered checkpoints)

These streams extend the original A–E phases and may be scheduled into future milestones once their prerequisites exist:

### Living dinosaur ecology and nonviolent encounters

- Add durable position-bearing herbivores and eventually additional carnivores with species-specific senses, needs, feeding, nesting, territoriality, social groups, rest, migration, weather response and habitat constraints. Animal behavior should be coherent and repeatable, not simplistic guaranteed attacks.
- Allow peaceful encounters, observation, respectful distance, environmental protection, photography/sketches/field notes, caring for wildlife and plausible responses to human actions. Characters may recognize species, signs and individual behavior without omniscient knowledge.
- Make the personal field journal and eventually appropriately communicated shared knowledge meaningful without mandatory XP, stress-recovery or combat bonuses; peaceful encounters may stay peaceful over extended play.
- Test non-hostile sessions, herd persistence, per-character knowledge, ecological consequences, and AI-companion curiosity. This **must not be postponed indefinitely** just because predator/combat plumbing is easier to test.

### Human NPCs and persistent interpersonal stories

- Create grounded park staff, visitors, researchers and antagonists with location, resources, agendas, relationships, memories, fears and limited observations. Their decisions and conversations can cause real events only through validated engine effects.
- Support cooperation, disagreement, command limitations, trust, rescuing others, ethical conflict and consequences for human choices in Party, Character and Spectator.
- Provide credible quiet narrative beats and social scenes between crises.

### Richer park, incidents and campaign continuity

- Expand beyond the starter seven-zone map into park geography with accurate routes, visibility, habitats, facilities, fences, weather, power networks, vehicles, communications, evacuation and multiple scenario objectives.
- Make island exploration/scenic diversity, rescue/escape, scientific investigation, conservation and human responsibility important alongside survival.
- Support authored or generated incidents through reusable content schemas, clear advancement/save migration, persistent history and replayable consequences. Keep initial Jurassic Park-inspired data separable from a later original setting.

### Evolved parity and advanced survival

- Complete priority gaps in stress/panic and action interruption, context-valid talents, armor/gear/ammunition, specific critical/infection consequences, healing and long-term injury, vehicle actions, complex cooperative/opposed checks, source-compatible progression and difficult combat cases.
- Record each deliberate Jurassic deviation with numerical/procedural differences and test fixtures. Do not claim whole-book fidelity merely because the core dice engine works.

### UI, safety and practical release quality

- Make manual party creation, mode switching, scene perception, equipment and natural-language interaction intuitive on desktop/mobile. Preserve accessible status/logs and opt-in developer dice visibility.
- Provide robust save/export/import, recovery, reproducible debug, safety around API credentials/costs, client↔Worker version reporting and graceful fallbacks if the model is unavailable.
- Verify real interactive browser flows; syntax checks and unit tests are necessary but not substitutes for graphical play.

## 7. Original A–E implementation phases — revised status

Keep the original phase structure as a long-range *work breakdown*, not a claim that each phase must be completed serially or that early accepted features need rebuilding.

| Phase | Original objective | Status at 007-L2a | Remaining exit work |
| --- | --- | --- | --- |
| **A — Rules inventory and source mapping** | Source-to-engine matrix of Evolved timing, dice, skills, stress, injuries, equipment, combat and deviations | **Partially established** through rules authority and feature-specific parity reports | Consolidate/audit uncovered and intentionally adapted cases; fixtures for each accepted rule |
| **B — Characters and core engine** | Careers, 12 skills, manual/auto/hybrid party creator, actor IDs, seeded rolls, stable saves, control ownership | **Substantially playable alpha** in Character Lab and 007 party incident | Complete world-dependent talent hooks, progression, panic effects, stronger shared simulation contract |
| **C — Combat, stealth and survival** | Full action economy, predator perception, injuries, supplies and park-specific constraints | **Active** through 007-L2a; initiative, wounds, lighting, cover, slow actual stalking and facing-aware perception implemented as bounded subsets | 007-L2b attack/occlusion behavior; 007-M resources/hazards; advanced Evolved parity and ecology |
| **D — Natural-language GM and autonomous actors** | Multi-actor conversation, validated typed effects, NPC dialogue, actor-limited narration and decisions | **Partially playable:** three modes and offline companion policy; separate legacy 006 Worker only | 007-N integration, compound decisions, genuinely conversational GM, persistent social NPCs |
| **E — Cinematic living incident and transition** | Original park missions, scenes, NPCs, story continuity, alternate setting and reliable deployment | **Early alpha:** starter island incident and personal wonder discoveries | Larger living ecosystem, social/narrative arcs, scenario variety, field journal, QA and final-release gates |

**Original Phase A coverage checklist:** character creation and Health/Resolve; skill rank/attribute pairing; base/stress dice and pushes; Resolve/panic/stunts; active/passive/opposed checks; exploration/combat clock and actions; stealth/detection; armor/injury/death/healing; gear/supplies/vehicles; creatures/NPCs. Each entry should eventually specify: private source page, rule, inputs/outputs, timing, exception, adaptation decision, implementation file, tests and status. This is not permission to publish source text.

## 8. Release-quality definition of done

A finished milestone is not "green" merely because an agent says it implemented something. Require:
- Code and data changes supported by testable source/house-rule decisions, with positive, negative, RNG-seeded/replay and invalid-input cases.
- Physically grounded simulation: durable objects and animals, consistent movement/time, deterministic dice, no free actions, no invisible resource creation and no unearned omniscience.
- Save/restore and migration tests for earlier valid party states (party schema v3 and v2→v3), continued isolation of legacy 006.2 solo saves, and integrity under mode/camera switches.
- Separate reporting of local/CI automation, GitHub Pages deployment, Cloudflare Worker deployment where applicable, and **actual desktop/mobile interactive graphical smoke**. Do not mark the last category passed without doing it.
- Updated feature-fidelity/house-rule report, `project-state.json`, newest `audit.md` entry and `README.md` as needed. Include exact accepted commit SHA and outstanding limitations.

**Target-game acceptance (future, not current):** A user can generate/customize a party, explore a beautiful living island, meet peaceful and dangerous simulated dinosaurs, converse with NPCs, describe novel compound actions without engine verbs, experience real source-grounded risks, injuries and character motives, switch among Party/Character/Spectator in mid-story, and resume or replay the same causal world. A full playthrough must permit wonder to stay wonder; drama and danger must emerge from the simulation, not a forced scare cadence. Test prolonged noncombat sessions as well as survival/escape and catastrophic failure.

## 9. Continuity and change management

**Read order before any new work:** current GitHub `main` and recent commits → `project-state.json` → newest/topmost accepted `audit.md` → this living roadmap → relevant domain contracts/reports and current tests. Do not confuse older checkpoint reports with current implementation status. If `main` has advanced, preserve the newer accepted work and reconcile rather than rollback.

- The roadmap describes **where we're heading**, not the currently deployed version; `project-state.json` records current machine-readable status, and `audit.md` preserves accepted historical evidence.
- New approved design directions (mechanics, Wonder and Dread, scope, agency, narrative doctrine) must be reflected here in the appropriate *permanent* section, with links to detailed contracts. Do not just append them to a transient checkpoint.
- Newly completed features update the dated status snapshot or its references and the affected A–E row. Avoid duplicate, stale "not implemented" claims after acceptance; distinguish accepted in tests vs manual QA.
- A deviation from Evolved requires: **source behavior → Jurassic revision → rationale → exact mechanical/numeric changes → regression tests → approval status**. Unless explicitly approved, keep Evolved default.
- Never erase source rationale or validated historical audit entries, change old saves silently, invent future milestone acceptance or publish the private rulebooks.
- If dependencies or milestone numbers change, revise this plan transparently, preserve accepted checkpoints and write an audit entry identifying the decision and why.

**Scope boundaries:** No claim of complete Evolved RAW, continuous free-roaming 3D park, simulated herbivore population or fully integrated OpenAI GM until individually implemented and verified. No mandatory multiplayer or server-backed saves is assumed for this personal-use single-player project. New capabilities can be proposed and approved without treating this document as unchangeable law.
