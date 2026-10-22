# Dinosaur Horror RPG — Faithful Evolved Mechanics / Jurassic Park Content Plan

**Approved direction:** 2026-10-22. Primary private authority: *Alien RPG — Evolved Edition* (Free League, user's Library). Reference policy: [EVOLVED-RULES-AUTHORITY.md](EVOLVED-RULES-AUTHORITY.md).

## Non-negotiable design rules

1. **Mechanics-first fidelity:** Implement the Evolved Edition's attribute + skill dice pools, individual base/stress dice outcomes, stress response and panic timing, Resolve, pushes, extra successes, careers, talents, equipment, action economy, passive/opposed checks, injuries and other survival procedures as written wherever the park setting supports them. Do not replace d6 procedures with an invented single percentage engine at this stage.
2. **Original themed content:** Dinosaur Horror's human archetypes, park equipment, geography, missions and species-specific threats are bespoke implementations patterned after mechanical roles in Evolved. The uploaded rulebook stays private; no copyrighted text/tables/artwork is copied wholesale into this repository.
3. **Natural-language first:** Players describe objectives and physical methods in ordinary language. The AI translates to a bounded, semantically validated rule request. **Players never need to know or type skill names, dice notation, talent IDs or coded action verbs.**
4. **Transparent mechanical provenance:** The engine stores character stats, skill, talent triggers, modifiers, dice (individual rolls), stress and panic effects, opposed checks, time costs and applied world deltas; the UI can keep rolls hidden by default with debug visibility. AI prose cannot alter the committed outcome or expose hidden dinosaur state.
5. **No arbitrary invention:** All scene objects, equipment, character capabilities and dinosaurs are validated against the persistent world. Unsupported requests are clarified or resolved as physically possible improvisations through tested effect primitives; no LLM-selected dice, damage or creature position.
6. **Source hierarchy:** Explicit newly accepted Dinosaur Horror rules > Evolved Edition mechanics > original 2019 Alien rules for comparison > Year Zero Mini for tertiary context > legacy checkpoint 006.2 code only as an accurate description of current behavior.

## Careers are themed role packages, not exclusive skill locks

The Evolved Edition's Core Concepts (p. 26) uses twelve broadly available skills ranked 0–5. A starting character receives 10 skill points; their career skills can begin at up to rank 3, other skills at up to rank 1, and they choose one of their career's starting talents. A skill can be attempted without any ranks. The GM may pair a skill with a non-default attribute when the method supports it (*Using Skills*, p. 43).

**Initial candidate Jurassic Park archetypes (fictional mapping only; no mechanics presumed until edition-specific audit):**

| Evolved narrative role | Proposed original park-themed career |
| --- | --- |
| Colonial Marine | Tactical Response Specialist |
| Colonial Marshal | Park Ranger / Security Officer |
| Company Agent | InGen Corporate Representative |
| Kid | Young Park Visitor |
| Medic | Field Medic / Veterinary Technician |
| Officer | Park Operations Supervisor |
| Pilot | Helicopter / Vehicle Pilot |
| Roughneck | Park Maintenance Technician |
| Scientist | Paleontologist / Geneticist |

Start with Evolved's twelve skill **mechanical categories** as internal canonical IDs so all training and talents have an unambiguous specification: Heavy Machinery, Stamina, Close Combat, Mobility, Ranged Combat, Piloting, Observation, Comtech, Survival, Command, Manipulation, Medical Aid. Each candidate career must receive original Jurassic Park background, skill emphases, gear, initial talent options and progression, with source-to-adaptation mapping reviewed individually. For example, Comtech includes park electronics, radios and security systems; Piloting includes plausible park vehicles; medical care and veterinary treatment need explicit species and equipment restrictions rather than assuming full interchangeability.

Keep Evolved's talent timing, activation conditions and dice/stress consequences when creating setting-specific equivalents. Never silently grant unlimited ability to an archetype because its description suggests it is an expert.

## Work phases with validation gates

### Phase A: Evolved mechanical rules inventory

Build a **source-to-engine matrix** against the private book with: rule name, page, inputs, output, timing, exceptions, test fixture, adaptation decision, implementation status. Minimum coverage:
- Character creation: four attributes, career key attribute, 12 skills, skill rank caps, talents, starting gear, backgrounds, Health and Resolve.
- Skill resolution: threshold/extra successes, modifiers, assistance, untrained attempts, switching attribute, opposed and passive checks.
- Push restrictions (including existing stress faces), stress responses vs panic, Resolve, stress recovery, and lasting consequences.
- Action timing: stealth exploration, encounter transition, combat initiative and quick/full actions, interruption and time/resource costs.
- Injury/Health/armor/critical injury/healing/recovery, supplies/gear and survival.
- Encounter mechanics appropriate for humans, dinosaurs, vehicles and other park threats.

**Gate:** no rule marked implemented without positive, negative and deterministic replay tests.

### Phase B: Mechanical foundation / character system

- Introduce data-driven character careers, attributes, skills and talent definitions; implement character creation validation and advancement.
- Port Evolved-style dice pool resolution **with every die result retained**, seed replay, stress dice distinguished from base dice, push and stress-response semantics and conditional effects.
- Add skill and talent hooks in original game code and verify the probability distribution against mathematical expectations as a diagnostic, **without replacing dice**.
- Audit the current `check()` and `RULESET` as legacy only; fix deviations in new engine version while maintaining migration/saved-game handling.

**Gate:** test character build edge cases, untrained attempts, career caps, talent effects, attribute switching, stress, pushing, passive/opposed checks and deterministic replays. Document any purposeful Jurassic Park house rules.

### Phase C: Combat, stealth and survival parity

- Add Evolved encounter action economy, stealth procedures, critical damage, armor, recovery, supply and timed activity rules.
- Create dinosaur species data with verified sensory, pursuit, defensive and signature-attack procedures; align creature pacing to Evolved encounter risks without simply renaming Xenomorphs.
- Support original park situations: power outages, electrified fences, tropical storms, veterinary care, evacuation, vehicles and environmental barriers.

**Gate:** replay representative multi-round pursuits, hiding, injuries and recovery; no dinosaur omniscience or magical disappearing props.

### Phase D: Natural-language Game Master

- Interpret user intent and method, source objects, goal, stakes and action sequence without a player-facing verb list.
- Translate to **actual Evolved-compatible skill checks and talent triggers** behind the screen. Request a different attribute with a given skill when justified, subject to deterministic approval.
- Split or sequence compound actions using real time/action costs and interruptions; resolve success/failure and secondary outcomes using recorded dice.
- Narrate from committed, player-visible events only. Expose optional explain-ruling/debug mode, not obligatory checks to player.

**Gate:** original prompts such as "get past the fence", "signal the helicopter", "keep the raptor away", "patch her leg", "use the park's camera system", "move the cabinet and hide" each translate appropriately without pre-programmed player command forms.

### Phase E: Cinematic incident and transition

- Construct original park careers, NPC agendas, growing pressure, information, escape objectives and dinosaur encounters.
- Retest saves and worker API. No breaking change to stable v006.2 save schema without explicit migrations and archived replay fixtures.
- Keep the Cloudflare Worker source manually deployable; only ask user to repaste/deploy when `worker/index.mjs` actually changes.

## Change-management rule

Any deviation from an Evolved mechanic requires a line in the adaptation matrix specifying: **Evolved baseline behavior → Jurassic Park revision → rationale → numerical/procedural differences → regression tests → approval status**. Until then, rules remain Evolved-default.

**This document is a roadmap, not evidence that Phase A–E are complete.** Existing Checkpoint 006.2 browser and Worker behavior remains unchanged by documentation decisions.
