# Dinosaur Horror RPG — Isla Nublar Prototype

A personal-use, browser-based dinosaur survival-horror RPG prototype using *Alien RPG Evolved Edition*-inspired mechanics. **Scenario separation is the approved architecture but is not yet complete**: the current *After the Storm* test adventure still has hardcoded dependencies in the shared party engine. The architecture refactor is now prioritized before expanding scenario-specific gameplay. The final engine must be reusable for independently authored and AI-generated adventures.

**Architecture priority:** [Adventure packages separate from the game engine](docs/ADVENTURE-ENGINE-SEPARATION.md). *After the Storm* is a sample/test adventure, never the hardcoded template for every session. Future scenarios will be created/generated as independently validated packages; the engine alone enforces Evolved actions, physics, saves and consequences. **This is an approved goal, not a completed refactor.**

**Replayability and content goal:** Ship several authored adventures, **each with materially different seeded playthroughs**, alongside an open-ended generator of original Cinematic adventures and continuing Campaigns. The player should not know the true cause, NPC agendas, animal presence, danger or resolution from having played a scenario before; variations must be causally coherent and allow quiet/wondrous outcomes too. The Game Mother may create/choose validated adventure content but cannot silently rewrite established facts. [Procedural Adventures and Replayability contract](docs/PROCEDURAL-ADVENTURES-REPLAYABILITY.md). **Fully procedural adventures and structurally varied replayable stories are not implemented yet.** Checkpoint 009-B2b2a adds the first smaller, seed-specific, mechanically meaningful research complications and herbivore responses; it is not a complete structural story generator.

**Shared living roadmap:** [Dinosaur Horror RPG — Game Vision and Evolved Implementation Roadmap](docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md). This is the long-term design and development reference for future GitHub sessions, including Wonder and Dread, Evolved rules fidelity, multi-character agency, the AI Game Master, Alien-style cinematic/campaign scenes and dinosaur encounter behavior, current and future milestones, and release gates. Before developing, consult the latest `project-state.json` and newest `audit.md` record for the actual accepted checkpoint; older sections below are historical feature reports.


**Status:** Checkpoint **009-B2b2c2a — Seeded Persistent Predators (accepted)**, gameplay version **0.7.28**, **560/560 tests passing**. Source main Actions and Pages successful; real desktop/mobile graphical testing and full predator combat still outstanding. Accepted source main Actions and Pages successful; manual graphical QA outstanding. GitHub Actions and Pages succeeded on merged main; manual desktop/mobile graphical gameplay QA remains outstanding. Accepted-main GitHub Actions and Pages successful; actual desktop/mobile graphical QA remains outstanding. The complete adventure-independent Cinematic/predator engine remains unfinished. GitHub Actions and Pages successful on merged main; physical desktop/mobile QA remains outstanding. Full feature-parity engine separation is NOT yet complete. Main-branch Actions and Pages succeeded; manual desktop/mobile QA remains outstanding. Merged-main Actions and Pages both passed; hands-on graphical QA remains outstanding. This is an incremental extraction, **not** full 009-B. Hands-on browser QA remains outstanding. Bound 007-L mechanics have been implemented; interactive browser/manual QA still outstanding. Launch 1–8 manually or automatically generated survivors into the same saved island incident; freely change who controls future actions, take over any survivor, watch AI companions decide their turns, or pause/step/resume fully computer-directed play. The three modes share the same grounded world and seeded hidden Evolved-style dice. **AI companions currently use a bounded deterministic offline policy**, not full generative roleplaying. The legacy 006.2 solo game and its saves remain separate. Checkpoint 006 — bounded AI GM adjudication for improvised investigations, distractions, cover and barricades. The new Cloudflare Worker source must be pasted/deployed manually for live Sol adjudication. This is a Year Zero-inspired proof of concept, not complete Alien RPG RAW.

## 009-B2b2c2a — A predator may actually inhabit the expedition (accepted)

*The Long Count* revision 5 introduces **seed-gated physical predator presence**: some playthroughs are quiet, while others begin with an actual Velociraptor in the forest blind. The predator walks its validated adjacent forest-blind/river-crossing patrol on a deterministic actor-round cadence; there is no director-made sudden spawn, free injury roll or invented geography. A character sees the raptor only in the same location; nearby teammates can choose a connected retreat. Its movement and existence persist in saved adventure state. Other scenarios and older rev1–4 *Long Count* saves retain their exact previously compiled wildlife circumstances.

This is a **predator presence and patrol milestone**, not full creature combat. The current research predator does not attack, use Evolved initiative/defense, stalk via sensory checks or force a showdown. Those source-bound systems, plus clinical injury time and genuine human NPC behaviors, are the next extraction milestone. The classic Nublar raptor/combat behavior remains separate and intact.

## 009-B2b2c1 — Opt-in physical peril and companion recovery (accepted)

*The Long Count* revision 4 adds a **seeded optional defensive-herd peril**, available only when a wary Parasaurolophus is physically at the ridge with the acting survivor. A voluntary close passage calls the existing Evolved Mobility, animal attack and critical-injury rules; dodging can succeed, the animal can miss, and characters can suffer actual health consequences rather than an invented scripted scare. The player can instead watch safely or leave. Source Evolved first aid and Command rally now work on physically colocated injured research teammates. Risk is one-time per character and costs real time. The generic peril resolver is adventure-independent, but full autonomous combat and companion NPCs are not.

**Historical saves remain safe:** original *Long Count* revisions 1, 2 and 3 remain immutable and do not acquire new wildlife harm or events. Only newly started revision 4 encounters offer this optional risky action. The Nublar rescue and previous game controls remain on their accepted paths.

## 009-B2b2b — Reusable optional three-act Cinematic director (accepted)

