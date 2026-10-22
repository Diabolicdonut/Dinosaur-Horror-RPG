# Dinosaur Horror RPG — Engineering audit

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
