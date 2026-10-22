# Dinosaur Horror RPG — Isla Nublar Prototype

A personal-use, browser-based dinosaur survival-horror RPG prototype. Its initial *Jurassic Park* setting is deliberately isolated from the original rules engine so it can later be replaced with an original dinosaur setting.

**Status:** Checkpoint **007-H — Surprise, Ambush, and Initiative Holding (alpha)**. Launch 1–8 manually or automatically generated survivors into the same saved island incident; freely change who controls future actions, take over any survivor, watch AI companions decide their turns, or pause/step/resume fully computer-directed play. The three modes share the same grounded world and seeded hidden Evolved-style dice. **AI companions currently use a bounded deterministic offline policy**, not full generative roleplaying. The legacy 006.2 solo game and its saves remain separate. Checkpoint 006 — bounded AI GM adjudication for improvised investigations, distractions, cover and barricades. The new Cloudflare Worker source must be pasted/deployed manually for live Sol adjudication. This is a Year Zero-inspired proof of concept, not complete Alien RPG RAW.

## Rules authority and free-form roleplaying (accepted October 22, 2026)

**Primary rules reference from now on: the user's privately supplied *Alien RPG — Evolved Edition* (Free League).** Previous 2019 Alien RPG core and *Year Zero Mini* are comparison and supplemental references only. The game's existing checkpoint 006.2 dice/stress implementation is a *legacy prototype*, not Evolved RAW; authority adoption **does not yet change running mechanics**. Follow [the accepted Evolved edition / natural-language doctrine](docs/EVOLVED-RULES-AUTHORITY.md), alongside the [accurate legacy implementation baseline](docs/RULES-BASELINE.md).

**Updated accepted direction:** Faithfully implement Evolved Edition's **actual seeded d6 pools**, distinct base/stress dice, careers, twelve broadly available skills, career-linked talents, pushes, Resolve, stress/panic, stunts, action economy, combat, stealth, injuries and equipment; create original **Jurassic Park** themed careers, equipment, animals and stories. Keep all dice rolls and mechanical checks *behind the screen*. Players describe their methods in plain language; AI proposes the underlying skill/attribute/talent requests, and deterministic code validates and resolves them. **The custom percentage-only probability engine proposal is superseded.** Careers determine initial skill emphasis/talent choices rather than preventing other skill attempts. See the [faithful Evolved adaptation implementation plan](docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md). Current limited verbs/referee kinds are temporary prototype restrictions, not the intended gameplay.

**Deployment:** This authority change is documentation-only. No Cloudflare Worker repaste or browser refresh is required for the decision itself. The existing game does not yet implement generalized free-form adjudication.

## Playable-party control modes (new design requirement)

The future Dinosaur Horror RPG supports switching among **PARTY** (player controls every playable character), **FOCUS** (player controls exactly one selectable character and AI controls the other playable characters) and **SPECTATOR** (AI autonomously controls all playable characters). Switch control dynamically at safe action boundaries without resetting the story, characters, injuries, supplies, stress, dinosaurs or dice. **Camera/viewpoint is independent** of who controls decisions; the normal camera respects individual character knowledge to preserve horror.

The same Evolved-inspired **character sheets, hidden seeded rolls, action economy, combat, injuries and deterministic world state** govern all three modes. Computer companions have independent objectives, personalities, memories and knowledge limitations; accepted decisions are recorded so actions can be replayed. Spectator includes Pause/Step/Resume and can return control to the human at any time.

See the [complete multi-character control-mode contract](docs/MULTI-CHARACTER-CONTROL-MODES.md) and [updated mechanical development plan](docs/DINOSAUR-EVOLVED-IMPLEMENTATION-PLAN.md). **All three controls are available in the Party Incident 007-H alpha**. Camera selection, safe takeover and pause/step/resume are working. Drawn initiative, two raptor turns per round and full/quick action budgets now run in the same persistent world; source-complete injury recovery, surprise/ambush and conversational AI remain incomplete. The separate solo 006.2 build still models one playable character. No Cloudflare redeployment is required for the offline party modes.