A compiled adventure may now declare validated **Setup / Tilt / Showdown** acts and entirely optional scene opportunities: real physical room, matching currently achieved objective act, optional creature presence, second capable colocated character, and seeded hidden fact. The generic scene service handles visibility, once-only actor-owned logging, and rejected illegitimate/future scene commits. Voluntarily experiencing an available scene does not change Evolved RNG, stress, time, inventory, objectives, or wildlife placement. Acts progress only when real scenario goals are completed, not because a scare is due. *The Long Count* revision 3 adds six optional Wonder, Dread, Discovery and human-interaction scenes. Existing revision 1 and 2 saves retain identical older scenario rules through immutable authored definitions. Full dangerous creature and autonomous NPC parity in the second adventure remains future work; no generated Campaign system is present.

## 009-B2b2a — Causal seeded suspense (accepted)

The *Long Count* revision 2 now compiles its original adventure seed into stable, local physical complications rather than keeping them as invisible flavor text. A flooded ford calls for a real Evolved Mobility check (and can block actual movement); equipment or disordered observations modify the correct Comtech or Observation pool; clues appear only in the survivor's current room. A physically present Parasaurolophus stays peaceful when watched; if its local authored disposition is wary, a failed close Survival approach can cause it to retreat along an adjacent route. Different seeds can therefore affect risk, path and wildlife consequences, not just prose. These effects are shared through a reusable typed scenario-situation service; the Nublar rescue scenario remains on its accepted path.

**Saved game continuity:** original revision 1 *Long Count* Party saves are still validated against their original immutable definition and retain their earlier gameplay; new starts are bound to revision 2. Neither path migrates an ongoing save by silently rewriting its hidden circumstances.

**Not yet available:** truly free-form generated scenarios, structurally divergent entire adventures, full active predator AI, medical/combat and creature-director parity in the second adventure, or the complete three-act Cinematic director. Desktop/mobile hands-on smoke remains outstanding.

## Foundational creative pillar — Wonder and Dread

**The three Alien RPG themes translate directly into Dinosaur Horror, Sci-Fi Action and Sense of Wonder.** Jurassic Park combines extraordinary animals, human stories and credible danger without requiring an always-running ecosystem simulation. A Brachiosaurus sighting can be a beautiful unthreatening moment; a Triceratops encounter can stay peaceful or become dangerous if spooked. The Evolved Game Mother/encounter rules and playable scenes—not animal feeding schedules or island-wide populations—provide adventure pacing.

**First authored gameplay slice (007-K Wonder Pass):** the party can voluntarily **Take in the view** at four existing locations, remembering the rainforest horizon, enormous natural history, forest ecology, or a distant herbivore valley scene. The observation is personal, persistent, quiet, and does not consume dice, RNG, game time, resources or stress. The distant herbivores are presently *ambient scenery only*, not simulated position-bearing creatures; physical herbivore encounters are future scenario content; simulated whole-island herds are not a development prerequisite. Existing party saves without a discovery journal continue to work. No Cloudflare Worker redeployment is required.

This tonal requirement applies to **Party, Character and Spectator** and allows quiet scenes, dangerous herbivores, predator avoidance and meaningful conversations. Future events must respect actual player choices and Evolved mechanics. See [Wonder and Dread](docs/WONDER-AND-DREAD-DESIGN.md) and the [scene-oriented Cinematic/Campaign contract](docs/CINEMATIC-SCENE-CONTRACT.md).

## Velociraptor encounters — Checkpoint 007-L2b1

The active Velociraptor now has a distinct **approach pounce**: one original Jurassic +1 attack die on its first strike in combat round one **only if** it physically entered the survivor's zone through a legal previous stalk/investigation move. Its regular close bite still uses 6 attack dice and 2 base damage; a pounce uses 7 and the **same** damage, with a separate already-approved surprise modifier where applicable. No extra attack, guaranteed hit, sudden teleport or universal monster escalation. A survivor cannot claim to remain concealed beside the animal while carrying an illuminated flashlight, but extinguished light and genuine cover continue to matter. Evolved initiative, player-declared defense, injuries, and saves remain unchanged.

007-L2b1 was followed by accepted 007-L2b2, which added authored environmental visibility and a physical storm shutter. See the [original Jurassic encounter report](docs/DINOSAUR-ENCOUNTER-007L2B1.md). Cinematic/Campaign story structure remains our development goal; **no persistent population simulator is required**.

## Physical encounter conditions — Checkpoint 007-L2b2

The **Maintenance Shed** and **Jungle Service Path** now share a manually operated storm shutter that can be opened or closed from either side using the existing `use` action. A closed shutter actually prevents the party or Velociraptor crossing the doorway; it blocks sight, attenuates sound, and prevents attack-opening bonuses through a shuttered route. Attempts to traverse a closed shutter are rejected before time or dice are spent; the UI displays the barrier. A finite **heavy rain squall** during exploration stretches 2–3 obscures specific outdoor one-zone sightlines, but leaves regular movement, sound, same-room visibility, initiative, injury and Evolved dice intact. Both rules are original authored Jurassic scenario conditions—not an island weather simulator. See [the 007-L2b2 source-fidelity report](docs/DINOSAUR-ENVIRONMENT-007L2B2.md). Graphical hands-on QA is not yet complete.

## 009-B2b1 — Playable second research/exploration scenario (accepted)

The browser Party game now selects between *After the Storm* and *The Long Count*. A research team can actually navigate the five-room survey map, carry and pass physical items, meet a calm Parasaurolophus, use Evolved Observation and Comtech checks for research, and return to camp for a non-helicopter ending after completing real prerequisites. Companion AI and the two other control modes follow the selected research map and objective, not the Nublar mission. Survey saves bind their own versioned manifest and reject foreign or forged states. **Scope remains bounded:** no active research-scenario dinosaur attack AI, complete Evolved survival injury pipeline, materialized seeded variability or procedural Campaign generator; 009-B full engine separation remains future work. The full prior rescue game is retained separately; manual desktop/mobile QA remains outstanding.

## 009-B2a — Objective and ending extraction (accepted)

