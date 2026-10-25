# Checkpoint 008-C1 — Park Guide Escort and Consequential Rescue

**Date:** October 24–25, 2026 (US Eastern). **Recovered main baseline:** `9cb9e3d5181b198ea0e24c1b7b350b46a680043d` — accepted 008-B3 / v0.7.18 / 424/424 tests; both Actions and Pages were successful. This is an original *Jurassic Park*-style Cinematic scenario increment. The privately supplied *Alien RPG Evolved Edition* remains the authority for real skill pools, stress, pushes, injury and action time. The named employee, routes, dialogue and branching rescue epilogue are original authored content, **not** Evolved NPC tables or a persistent island population simulator.

## Why this helps the movie-like adventure

One stranded person creates a meaningful choice outside combat: rescue a park employee as an optional, potentially risky detour, shelter her at the Visitor Center, or continue the original power → radio → helipad sequence without her. She is *physically located* at lobby reception. She does not appear in remote character views, teleport to the beacon, materialize as an extra dinosaur, or alter the underlying automatic mission victory condition.

**Mara Velez** is an original visitor-services park guide sheltering behind reception. Players may voluntarily:

- **Talk** (at the same room, once per survivor): authored dialogue reflecting the **actual** power and radio status. This scene is a free no-roll narrative option and cannot cure Stress or grant equipment.
- **Persuade** (at the same lobby, once per attempting survivor while she waits): a real, time-consuming Evolved **Manipulation** check with existing seed, Stress, push and injury modifiers. Failure leaves Mara in place; another present survivor may try. Success makes her follow the persuading survivor. She does not automatically agree because the player clicked a dialogue button.
- **Move together**: Mara follows **only her current escort**, **one actual exit at a time**, on the escort's successfully committed move/sneak/rush action. The existing staff-card lock, storm shutter, terrain, time, risks and dinosaur response apply. Another survivor moving cannot teleport her. A failed or blocked move does not transport her.
- **Handoff**: a colocated, capable teammate can assume escort responsibility (ordinary exploration action). A handoff never grants a free jump through a blocked door.
- **Shelter**: if escorted into the reinforced control room, the escort may leave Mara there safely in scene terms (one exploration action, not a medically verified safe zone or immunity to all danger). Mara can be invited to travel again later from that physical room.
- **Muster**: the active escort may bring her to the *real* emergency helipad and account for her with one ordinary action. She is then waiting there; she is not a hidden playable actor or part of Evolved combat initiative.

The choices are offered only to an authorized, capable survivor who is physically present, outside active combat. While the guide is a noncombat scene NPC, **she does not yet have a health/stress/combat sheet and does not take independent predator attacks**. That is a known prototype boundary, not the claim that a predator would ignore her in an eventual full simulation.

## Endings that reflect actual actions, without modifying accepted mission rules

The existing Comtech beacon check still ends the incident as `outcome='rescued'` on genuine success. A new factual **guide-specific epilogue** is attached to that committed action and to the postgame view:

- **Mustered at helipad:** Mara is accounted for at rescue.
- **At helipad but not mustered:** she arrived, but has not been formally accounted for.
- **Sheltered in control room:** she remains sheltered there; a later pickup is not verified.
- **Elsewhere (including left in the lobby):** she was not at the helipad; her eventual fate is unknown.

No branch invents an offscreen helicopter, kills a left-behind guide, or grants an extra mission victory. The existing main rescue mechanic is intentionally left unchanged; adding an actual helicopter arrival/evacuation time step and NPC combat agency would require a separate authored and tested milestone.

## Persistence, control and validation

`src/cinematic-escort.mjs` exposes a single typed `parkGuide` state, with `waiting/following/sheltered/mustered` status, actual zone, escort ID, failed/successful Manipulation attempts and which actors have spoken. The party engine alone commits actions; the browser exposes only the current character's local guide description, eligible choices and a final public rescue epilogue. The guide cannot silently affect the autonomous companion policy or claim AI-generated dialogue.

Party save schema remains **v3**; `parkGuide` is an optional field for older saves, interpreted as the original stranded-lobby state when absent. When present it validates legal zones, real participant IDs, unique attempts, correct shelter/muster zones, and colocated current escort; malformed records reject. No migration rollback. Previous Wonder journals, personal storm/wildlife observation, actual Velociraptor, rescue objectives, Party/Focus/Spectator, legacy solo 006.2 and Worker v006 remain unchanged.

**Tests:** Existing **424** cases preserved; **16** new `tests/cinematic-escort-008c1.test.mjs` cases test free conversation, actual Evolved Manipulation, failures and retries by another actor, no-cost illegal requests, legal movement and locked door, handoff, shelter and onward escort, helipad muster, truthful beacon outcome, forged data rejection, old-save migration, camera/mode privacy and browser integration, targeting **440/440**. The initial PR validation run [40160684489](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40160684489) passed 440/440. Subsequent docs changes require final-head validation and the accepted main Actions and Pages must be checked independently.

**Manual desktop/mobile graphical gameplay testing remains outstanding**. Green automated tests or Pages deployment alone do not prove all clicks, interactions or actual playing feel good.

**Next:** Flesh out the first movie-like Cinematic story with longer original human dialogue, meaningful recovery and a finite 007-M supply/tool contract, then integrate the AI Game Mother through typed validated commands. Do not add park-management/ecology subsystems as prerequisites.
