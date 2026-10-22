# Checkpoint 007-G — Critical Injury and Medical Recovery

**Date:** 2026-10-22  
**Authority:** User-supplied, privately stored *Alien RPG — Evolved Edition*, printed **Damage/Broken/Critical Injuries pp. 68–71**; related time units p. 55. Source book content remains private. This implementation uses original Jurassic survival labels and code, not copied narrative or artwork.

## Implemented rules in the playable party engine

1. **D66 critical injuries:** All 36 roll codes from 11–66 have typed original wound descriptions, source-specific mechanical classifications, lethal/nonlethal status, movement restrictions, skill and Stamina penalties, surgery/prosthesis requirements, and seeded duration D6 / 2D6 / 3D6 / 4D6 / Shift. Existing 007-E/F wounds are lazily enriched without rewriting committed actor histories or earlier dice outcomes.
2. **Penalties persist beyond Health recovery.** A character who regains 1 Health can still have reduced Observation, close combat, mobility, manipulation, or specialized hand use. Foot/leg wounds require a **full combat action for movement**; severe spinal trauma prohibits normal movement. Wound effects stack only while active; once healed, they stop penalizing skills.
3. **Lethal untreated injuries:** Shift-, stretch- and round-based danger intervals persist in the actor's wound records. On each elapsed deadline, a deterministic **STAMINA** check is made with applicable wounds, **without pushing or stress dice**. Three successful death rolls stabilize a wound; a failed death roll results in death. Instant-fatal results 64–66 remain immediately fatal.
4. **First aid:** An actual MEDICAL AID check, modified by real first-aid talent, medical equipment, and the treating actor's wounds, can stabilize untreated lethal conditions **even when the patient is no longer broken**. If broken, success restores Health and action eligibility. Failed treatment shortens a lethal interval from shift → stretch → round; a further failed attempt at the round level is fatal.
5. **Rally:** A distinct COMMAND check (quick action in combat) can get an incapacitated companion moving again, but **does not stabilize an untreated lethal injury**. The distinction is recorded in the persistent medical state and source-based tests.
6. **Surgery:** A shift-length operation (modeled as 36 ten-minute stretches / six hours) uses MEDICAL AID, medical equipment, and a physically present patient in a secured staffed room. If successful, wounds marked as surgery-requiring may start their healing clock. It **does not** magically restore an amputated limb or eliminate other injuries.
7. **Safe recovery:** `rest` advances one stretch in a secure location and restores 1 Health and reduces stress if eligible. A broken survivor gets up after a stretch if still living; wounds remain. Injury healing uses elapsed days independent of Health recovery, with a nearby survivor's original **Recovery Care** talent doubling applicable treatment-day progress.
8. **World and control modes:** The same deterministic medical checks affect human and autonomous actions in Party, Character and Spectator modes. Nearby medics can detect a broken or unstabilized patient and give first aid. Eligible leaders can rally; equipped medics may attempt surgery. Character camera views show medical urgency and injury status without revealing hidden dinosaur coordinates.

## Exact source mapping and limitations

| Area | Source-derived mechanical behavior now operating | Remaining limits |
| --- | --- | --- |
| 36 D66 outcomes | Code-specific penalties, urgency bands, movement changes, surgery flags and healing durations | Injury #43's full mental-trauma subtable is **not** enabled by default; this is a separate opt-in group-consent mechanic |
| Lethal roll interval | Round / stretch / shift based on world time, Stamina without stress/push, three successes to survive | **Round checks are implemented at completed combat-round clock boundaries** rather than strictly after an individual wounded character's turn; full per-injury turn scheduler refinement remains |
| Trauma effects | Named skill modifiers, locomotion limits, bleeding impact markers, stress changes | Detailed sickness/infection progression (#46), long-term mental effects (#43), prosthetic restoration, and all persistent organ-specific secondary effects remain to be connected |
| First aid | Resuscitation plus stabilization of lethal wounds; failure worsens interval | Adjacent vs same-zone positioning uses the current room-level map; first-aid gear modifier **+1** is a local equipment convention |
| Rally | Quick COMMAND roll can restore broken Health but does not stabilize | Source-specific Help/Command interruption and panic interactions still incomplete |
| Surgery | Secured room, equipment and MEDICAL AID; takes one shift; enables healing | Full surgical complication/capability model and detailed hospital care are not yet implemented |
| Rest and healing | 1 Health per safe stretch; injury duration in days; Recovery Care doubles attended progress | Simplified safe-area model and shift scheduling; interrupted long procedures and long-term campaign downtime pending |
| Old saves | Optional injury metadata added lazily; party schema v3 unchanged | Imported historical wounds without timestamps start tracking from their first medical-processing event rather than guessing historical unlogged injury times |

**Important time rule:** The simulation uses **10-second combat rounds, 10-minute exploration stretches, and six-hour shifts**—representative values inside the Evolved Edition's 5–10 second, 5–10 minute and 5–10 hour ranges. These represent a deliberately deterministic pacing policy, not exact clock durations from a uniquely fixed RAW value.

The book explicitly recommends discussing whether mental-trauma/mental-illness roleplay is acceptable for the group before enabling those rules. The optional #43 procedure is therefore represented as a pending mechanical flag, not automatically assigning a mental disorder or character identity.

## Files and acceptance

- `src/evolved-injuries.mjs`: new original data and engine for injury modifiers, rolled healing duration, interval timing, Stamina survival checks, First Aid, Rally, Surgery and recovery.
- `src/party-engine.mjs`: medical state and elapsed-time integration, action selection, persistent consequences, surgery/rest restrictions.
- `src/combat-turns.mjs`: wound-driven full-action movement and quick COMMAND Rally.
- `src/party-director.mjs`: nearby urgent casualty awareness for medical AI; no hidden-map authority.
- `src/party-app.mjs`, `party.html`: wound labels, urgent treatment status, recovery actions and build 007-G cache revision.
- `tests/evolved-injuries.test.mjs`: 24 tests covering the complete D66 code grid, injury penalties, clocks, death rolls, treatment failures, legal medical interactions, dynamic combat action cost, actor-local AI and old save integrity.
- Previous **184 tests** retained. Total expected: **208**. Only GitHub CI confirms the final accepted state; no claim of manual visual browser QA from Node testing alone.

**Next milestone (007-H):** detailed infection, wound-driven secondary damage, source-precise death-roll timing, interactive reactive defenses and initiative changes, plus expanded safe medical facilities and character conversation. Continue to preserve v3 party saves and legacy 006.2 solo game/Worker isolation.