## Character creation: manual, automatic or hybrid (working Personnel Registry)

Create **any or all playable survivors** manually, automatically, or with a mixed/hybrid approach. Each party member can use a different method. Choose a career, lock chosen skills/attributes/talent/background fields, generate the remaining details, preview the Evolved-valid character sheet, and selectively reroll individual members or the entire unlocked party. A separate character creation seed preserves reproducibility without consuming the live game's random stream.

Profession, 12-skill training, talents, gear, stress/Resolve and derived attributes use a common Evolved-compatible rule validator. Generate original Jurassic Park backgrounds and motivations without adding unauthorized mechanical advantages. Character creation is separate from Party/Focus/Spectator control modes: any character may be manually or AI controlled later. Once play starts, advancement and equipment changes follow the game rules rather than retconning the character.

See [complete character generation requirements](docs/CHARACTER-GENERATION-MODES.md). **Creation works in the separate Personnel Registry and launches Party Incident 007-F**; the original 006.2 solo page intentionally retains its old fixed character.

**[Open the working Personnel Registry](characters.html)** to create parties of 1–8 survivors, lock details, edit careers/skills, reroll and export validated drafts. Generated parties can now be played in the separate 007-H party incident, using supported Evolved-style skill/talent mechanics; several world-dependent talent effects are still pending. [Rules fidelity and gaps](docs/EVOLVED-CHARACTER-MATRIX.md).

## Checkpoint 007-B — mechanical Field Assessment

The [Personnel Registry](characters.html) now provides a **FIELD ASSESSMENT / HIDDEN DICE** panel. Select a survivor and scenario context, choose a skill, stress, modifiers, requested pushes and seed, then run a real individual-d6 check in the isolated Evolved resolution module. Initial dice remain hidden by default, with an opt-in **Reveal individual dice (debug)** control. Repeat the same seed to replay the check. Running the laboratory does **not** change the saved incident or permanently modify a character sheet.

The new [Evolved checks module](src/evolved-checks.mjs) implements actor-based base/stress rolls, successes, pushes, Resolve and stress responses, passive and opposed checks, story points, separate panic-result classification, and multiple context-triggered career talents. **World-dependent talent effects**, actual panic movement/turn loss, injury consequences, equipment changes and full combat action costs are **not implemented in live gameplay** and remain explicitly gated. See [exact implementation / talent status](docs/EVOLVED-DICE-TALENT-STATUS.md).

## Checkpoint 007-D — Play or spectate your party (alpha)

**[Open the Party Incident](party.html)** or select **Launch Dynamic Party 007-D** in the [Personnel Registry](characters.html). Your roster transfers into one persistent park incident with the same rooms, keycard, generator, radio, beacon and a roaming raptor. One survivor acts at a time in a shared round-robin exploration clock. Every skill-based attempt uses that actor's Evolved-style characteristics, talents, stress and actual seeded d6 rolls. The player may inspect different survivors' own locations and observation logs without advancing time.

**Three live control modes:** Party (human commands all survivors), Character (human commands one selected survivor while the computer decides other turns), and Spectator (computer runs all survivors; pause, one-step, resume at selected pace). Camera view is independent of controller. AI decisions are bounded to each character's local scene and persistent skills/known objectives, not an omniscient AI model. Mode switches do not spend game time. Existing 007-C party saves upgrade to 007-D without resetting actions, dice, dinosaurs or inventory. See [checkpoint 007-D scope and limitations](docs/CONTROL-MODES-007D.md).

Supported actions include traveling along valid exits, picking up and handing over physical items, concealing oneself, investigating listed scene details, and operating objective equipment. Actions not yet modeled are rejected instead of invented. A limited natural-language parser accepts common phrasing, but **full improvisational AI GM actions and the intended Character/Spectator autonomy are still pending**. Predator proximity currently causes stress rather than full combat or injury.

Party game saves use `dinosaur-party-incident-007c` and never overwrite the old checkpoint 006.2 solo save. No Cloudflare Worker update or API key is required. See [precise playable scope and test ledger](docs/PARTY-INCIDENT-007C.md).

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