The first reusable objective runtime now accepts only deterministic, Evolved-authorized successful actions, checks the acting survivor is physically at the objective, validates prerequisites against the compiled adventure, and applies only authored typed flags/endings. The Nublar generator → radio → beacon victory is routed through this service without changing its source dice or action costs. New saves track objective completion, older saves remain compatible, and forged objective histories are rejected. Both *After the Storm* and *The Long Count* have objective-runtime tests, but only *After the Storm* is playable in Party mode. **009-B is not yet complete.** 494 deterministic tests passed on accepted main; full interactive desktop/mobile QA remains outstanding.

## Incremental engine separation — Checkpoint 009-B1

The shared `src/adventure-world.mjs` now reads validated adventure instances to provide the physical room graph, room inventory, names, item labels and pathfinding without referencing any Nublar-specific plot. The current Party runtime uses that common interface for its initial room/items and physical movement/display; its rescued-scientist objectives and dinosaur/scene handlers are still scenario-specific. A different research-survey map has adapter-level tests but **is not playable through the Party engine yet**. The next 009-B slice must extract the objective/action/ending runtime and eventually permit two fully different playable stories through the same core. Real graphical browser QA remains outstanding.

## The first executable adventure-package boundary — Checkpoint 009-A

The repository now contains a **data-only adventure schema and seeded compiler**, not merely a roadmap for one. The compiler validates maps, legal routes, physical items, objectives, allowed effects, creature positions and authored hidden variations before producing a versioned manifest and a reproducible content fingerprint. A catalog supplies two different definitions: existing **After the Storm**, plus **The Long Count**, a research-survey mission with a different map, wildlife situation, non-helicopter objectives and multiple seeded research obstacles.

**Scope distinction:** The Long Count is a validated, seeded *data fixture*, **not yet a playable second adventure**. The shared Party engine still assumes After the Storm in important rules; migrating those assumptions to an actual selected AdventureInstance is **009-B**, the next engineering priority. New Party saves now record the accepted current adventure ID/revision/fingerprint, while older accepted saves remain legal. We have **not** implemented full randomized gameplay, a procedure that rewrites the current scenario, generated Campaigns or an AI Game Mother. See [009-A implementation report](docs/ADVENTURE-MANIFEST-009A.md) and [engine-separation contract](docs/ADVENTURE-ENGINE-SEPARATION.md).

## Finite lamp replacement cells — Checkpoint 007-M1

Two **actual sealed replacement cells** are now available within the existing island rescue story: **one in the Maintenance Shed and one at the Emergency Helipad**. Survivors must physically pick them up, may hand them to a colocated teammate, and can spend one carried cell with **Replace lamp battery** (or `battery replace`) when their existing flashlight/headlamp is not fully charged. The replacement costs a normal exploration action and restores the accepted lamp charge maximum, but leaves the lamp **OFF** until deliberately switched on, preserving real darkness and Velociraptor visibility risks.

There is **no free recharging or battery generator**. Item accounting bounds authored on-floor stock, carried cells and consumed cells to **two**. Party saves remain v3-compatible, including valid older saves without replacement cells or a spent counter. The browser shows only the viewed character's carried reserves; it does not disclose other rooms' resources. This is a bounded equipment milestone, **not** an invented energy-management or ecological simulator. See the [007-M1 finite equipment report](docs/FINITE-EQUIPMENT-007M1.md).

Remaining work includes finite 007-M2 park tools/repair materials, the typed 007-N Game Mother, complete Evolved source procedure validation and real desktop/mobile interactive graphical QA.

## Park guide escort and meaningful rescue choices — Checkpoint 008-C1

At the Visitor Center Lobby, one original stranded park employee, **Mara Velez**, offers a real optional rescue thread. Survivors can speak with her about the actual radio/power situation or attempt a genuine **Evolved Manipulation** check to persuade her to leave. She may refuse; a different survivor can try later. If she agrees, she follows **only her named escort** along real adjacent, permitted routes, including staff-card doors and the existing storm shutter. She can be handed to another escort, sheltered at the control room, invited to resume travel or accounted for at the emergency helipad.

Successful beacon activation preserves the existing Evolved Comtech rescue resolution, but records whether Mara **arrived and was mustered**, reached the pad but was not accounted for, remained sheltered, or was left elsewhere. The narration does not invent a subsequent rescue of someone still at the Visitor Center. Mara is a **noncombat authored NPC**, not a full AI agent or an extra unit in the initiative system; her independent injuries and combat behavior are not implemented yet. The new optional Party save state is v3-compatible, and off-site cameras do not show her location. No Zoo Tycoon wildlife management is required.

See the [008-C1 technical report](docs/CINEMATIC-ESCORT-008C1.md). Desktop/mobile hands-on gameplay testing, richer NPC social conflicts and the full Game Mother remain outstanding.

## Playable Parasaurolophus and character dialogue — Checkpoint 008-B3

The existing Jungle Service Path now has one **physically situated, peaceful Parasaurolophus at a drainage stream across a steep bank**. Survivors may voluntarily **observe from the path** (normal exploration time, no skill roll) or **approach carefully** (a real Evolved **Mobility** check, including stress and push effects). A successful approach remains calm; a failure startles the animal into a persistent retreat, creating **noise 2** for the existing raptor-hearing logic, not a compulsory attack. The authored squall blocks visibility, and the animal withdraws if the actual Velociraptor reaches its stream. The animal is **not** part of a simulated island population or an added combat monster.

Survivors can also **talk with actual living teammates** in their current room, choosing a check-in or rescue planning conversation based on real health, stress and objectives. These optional scenes are remembered per speaker/recipient/topic and can be skipped; they do not heal Stress or wounds, consume dice, invent NPCs, or imply an autonomous dialogue model. New optional save records preserve existing party-v3 compatibility and perspective privacy. See [008-B3 rule boundary and acceptance report](docs/CINEMATIC-ENCOUNTERS-008B3.md).

A complete multi-episode Campaign/Cinematic system, richer original human NPC dialogue, further finite 007-M park tools and the natural-language Game Mother are future work. Real desktop/mobile graphical gameplay QA remains outstanding.

## Cross-scene discoveries and meaningful continuity — Checkpoint 008-B2

