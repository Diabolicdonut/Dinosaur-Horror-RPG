# Checkpoint 007-L2b2 — Authored Rain Squall and Physical Service Shutter

**Date:** October 24, 2026. **Source authority:** privately supplied *Alien RPG Evolved Edition*, exploration/stealth, scene challenges and Evolved action/combat procedures. **Adaptation:** all park terrain, local weather, shutter mechanics and visibility constraints are original Jurassic Park scenario house rules; none is a quotation or official creature statistic.

## Purpose and boundaries

Complete the remaining **bounded environment/encounter portion** of 007-L2b without simulating island meteorology or animal populations. This is a mechanical, scene-specific extension of a single existing After the Storm incident. The GM can generate tension from believable obstructions and intermittent visibility rather than spawning dinosaurs or imposing attacks.

## Implemented environmental conditions

1. **Hand-operated storm shutter at the shed/jungle opening.** An actual physical object is authored in both the Maintenance Shed and Jungle Service Path. It starts **open**. An actor in either zone can `use shutter` to **close** or **open** it, consuming the existing `use` action and ordinary exploration time; in combat it uses the normal Full action cost. A closed shutter blocks traversal in **both directions** for player and dinosaur, with attempted movement rejected **before** any Mobility dice or time are spent. It also obstructs line of sight, attenuates sound across this one opening, and cannot retroactively authorize an approach pounce through that closed passage. It cannot block the other exits or teleport a creature. Existing closed utility/shed door remains independently authoritative.
2. **Scripted tropical squall.** The storm briefly intensifies during **exploration stretches 2 and 3**, clearing when stretch 4 begins. This is a deterministic environmental beat derived from committed exploration time, not a random weather simulation or a new mutable/weather save object. Outdoor across-zone sight is occluded on the authored **jungle–helipad** link, and the exposed **shed–jungle** opening, during this squall. **Same-zone** sight and combat eligibility are unchanged; interior sightlines, legal travel, ordinary sound, the map, dice, damage, stress and surprise are unchanged. The UI shows local rain/squall only to viewpoints in outdoor zones; inside viewers receive no omniscient weather forecast.
3. **Dinosaur sensing and AI awareness.** Physical shutter and squall states pass to visual sightlines and active-lamp detection; closed shutter passes to sound/route/stalking tests. A blocked movement removes a companion's local passable exit without exposing the shutter's distant state to separated characters. The already implemented Velociraptor remains the only simulated dinosaur, with existing patrol/stalk/investigate/search/attack logic and Evolved-inspired initiative and injury handling.

## Persistence and privacy

- Party save kind `dinosaur-party-incident` and schema **v3** are unchanged. A new **optional Boolean** `flags.serviceShutterClosed` defaults to false (open); missing legacy fields retain that default, while forged values are rejected. The scripted squall is derived from `clock.explorationStretches` and needs no stored field.
- One actor's view reports the local shutter if and only if they occupy the shed or jungle opening. Mission flags continue to be shared; **shutter state does not leak in their flags**. Unrelated zones keep their previous travel and sight affordances.
- Seeded RNG/replay, actual dice, initiative, existing pounce/defend attacks, actor-owned Wonder discoveries, three agency modes, v2→v3 saves and isolated 006.2 solo/Worker v006 are preserved.
- The scene-directed, AI Game Mother and encounter/danger timer work are **not** implemented by this checkpoint. A squall does not force a monster to appear.

## Validation

Baseline: **346** accepted Node tests in main at checkpoint 007-L2b1, commit `beefa2a98599a3a47bd46afa75c18b83410ca726`, with successful Actions and Pages.

**16 focused** tests in `tests/dinosaur-environment-007l2b2.test.mjs` cover local weather derivation, normal and blocked sightlines, unchanged hearing/travel during squalls, rescue of previously invisible distant silhouettes when rain clears, two-sided shutter operation, attempted illegal traversal with no dice/time, valid dinosaur routes, sound damping and barriers, actual stalking/pounce, save validation and migration, player/AI camera privacy and browser commands. **362** tests expected.

A passing Actions run and successful Pages deployment must be verified separately **on the accepted main SHA**. Actual desktop/mobile hands-on graphical game play, all three control modes and save/reload during a shutter operation remain **outstanding** until tested.

## Outcome and next priority

007-L now has bounded physical encounter behavior, visibility, cover, route constraints and one source-compatible original raptor attack option. **Do not call graphical quality assurance complete.** After automated acceptance of 007-L2b2, move emphasis toward **a playable linked Cinematic/Campaign scenario**: typed conditional events, Alien-style encounter/danger pressure, physical supplies and eventually a bounded conversational Game Mother. Weather engines, continuous herd simulation, pack ecology or additional species are not prerequisites.
