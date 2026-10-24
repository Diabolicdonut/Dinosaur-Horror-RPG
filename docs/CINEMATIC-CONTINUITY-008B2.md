# Checkpoint 008-B2 — Connected Cinematic Scenes and Earned Consequences

**Date:** October 24, 2026. **Base:** `main` `7791f0c772bb5f2b116891cfbec94676185a8b1f`, accepted 008-B1, v0.7.16, 389/389 tests and successful Actions/Pages. **Authority:** privately provided *Alien RPG Evolved Edition* governs the existing Observation, Heavy Machinery, stress dice, push, time and wound systems. The scenario-specific preparation modifier, scene text and connections below are **original Jurassic Park adaptation content**, not reproduced Alien tables.

## Goal: connect scenes through meaningful decisions

The initial seven-zone *After the Storm* emergency already gives characters reason to move between normalcy, investigation, wonder, danger and recovery. This increment makes **earned information and physical outcomes travel with the story** instead of merely changing the current scene's title. Actors need not visit optional side scenes or fight a creature; the existing goal (keycard → auxiliary generator → distress call → helipad beacon) remains open to player choices.

## Physical consequence A — control room to generator shed

A survivor who makes a **real successful, time-consuming Observation investigation** of the existing control-room `consoles` discovers an auxiliary-generator priming sequence in the surviving maintenance diagnostic. The same survivor may later enter the shed and attempt `use generator`:

- Without the discovery, the generator uses **ordinary Heavy Machinery**.
- With a verified personal `control:consoles` successful Observation record, the same survivor receives exactly **+1 ordinary situational base die** on the established Heavy Machinery check. It is not an extra action, free success, new inventory item or skipped roll.
- The existing `result()` resolver applies all Evolved baseline dice, stress, valid pushes, injuries and consequences. Both successes and failures spend normal game time; the existing generator operation noise remains unchanged. The action journal records whether the preparation applied, its one-die modifier and the source ID.
- The companion who never examined the consoles does **not** inherit this benefit. Studying the information is **optional**; a player can still start the generator without it.
- The knowledge is already persisted in the original actor's `observed` discovery history, so no additional save format is necessary. It does not create or duplicate a physical tool.

## Scene continuity B — investigations, repairs, messages

`src/cinematic-continuity.mjs` is a read-only actor-local projection of actual discoveries, physical repairs and committed mission flags. `partyView.sceneConsequences` renders those consequences in the browser and `sceneForActor` adjusts the relevant local framing. Four **new typed optional scene events** under the existing `src/cinematic-director.mjs` registry bring the total to **eleven**:

1. **Familiar Startup Sequence** — at the shed, before power returns, only if the *current actor* successfully investigated the control-room consoles.
2. **What the Tracks Can Tell Us** — at the jungle path, only if the *current actor* successfully investigated the existing track evidence; the character understands previous movement, never the raptor's unseen current location.
3. **A Safer Perimeter** — at the paddock only after the real gate repair succeeded; visiting characters see its consequence and can reflect on it without a forced predator encounter.
4. **A Message Beyond the Island** — at the control room after a real transmitted distress call; this adds a recovery beat without inventing an answer, rescuer or beacon activation.

An actor who personally failed the optional gate brace recognizes its unsecured state and previous noise **only when physically present**; a separate actor receives no private failure memory. All previously available personal Wonder moments and ambient distant herbivores remain, with the authored squall continuing to gate unobstructed sightings.

Scenes are offered only where prerequisites and Evolved gameplay circumstances permit them, and may be ignored. Their narrative activation remains a no-time, no-dice choice, distinct from the original costly Observation and Heavy Machinery checks. This is **not** an automatic Game Mother, NPC system or wildlife simulator.

## Tests, save fidelity and honest limitations

- Retain **389** accepted Node tests and add **16** new tests under `tests/cinematic-continuity-008b2.test.mjs`: actual successful versus failed Observation, precise +1 base die and identical seed, other-actor privacy, room changes, power restoration, valid gated narrative scenes, observable physical repair, personal failure memory, transmitted rescue call, no forced monster effects, old saves, three-mode camera control, and browser wiring. **405 tests total.**
- No party schema bump: valid party v3 saves, old v3 missing optional scene/danger fields and the existing v2→v3 migration remain supported. Existing `observed`, `sceneRecords`, `dangerRecords` and rescue flags are reused. No private PDFs, credential changes or legacy solo 006.2/Worker v006 modifications.
- **Manual desktop/mobile interactive graphical smoke remains outstanding.** Automated Actions and GitHub Pages are checked separately against accepted `main`; a green Node suite cannot substitute for hands-on gameplay.
- **Still future work:** a fully branching multi-adventure campaign, human NPC dialogue/relationships, physically interactive peaceful herbivores, complete Evolved Cinematic/Last Survivor procedure parity, finite 007-M supplies and a bounded conversational 007-N AI Game Mother. **No always-on animal population or Zoo Tycoon ecology** is necessary to advance those goals.

**Next suggested step:** 008-B3—a complete, testable multi-scene incident combining voluntary discovery, real repair and rescue, interpersonal/recovery opportunities and a truly optional physical dinosaur encounter; add practical 007-M resources where they make those scenes mechanically consequential. Do not present this checkpoint alone as a completed campaign system.