A **successful Observation investigation** of the control-room consoles now uncovers an auxiliary-generator startup procedure. That **particular survivor** can use the learned sequence when later attempting to start the generator in the maintenance shed, earning **exactly +1 situational Evolved Heavy Machinery die**. The original check can still fail; Evolved stress/push/injury rules, turn costs, and the existing generator's noise are unchanged. The discovery is optional, and another character who hasn't investigated does **not** automatically receive it.

Four additional gated narrative scenes link personally studied tracks, learned startup methods, a genuinely braced paddock gate, and a transmitted distress call to later local opportunities for suspense or reflection. The current scene remembers successful physical repair and a survivor's own failed repair without leaking other characters' hidden experiences. These are *situations with choices*, not mandatory scares, new dinosaurs or scripted film outcomes. Personal Wonder scenes, party saves, three control modes and the 007 solo/Worker isolation remain.

This is **bounded 008-B2**, not yet a full autonomous, branching Campaign/Cinematic system, implemented human NPC conversations, complete published Evolved encounter timers or a fully persistent herbivore population model. Manual interactive desktop/mobile QA remains outstanding. See [008-B2 technical contract](docs/CINEMATIC-CONTINUITY-008B2.md).

## Cinematic acts and physically grounded danger — Checkpoint 008-B1

The playable *After the Storm* scenario now presents three **mission-derived Cinematic acts** as actual power, distress call and helipad beacon objectives progress. These are open stages of one continuing rescue story, not mandatory scripted movie scenes.

A survivor who physically reaches the damaged **Raptor Paddock Gate** can optionally attempt **Secure the damaged paddock gate**. The real action uses the existing Evolved **Heavy Machinery** seeded base/stress dice, wound modifiers and push procedures. Success braces the gate; failure makes a loud clang that enters the existing Velociraptor hearing/pursuit simulation. This is neither a guaranteed attack nor an unavoidable encounter. Any unattempted challenge can be skipped entirely; another present survivor can try after an individual failure. The gate's status is revealed locally, not through distant shared mission flags.

The optional event history and repair status are compatible with older party v3 saves. This is a bounded **008-B1** slice, not a complete connected multi-scene campaign, a wildlife simulation or full *Evolved* danger-event rules transcription. See [008-B1 technical report](docs/CINEMATIC-DANGER-008B1.md). Real desktop/mobile manual gameplay testing remains outstanding.

## Conditional Cinematic events and encounter pressure — Checkpoint 008-A

The Party game now offers **optional, typed scene events**, distinct from the original per-character Wonder discoveries. Seven authored situations become playable only when the viewed character is at the correct location and committed mission/weather prerequisites hold. Distant valley wildlife remains hidden during the sight-obscuring squall. A character can choose **Experience scene**, or type `scene <event-id>`, to remember the moment without forced combat, resource changes or arbitrary GM invention. Each scene is available once per character and is saved in a validated actor-specific log.

Original, bounded **encounter pressure** now accompanies accepted outdoor exploration. d6 results can increase the acting character's pressure; sneaking reduces the pressure check and rushing increases it. Pressure **never creates, teleports or automatically attacks with a dinosaur**. A local sound cue is possible only when the actual Velociraptor is audibly nearby through a legal route. This is an original first pressure adaptation inspired by Alien Evolved Solo, **not yet a complete Last Survivor timer**. No island ecology simulator or always-on dinosaur population is involved.

See [008-A scene/event and pressure details](docs/CINEMATIC-EVENT-DIRECTOR-008A.md). Full authored multi-scene campaign transitions, mechanical danger events, verified complete Evolved timer parity, multi-character conversational AI GM and hands-on desktop/mobile browser QA remain future work.

## First cinematic scene framing — same game, different dramatic beats

The existing seven-zone **After the Storm** incident now presents location-specific, actor-local **scene framing** (investigation, wonder, problem-solving, suspense and evacuation) that changes with committed mission progress. This is a *read-only scene presentation* and does not summon creatures, consume dice/time, dictate outcomes, add new rules or require a global wildlife simulation. The underlying Party/Focus/Spectator gameplay and v3 save schema remain identical. See [Cinematic and Campaign Scenes](docs/CINEMATIC-SCENE-CONTRACT.md). A fully automated scene/event Game Mother and a full multi-scene campaign remain future work.

## Rules authority and free-form roleplaying (accepted October 22, 2026)

**Primary rules reference from now on: the user's privately supplied *Alien RPG — Evolved Edition* (Free League).** Previous 2019 Alien RPG core and *Year Zero Mini* are comparison and supplemental references only. The game's existing checkpoint 006.2 dice/stress implementation is a *legacy prototype*, not Evolved RAW; authority adoption **does not yet change running mechanics**. Follow [the accepted Evolved edition / natural-language doctrine](docs/EVOLVED-RULES-AUTHORITY.md), alongside the [accurate legacy implementation baseline](docs/RULES-BASELINE.md).

**Updated accepted direction:** Faithfully implement Evolved Edition's **actual seeded d6 pools**, distinct base/stress dice, careers, twelve broadly available skills, career-linked talents, pushes, Resolve, stress/panic, stunts, action economy, combat, stealth, injuries and equipment; create original **Jurassic Park** themed careers, equipment, animals and stories. Keep all dice rolls and mechanical checks *behind the screen*. Players describe their methods in plain language; AI proposes the underlying skill/attribute/talent requests, and deterministic code validates and resolves them. **The custom percentage-only probability engine proposal is superseded.** Careers determine initial skill emphasis/talent choices rather than preventing other skill attempts. See the [faithful Evolved adaptation implementation plan](docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md). Current limited verbs/referee kinds are temporary prototype restrictions, not the intended gameplay.

**Deployment:** This authority change is documentation-only. No Cloudflare Worker repaste or browser refresh is required for the decision itself. The existing game does not yet implement generalized free-form adjudication.

## Playable-party control modes (new design requirement)

