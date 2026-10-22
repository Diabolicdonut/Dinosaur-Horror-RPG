# Checkpoint 007-E — Dinosaur Survival Encounters (playable alpha)

**Date:** October 22, 2026. **Scope:** `Dinosaur Horror RPG` party/spectator incident only. **Rules reference:** the user's private *Alien RPG — Evolved Edition*, **Space & Time pp. 54–55; Stealth pp. 55–58; Combat pp. 59–67; Damage/Critical Injuries pp. 67–71; Panic pp. 72–73**. No copyrighted rulebook text or artwork is included.

## Functionality integrated into the persistent island

1. **Dinosaur proximity can cause physical danger.** A living Velociraptor is tracked as one persistent, map-constrained creature. A survivor and dinosaur in the same room can experience a seeded, **passive opposed Observation** contest. Players who spot the dinosaur first receive an immediate escape/hiding opportunity; others may be surprised. The presence of a dinosaur can trigger a Resolve-based panic roll. A creature attacks exposed nearby survivors using an actual seeded d6 attack pool, with successes determining damage, reduced by the survivor's armor.
2. **Consequences persist.** Health, incapacitation, critical injury records, panic state, temporary action loss, dropped equipment and death are persisted on each survivor, not merely narrated. A single powerful attack can kill outright. Critical injury results are recorded as D66 codes with *original abbreviated severity descriptors* and lethal time-limit categories; **the book's detailed injury-specific effects, recovery timers, surgery and ongoing death-roll schedules are not yet simulated.**
3. **Stealth and defense matter.** Remaining hidden avoids automatic spotting; an alerted dinosaur must actually search to uncover someone. Cover requires scenario-defined environmental clutter. Stand Watch gives an Observation advantage when the dinosaur first appears and prepares a Mobility-based defensive roll if attacked. A fleeing survivor must use a physically connected route; a panicked survivor cannot pass through the staff-locked shed door without a keycard.
4. **Players can fight or render aid.** New bounded actions include `guard`, `attack dinosaur`, and `aid pc-2`. An attack is allowed only when the dinosaur is actually in the acting survivor's location; the person's starting/carrying weapon determines a close or ranged skill check, using real Evolved base/stress dice. The velociraptor has independent animal Health/armor and can be defeated. A nearby, living and broken companion can receive a MEDICAL AID skill check and may recover Health and stabilize on success. All effects use the same resolver regardless of Party, Character or Spectator control.
5. **Field of view remains limited.** AI companions receive only their own observable local creature, inventory, skills, injury condition and nearby injured allies. Their offline bounded policy reacts to visible danger and gives medical aid when eligible. Remote dinosaurs remain hidden. Character views do not show defeated creatures as current threats.
6. **Time is represented explicitly, but is not yet Evolved-complete.** The game view now reports approximate exploration stretches (10 minutes per completed party roster cycle). The new independent encounter module provides seeded initiative cards and legal quick/full action-budget primitives and records the 10-second combat round reference.

## Evolved fidelity / deviation matrix

| Mechanic | Implemented 007-E behavior | Fidelity status |
| --- | --- | --- |
| Base/stress dice, Resolve, trained skills and career bonuses | Reuses existing tested Evolved-style resolver for human actions and panic | Working simplified core |
| Stealth detection | Passive opposed Observation at co-location; +2 when on watch; hidden character not automatically exposed | Source-inspired, **not complete stealth sequence** |
| Dinosaur patrol/hearing | Map-connected, conditional noise response, delayed search of cover | Original limited dinosaur ecology; not Xenomorph RAW |
| Concealment | Requires authored clutter / affordance | Source-grounded requirement |
| Initiative | Unique 1–10 card draws with creature Speed=2 supported and unit-tested | **Available as a mechanics primitive, not connected to live actor scheduler yet** |
| Quick/full action economy | One full + one quick, or two quick, calculated/tested as standalone budget | **Not enforced in live incident yet**; current live turns remain simplified |
| Exploration time | Per-party-cycle approximation using stretches (~10 min); round reference is 10 s | Explicit **house-rule approximation**, not exact mode timing |
| Dinosaur attacks | Original Velociraptor rating: 6 attack dice, base damage 2, armor 1, Health 6, speed 2; one attack per exposed survivor per roster cycle | Original Jurassic Park design; **Speed 2 initiative isn't yet executed in party game** |
| Armor | Body armor subtracts from scored damage; tactical protective vest grants 2 armor | Book-consistent core, not full armor piercing / cover / range |
| Critical injuries | Rolled D66 when Health reaches zero, simplified classifications/instant fatal results | **Partial**; injury-specific lasting penalties and timed death rolls pending |
| First aid | Medical Aid check for living broken colocated patient can stabilize and heal | Basic procedure active; advanced recovery/surgery pending |
| Panic | Resolve roll; some outcomes drop items, trigger retreat/concealment or skip a future turn | **Partial**; not all 12 response interactions/transmissions are active |
| AI autonomy | AI uses actor-local scene and legal action plans to decide defense or rescue | Bounded offline decisions, no full dialogue or generative AI GM |