The future Dinosaur Horror RPG supports switching among **PARTY** (player controls every playable character), **FOCUS** (player controls exactly one selectable character and AI controls the other playable characters) and **SPECTATOR** (AI autonomously controls all playable characters). Switch control dynamically at safe action boundaries without resetting the story, characters, injuries, supplies, stress, dinosaurs or dice. **Camera/viewpoint is independent** of who controls decisions; the normal camera respects individual character knowledge to preserve horror.

The same Evolved-inspired **character sheets, hidden seeded rolls, action economy, combat, injuries and deterministic world state** govern all three modes. Computer companions have independent objectives, personalities, memories and knowledge limitations; accepted decisions are recorded so actions can be replayed. Spectator includes Pause/Step/Resume and can return control to the human at any time.

See the [complete multi-character control-mode contract](docs/MULTI-CHARACTER-CONTROL-MODES.md) and [updated mechanical development plan](docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md). **All three controls are available in the Party Incident 007-K alpha**. Camera selection, safe takeover and pause/step/resume are working. Drawn initiative, two raptor turns per round and full/quick action budgets now run in the same persistent world; source-complete injury recovery, surprise/ambush and conversational AI remain incomplete. The separate solo 006.2 build still models one playable character. No Cloudflare redeployment is required for the offline party modes.

## Character creation: manual, automatic or hybrid (working Personnel Registry)

Create **any or all playable survivors** manually, automatically, or with a mixed/hybrid approach. Each party member can use a different method. Choose a career, lock chosen skills/attributes/talent/background fields, generate the remaining details, preview the Evolved-valid character sheet, and selectively reroll individual members or the entire unlocked party. A separate character creation seed preserves reproducibility without consuming the live game's random stream.

Profession, 12-skill training, talents, gear, stress/Resolve and derived attributes use a common Evolved-compatible rule validator. Generate original Jurassic Park backgrounds and motivations without adding unauthorized mechanical advantages. Character creation is separate from Party/Focus/Spectator control modes: any character may be manually or AI controlled later. Once play starts, advancement and equipment changes follow the game rules rather than retconning the character.

See [complete character generation requirements](docs/CHARACTER-GENERATION-MODES.md). **Creation works in the separate Personnel Registry and launches Party Incident 007-F**; the original 006.2 solo page intentionally retains its old fixed character.

**[Open the working Personnel Registry](characters.html)** to create parties of 1–8 survivors, lock details, edit careers/skills, reroll and export validated drafts. Generated parties can now be played in the separate 007-K party incident, using supported Evolved-style skill/talent mechanics; several world-dependent talent effects are still pending. [Rules fidelity and gaps](docs/EVOLVED-CHARACTER-MATRIX.md).

## Checkpoint 007-B — mechanical Field Assessment

The [Personnel Registry](characters.html) now provides a **FIELD ASSESSMENT / HIDDEN DICE** panel. Select a survivor and scenario context, choose a skill, stress, modifiers, requested pushes and seed, then run a real individual-d6 check in the isolated Evolved resolution module. Initial dice remain hidden by default, with an opt-in **Reveal individual dice (debug)** control. Repeat the same seed to replay the check. Running the laboratory does **not** change the saved incident or permanently modify a character sheet.

The new [Evolved checks module](src/evolved-checks.mjs) implements actor-based base/stress rolls, successes, pushes, Resolve and stress responses, passive and opposed checks, story points, separate panic-result classification, and multiple context-triggered career talents. **World-dependent talent effects**, actual panic movement/turn loss, injury consequences, equipment changes and full combat action costs are **not implemented in live gameplay** and remain explicitly gated. See [exact implementation / talent status](docs/EVOLVED-DICE-TALENT-STATUS.md).

## Checkpoint 007-D — Play or spectate your party (alpha)

**[Open the Party Incident](party.html)** or select **Launch Dynamic Party 007-D** in the [Personnel Registry](characters.html). Your roster transfers into one persistent park incident with the same rooms, keycard, generator, radio, beacon and a roaming raptor. One survivor acts at a time in a shared round-robin exploration clock. Every skill-based attempt uses that actor's Evolved-style characteristics, talents, stress and actual seeded d6 rolls. The player may inspect different survivors' own locations and observation logs without advancing time.

**Three live control modes:** Party (human commands all survivors), Character (human commands one selected survivor while the computer decides other turns), and Spectator (computer runs all survivors; pause, one-step, resume at selected pace). Camera view is independent of controller. AI decisions are bounded to each character's local scene and persistent skills/known objectives, not an omniscient AI model. Mode switches do not spend game time. Existing 007-C party saves upgrade to 007-D without resetting actions, dice, dinosaurs or inventory. See [checkpoint 007-D scope and limitations](docs/CONTROL-MODES-007D.md).

Supported actions include traveling along valid exits, picking up and handing over physical items, concealing oneself, investigating listed scene details, and operating objective equipment. Actions not yet modeled are rejected instead of invented. A limited natural-language parser accepts common phrasing, but **full improvisational AI GM actions and the intended Character/Spectator autonomy are still pending**. Predator proximity currently causes stress rather than full combat or injury.

Party game saves use `dinosaur-party-incident-007c` and never overwrite the old checkpoint 006.2 solo save. No Cloudflare Worker update or API key is required. See [precise playable scope and test ledger](docs/PARTY-INCIDENT-007C.md).

## Checkpoint 007-L2a — Actual stalking and facing-dependent predator vision

The [Party Incident](party.html) now simulates physical velociraptor *stalking* as a real slower approach, not merely a displayed state label. An animal following a low-confidence last-known noise or sight cue moves at most one legal zone **every four exploration actions**; an investigating animal with stronger evidence may advance **every two**. The predator may orient along the real first route leg toward sound, but cannot know an unseen survivor's actual position, cross blocked maintenance doors, or silently teleport. Its own facing and authored one-zone sightlines determine whether it can see a carried flashlight in an adjacent room. Once the light disappears, a remembered clue is no longer counted as current vision. Alerts still decay, complete ten-minute searches remain seeded, and new evidence may redirect investigation.

Original Jurassic house rules, precise action cadence, limits and save compatibility are documented in [007-L2a implementation and source fidelity](docs/DINOSAUR-STALKING-007L2A.md). **324 deterministic Node tests (307 retained + 17 new)** cover this bounded increment; final merged CI and Pages results must be verified. Individual Wonder and Dread journals, Evolved-inspired combat and injury rules, all three modes, and party save v3 remain. This is only **007-L2a**; dynamic physical occluders, additional credible stalking/attack tactics and encounter consequences remain for **007-L2b**. Manual desktop/mobile graphical gameplay QA remains outstanding.

## Checkpoint 007-L1 — Sightlines, Physical Cover and Predator Senses

The [playable Party Incident](party.html) now uses an authored seven-zone visual geometry independent of the sound and travel maps. Some passages are physically walkable while their vegetation blocks direct vision; the secured maintenance door does not permit sight through it. A survivor can use `hide behind rolling cabinet`, `hide behind fallen log`, or corresponding local buttons to attempt legitimate cover with seeded Mobility. Fixed cover stays in its own zone when a character moves. A personally powered flashlight can reveal a nearby, physically visible predator without exposing the animal's precise hidden location or search records.

A reusable Velociraptor sensory profile provides perception, hearing, search duration and logged awareness states. The offline AI only reacts to the acting survivor's local scene, perceived predator glimpses and accessible named cover. All three control modes, dice/medical/combat action budgets and **per-character Wonder and Dread discoveries** remain intact. There are now **307 deterministic tests (290 retained + 17 new)**, with final GitHub Actions and Pages verification required when merged.

This is **007-L1**, a bounded first part of the larger 007-L milestone. The `stalk` label is not yet a separate stalking attack algorithm; directional facing, obstacle destruction, species-specific signature attacks and environmental hazards remain for **007-L2**. Manual graphical browser gameplay smoke also remains outstanding. See [rules-fidelity and implementation report](docs/DINOSAUR-SPATIAL-007L1.md).

## Checkpoint 007-K — Active Flashlights, Ten-Minute Searches and Group Movement

The [playable Party Incident](party.html) now lets survivors switch owned flashlights/headlamps on/off, see remaining battery power, and choose quiet, regular or noisy movement. Lamps begin off in new parties and consume one of **12 charges per elapsed ten-minute exploration stretch** while on. In dark areas, a lit device restores **only its carrier's** Observation dice; a nearby predator can pursue a visible light only within a physically accessible map sightline. A source-tracking predator initiates a deliberate, one-stretch search of the source zone, expends a seeded Observation check even when nobody is hiding there, and eventually loses interest if no new sound or light appears.

You may order `lead group quietly to utility`, `group normal to lobby` or `everyone rush to utility`. The leader moves immediately, but the other survivors **must spend their own turns** and roll their own stealth checks; Character and Spectator AI can follow the same locally known route plan. Switching control or camera never advances dice/time. Existing version-3 saves still load, including old automatically lit carried lamps until toggled. The 006.2 solo incident and Cloudflare Worker are untouched.

The complete deterministic suite now includes **280 tests (257 retained + 23 new)**; see CI for the latest verified run. The mechanics and precise Evolved-versus-original rule boundaries are explained in [007-K implementation and rules fidelity](docs/DINOSAUR-LIGHT-STEALTH-007K.md). **Manual graphical browser gameplay QA remains outstanding**, and this is not full Alien Evolved parity or a generative open-world Game Mother.

## Checkpoint 007-J — Physical Dinosaur Pursuit, Sound and Darkness

The [survival party incident](party.html) now uses an authored **seven-room sound and movement graph** for the velociraptor. Noise has a distance-based hearing range; the secured maintenance door muffles sound and blocks the creature from crossing unless the barrier is explicitly breached in a later mechanic. After hearing a credible noise, the predator follows that source **one connected room at a time** instead of magically knowing each survivor's location.

Survivors can **Sneak to...** adjacent areas with actual Mobility checks. Successful sneaking suppresses travel sound; failed stealth can alert the animal. In combat, deliberate sneaking costs a full action rather than a normal quick move. The storm-darkened jungle, paddock and helipad impose a two-die Observation penalty on survivors without their own carried light; each character's dice are calculated independently. Footsteps heard nearby generate private atmospheric warnings without revealing the creature's hidden zone.

Party, Character and Spectator autonomy, initiative, active defensive choice, medical timing and all prior save versions remain intact. This is **original Jurassic dinosaur hearing/pursuit logic**, grounded in Evolved's stealth principles but not a claim of complete species-specific or source-exact stealth behavior. See [Checkpoint 007-J implementation and limitations](docs/DINOSAUR-PURSUIT-007J.md).

## Checkpoint 007-I — Defensive Reactions and Grouped Stealth

The [party survival incident](party.html) now **announces an incoming Velociraptor close-combat attack before rolling it**, giving a human-controlled, eligible target a real **Defend (Close Combat, one quick action)** or **Do not defend** choice. That pending decision is safely saved, resumes after reload, and follows the survivor's human/AI ownership when control modes change. A true ambush or an exhausted quick-action budget blocks the reaction; other computer-controlled survivors make their own bounded automatic decisions.

During stealth, exposed survivors in the same zone each make a passive Observation check, with the **best individual result** compared to the single predator roll; party members do not combine all their successes. An alerted dinosaur searches a hiding zone **once**, exposing no more than one hidden survivor per successful die. Merely sharing a room with a concealed survivor does not reveal them.

This is playable source-grounded progression, not complete Evolved stealth or a generative Game Mother. Group movement sequencing, sightlines, lighting, range-based combat reactions, and a more complete ecosystem of animal behavior remain in development. [Checkpoint 007-I source mapping and compatibility report](docs/DEFENSE-STEALTH-007I.md). Previous party saves and the isolated 006.2 solo incident/Cloudflare Worker remain unchanged.

## Checkpoint 007-H — Surprise, Ambush, and Initiative Holding

The [party incident](party.html) now models **source-grounded surprise and ambush**. A surprising combatant takes an earlier numbered initiative card; a qualifying ambush adds two attack dice to the opening strike and prevents defensive dodging against that strike. A concealed survivor can attack an unaware nearby velociraptor; the velociraptor can likewise surprise exposed survivors.