**Important:** The coded survival effects deliberately represent only a bounded Evolved-inspired integration stage. They **do not** qualify as complete Evolved combat or injury rules. There is no full initiative-linked combat scheduler, no cross-species attack signatures, no sustained survival recovery/death rolls, and no claim that all character talents, guards, interrupts or encounter timings exactly match the rulebook.

## State and compatibility

- Continues independent `party.html`, save key `dinosaur-party-incident-007c`, and party schema **version 3 with optional new survival fields** (defaulted on first contact) so 007-D party saves can continue without replay or new mandatory fields. The previous 007-C v2→v3 migration still applies.
- New survivors begin with `armorLevel`, `criticalInjuries`, `broken`, `dead`, `seenThreats`, `guarding` and `pendingSkip` fields. Legacy party actors without these fields are safely interpreted by the new system. Individual character sheets remain Evolved-valid.
- The original checkpoint 006.2 solo game, save schema and Cloudflare Worker **were not changed**.
- The browser page and client imports are revisioned to `007e` to prevent cached 007-D behavior from masking the upgrade.
- Manual/auto/hybrid character setup, Party/Character/Spectator ownership, independent camera, pause/step/resume and saved AI proposals still work.

## Validation

- `src/evolved-encounters.mjs`: original mechanical implementation for tested initiative/quick-full budgets, opposed stealth, armor and hit damage, D66 injuries, panic and first aid.
- `tests/evolved-encounters.test.mjs` (12 tests): initiative, action budgets, detection, armor/dodge, reproducible damage, critical injuries and aid/panic.
- `tests/party-survival.test.mjs` (12 tests): physical scenario danger, only colocated targets, concealment, dead/defeated statuses, guard/medical actions, injury and actor-local sensory constraints.
- All prior party/AI/director/saved-state regressions retained. **Total: 167 Node test cases.** CI result is authoritative; manual graphic interaction QA is a separate gate.
- Prior scripted **always-rescued** spectator test was separated from the lethal simulation: a no-predator fixture validates that autonomous crew can solve the objective chain, while the live dinosaur simulation may fail or kill the party. Guaranteed success would contradict the new survival threat.

## Next integration gates

1. **Live combat scheduler**: actually use independently tested drawn initiative with full/quick action budgets and out-of-turn interrupts; preserve existing freeform actor ownership and control-mode switching.
2. **Source-exact injury effects and timed rolls**: D66 injury-specific penalties/bleeding/death intervals, critical injury treatment and surgery, healing clocks and usable medical equipment.
3. **Dinosaur ecology and tactics**: creature actions by actual speed/initiative, stalking, scent/sight/noise limits, movement ranges, attacks specific to Jurassic species, grapples, pursuit and defensive interrupts.
4. **Panic mechanics and knowledge**: all responses' exact physical/temporal effects, propagation to nearby survivors, de-escalation, and condition persistence.
5. **Generative GM**: freeform intentions and grounded companion conversations, behind a typed effect validator and original Jurassic Park story data.

**No Cloudflare Worker update required for 007-E.** Full Evolved source parity remains a multi-checkpoint undertaking.