An active survivor can **Hold for Card #N** to exchange their initiative position with someone who has not yet acted. The exchange consumes neither an action nor RNG/world time, and it preserves already spent defensive quick actions. Newly scheduled turns follow the same human/AI ownership policy across Party, Character and Spectator modes.

**Round-lethal injuries now demand a STAMINA death check at the end of the affected survivor's own actual turn**, including a turn deferred by holding off; the shared medical clock no longer duplicates that check. Existing party saves remain valid, and the 006.2 solo game and Cloudflare Worker remain separate. The [Checkpoint 007-H rules and compatibility audit](docs/SURPRISE-INITIATIVE-007H.md) tracks limitations such as player-confirmed dodge interrupts, multiple-actor ambush negotiations, and advanced injury complications.

## Checkpoint 007-G — Persistent Wounds and Medical Survival

The [Party Incident](party.html) now includes **injury-specific D66 consequences** rather than reducing each critical wound to a generic label. Survivors retain skill penalties, compromised movement, severe bleeding, and lethal danger even when Health is restored. A lethal injury demands unpushable, stress-free STAMINA survival checks at its own clock interval: round, stretch or shift. Three successful checks stabilize the injury; failure can be fatal.

**First Aid** and **Rally** are different: First Aid can stabilize dangerous wounds, while a quick COMMAND Rally only restores a broken companion's ability to act. Properly equipped medics can attempt **Surgery** over a secured shift. Resting in a safe room advances the clock, restores Health and reduces stress; D6-based wound healing durations and the Recovery Care talent determine longer recovery. Computer-controlled medics use the same eligible treatment actions as the player.

The [007-G implementation and source-parity report](docs/CRITICAL-INJURIES-007G.md) identifies remaining gaps—especially detailed infection, optional mental-trauma rules, prosthetics and exact death-check timing after a particular survivor's turn. The original solo incident and private Worker are untouched. Earlier party saves remain supported.

## Checkpoint 007-F — Combat Initiative and Action Budgets

The [party incident](party.html) now **draws unique initiative cards** when survivors encounter an exposed velociraptor. The animal receives **two turns per combat round**; survivors can spend **one full and one quick action** or **two quick actions**, including movement, interaction, guarded readiness and attacks. The interface shows whose initiative card is active, remaining actions, and an **End Combat Turn** option. The same rules govern Party, Character and Spectator modes, including spectator single-step and bounded computer-controlled dinosaur turns. A prepared defense consumes an available quick action for an opposed dodge rather than offering a free defensive roll.

Combat rounds count approximately **10 seconds** separately from exploration stretches of approximately **10 minutes**. Existing party saves lacking combat/clock metadata continue to load. The [Checkpoint 007-F source and rules parity audit](docs/COMBAT-INITIATIVE-007F.md) lists exact mechanics and remaining differences: source-complete surprise, initiative swaps, reaction declarations, critical injury recovery and advanced dinosaur attacks are pending. Original solo checkpoint 006.2 and Cloudflare Worker are unchanged.

## Checkpoint 007-E — Active dinosaur survival encounters

The [party incident](party.html) now has grounded encounters with the map-tracked velociraptor. Human and computer-controlled survivors use the same seeded observation, stress and attack mechanics. Characters can be wounded, incapacitated or killed; their armor, cover, panic, and first aid matter. The game adds guarded observation, close or ranged attacks when the dinosaur is physically in reach, attempts to break contact, and aid for a colocated broken survivor.

**Rules scope:** the [survival implementation audit](docs/SURVIVAL-ENCOUNTERS-007E.md) distinguishes active combat/stealth and D66 injury mechanics from deferred full initiative scheduling, source-exact injury/death timelines and creature signature attacks. The quick/full action budget and initiative-card functions are tested, but **not yet enforced in the live round-robin turn scheduler**. This is an encounter alpha, not complete Alien Evolved RAW.

**Compatibility:** Party/Character/Spectator switching, earlier party saves, the separate legacy solo game and Cloudflare Worker are preserved. No Worker redeployment is required.

## Design contract

- The **deterministic engine** owns dice, character state, locations, items, predator positions, injury, stress, panic, victory and death.
- The **AI interpreter** (optional) only translates text into a bounded, structured action. The engine validates legality.
- The **AI narrator** (optional) only retells already-authoritative events. It cannot change game state.
- Every random draw uses a seeded, stored PRNG so identical seeds and player commands can be replayed.
- Browser play works without an API key. The optional AI backend keeps OPENAI_API_KEY on the server.

## Getting started

Run `node --test` for engine and Worker mock tests, then `node server.mjs` and open `http://localhost:8787`. No dependencies or build step are required for local browser play. The browser client now points at the separately deployed Cloudflare Worker rather than the legacy local `/api/director` endpoint.

To use AI: deploy the `worker/` project to the existing Cloudflare Worker `dinosaur-rpg`; configure Cloudflare secrets `OPENAI_API_KEY` and `GAME_TOKEN`; enable **AI GAME MASTER (BETA)** and enter the token in the password field at runtime. The token is not persisted in game saves; it can optionally be remembered in this browser's localStorage. Cloudflare hosting and OpenAI API usage may incur costs. The Worker uses a 30/min rate-limiting binding; that is not a monthly spend cap.

See **[Deployment instructions](docs/DEPLOYMENT.md)**, **[AI status and diagnostics](docs/DEBUGGING.md)** and **[AI GM architecture](docs/ARCHITECTURE-AI-GM.md)** for setup and security. GitHub Pages hosts the frontend once enabled; the Worker performs AI calls. Never put either secret into browser source or this public repository.

**AI model routing (checkpoint 003):** the Worker now uses `gpt-6-luna` for natural-language intent parsing, `gpt-6.1-sol` for cinematic narration, and `gpt-6.1-sol` for the experimental NPC dialogue endpoint. Future rule adjudication will use Sol at medium/high reasoning, with optional, explicitly authorized `gpt-6-astra` escalation. See **[model policy](docs/MODEL-ROUTING.md)**. This routing is server-controlled; ordinary mechanical commands require no model call.

**Current AI milestone:** interprets nonstandard commands into supported engine actions and narrates committed events. Complex exceptions and improvisations are explicitly marked unsupported until validated capabilities are added; full NPC state and AI-generated rule adjudication remain future work.

## Development priorities

1. Playable incident, reproducible rule outcomes and saves.
2. Formalize the dice/stress/panic rules against the supplied reference PDFs, recording any deviations.
3. Add predator sight, scent, hearing, weather, tactical distance and richer survival.
4. Expand the island map, persistent NPCs, mission logic and testing.
5. Move Jurassic Park-specific canon into replaceable scenario data and retheme before broader release.

## Rights and references

The primary mechanics reference is the privately supplied *Alien RPG — Evolved Edition* (Free League). The original 2019 *Alien RPG* core and *Year Zero Mini* by Matt Kay / 3 Skulls Pub remain comparison/supplemental sources. The PDFs are not included in this repository. This repository is a personal technical prototype, with original code and paraphrased mechanics rather than copied rulebook text. *Jurassic Park* and its setting belong to their respective rights holders.

## Checkpoint 004: AI status and debugging

The browser now displays explicit AI connectivity states: disabled, token missing, connecting, **GATEWAY READY** (the token authenticated but no OpenAI model call proved), **OPENAI RESPONDING** (a genuine model response succeeded), or a specific failure. Click **TEST AI CONNECTION** for a no-cost authenticated status check (requires the latest `worker/index.mjs` deployed manually).

Optionally tick **REMEMBER TOKEN ON THIS DEVICE** to keep the `GAME_TOKEN` across reloads in localStorage, never in public HTML or JSON exports. **FORGET SAVED TOKEN** clears it. Do not use this feature on a shared device. The latest local autosave is automatically recovered on page load so a refresh does not reset the game.

**EXPORT DEBUG** downloads a redacted JSON report with state, rules, scenario, RNG seed, history, command transcript, network statuses, model replies/errors, and browser metadata. The existing **EXPORT SAVE** produces the ordinary game save. Read [Debugging](docs/DEBUGGING.md) before sharing a report: it includes hidden story details and your entered commands.

## Checkpoint 005: Targeted observations and free narration

The AI can interpret an inspection such as *“Check outside the window”* as a `look` action with a target. The deterministic engine now resolves that target against authored, location-specific `observations` in `src/scenario.mjs` rather than repeating the room setup. Common direct commands (`look out the window`, `inspect window`, `peer through the glass`) also work without AI.

Targeted inspections are **free**: they do not advance turn count, roll RNG, move the predator, or change survival state. Their resolved events can still be narratively enriched by the existing Cloudflare AI narration endpoint. Unknown inspection targets return a concrete "cannot get a clear look" message and suggest available inspectables rather than claiming an imaginary observation.

Inspect buttons show available authored targets alongside existing travel/action controls. New engine regression tests cover the specific debug-report reproduction and prevent inadvertent revelation of remote dinosaur locations. **Only GitHub Pages source changed; no new Worker code needs deploying.** See [Checkpoint audit](audit.md) for the root cause and validation.

## Checkpoint 006: AI referee with deterministic consequences

The game now supports several improvised natural-language actions. `gpt-6.1-sol` returns a **typed proposal** through `POST /v1/gm/adjudicate`; the deterministic engine independently verifies that the requested prop, adjacent exit, skill and world state are valid before it resolves dice and effects. Action history preserves the accepted proposal and resulting dice for replay and debug reports.

Try **"I throw the paperweight into the service corridor"**, **"I wedge the rolling cabinet across the passage to the corridor"**, **"I hide behind the cabinet"**, or **"I investigate the control consoles"** while in the Visitor Center Control Room. Each of the seven prototype areas contains a small set of grounded environment affordances. Barricades can delay the raptor, thrown objects can divert noise, and used objects persist in saves. The engine continues to control hidden predator locations, RNG, stress, injuries, turn costs and NPC/world state.

This is an intentionally **bounded first referee layer**, not the ability to create arbitrary items, chain many actions in one turn, or improvise complete combat rules. Unsupported compound actions are refused with clarification rather than invented outcomes. See **[Referee contract and examples](docs/REFEREE-CONTRACT.md)**.

**Deployment:** GitHub Pages receives updated frontend files through `main` publishing; **Cloudflare does not auto-sync**. Copy the [latest Worker source](https://raw.githubusercontent.com/Diabolicdonut/Dinosaur-Horror-RPG/main/worker/index.mjs) into the existing `dinosaur-rpg` Worker, then deploy. **TEST AI CONNECTION** should report Worker version **006**; the existing `OPENAI_API_KEY` and `GAME_TOKEN` secrets remain unchanged. Live end-to-end model adjudication still needs player verification.

## Checkpoint 006.1 — Verified live AI test and repaired barricade behavior

The first user-supplied **live** Cloudflare v006 report demonstrated correctly authenticated Sol adjudication and narration for distraction, barricade and investigation. It also exposed a deterministic bug: **failing to barricade an exit removed the heavy cabinet entirely**, so the player's next attempt to hide behind it was rejected.

This is fixed on GitHub Pages. Failed barricades keep the original cover available; a successful installed barricade remains available to hide behind (but not to reuse at a second exit). **Previously saved games are automatically repaired from their recorded action history when the browser reloads**, preserving all rolls, turns, resources and dinosaur positions.

Also improved: distraction narration no longer presumes a dinosaur has heard it, and a successful console tampering search offers specific, bounded findings instead of repeating the generic room description.

**No Cloudflare Worker update is necessary** for Checkpoint 006.1. Refresh the GitHub Pages website (Ctrl+Shift+R), then retry hiding behind the rolling cabinet. Use **EXPORT DEBUG** if any inconsistency remains. Reconciliation is conservative for truncated action journals and will not invent missing history.

See [audit](audit.md) for the full observed turn-by-turn results and follow-up.
