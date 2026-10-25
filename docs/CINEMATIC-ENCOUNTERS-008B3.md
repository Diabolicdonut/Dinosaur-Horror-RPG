# Checkpoint 008-B3 — A Quiet Living Dinosaur and Human Companionship

**Date:** October 24, 2026 (US Eastern). **Recovery:** accepted 008-B2 `main` `1caf0cb40b6de0728e646a140241a696fbc2fb48`, game 0.7.17, 405/405 tests, final Actions and Pages successful. **Rules authority:** private *Alien RPG Evolved Edition* controls Mobility checks, stress dice, pushes, action time, injury and existing predator behavior. The Parasaurolophus encounter and character conversations below are original Jurassic scenario content; these are **not** official Alien creature attack rules or a simulated ecosystem.

## What is playable now

### Scene: A living Parasaurolophus at the jungle drainage stream

A single **authored physical encounter** exists at a creek across a steep fern-covered bank alongside the established Jungle Service Path. A Parasaurolophus is peacefully drinking on the far bank. It is **not** added to the combat-oriented Velociraptor `dinosaurs[]` array, and there is no island-scale population, feeding, breeding or migration engine. The bank physically separates the animal from the party; the animal can move away.

A character present at the jungle path, while capable and not fighting, may choose:

- **Observe from the path** (`wildlife watch`): a calm, optional, **ordinary exploration action** that uses elapsed time and predator progression but **no skill roll** or forced Stress gain. The original Evolved observation/combat rules are not invoked when the party is simply respecting the animal's space. The actor's actual observation is remembered.
- **Approach carefully** (`wildlife approach`): a deliberate, optional **Mobility** check through the accepted Evolved check/stress/push engine, consuming an exploration action. On success, the Parasaurolophus remains calmly across the stream. On failure it withdraws into the ferns; the startled movement generates **noise 2** through the existing physical sound/Velociraptor reaction machinery, **not** an unavoidable dinosaur attack or free damage. The attempted approach is recorded, with its real seed, dice, result and propagated noise.

There is no guaranteed horror beat. Characters may watch, approach once, simply leave, or never visit the animal. The authored tropical **squall obscures visibility** and prevents fabricated sightings while active. A **real active Velociraptor entering/present at the jungle stream** makes the herbivore withdraw with a persistent `predator` reason on an accepted exploration turn; it does not teleport into combat or reappear conveniently when the predator leaves. A previously witnessed animal's continued presence or disappearance is projected only to appropriate local actors. A survivor who has not actually watched the animal never inherits another person's memory.

### Dialogue: The actual survivor party talks

Two actual living, capable, **colocated** survivors, outside active combat, may opt into either:

- `talk pc-2 check-in`: a brief actual check-in, grounded in the teammate's health and Stress condition.
- `talk pc-2 plan`: discuss the currently **committed** stage of the rescue objective: restore power, send distress, or activate the helipad beacon.

These conversations are authored **narrative choices** between characters who already exist. They consume no dice or exploration time, do **not** treat wounds or heal Stress, and are not generative NPC dialogue or a completed Evolved social-conflict system. Each speaker/recipient/topic choice can occur once, recorded with the real zone and beat. Remote characters, dead/incapacitated companions, and characters in combat cannot participate; an invalid call rejects without state mutation. These choices work under the existing Party/Focus/Spectator action ownership rules: the AI policy is still bounded/offline and does not claim spontaneous full roleplaying.

### Engine, saves and privacy

`src/cinematic-encounters.mjs` defines the encounter and dialogue vocabulary plus pure availability and validation. The deterministic `partyStep` commits all world changes using existing mechanics; the browser only presents grounded local choices. **Party save schema remains v3.** Optional `wildlifeEncounter` (`present` / `withdrawn`, witnessed actors, attempted approach actors, withdrawal reason) and `dialogueRecords` are initialized in new incidents; previously saved incidents without either field remain valid and get the pre-encounter default. Saved forgery, invalid witnesses, duplicate dialogue and fictitious locations are rejected. No changes to the private rulebook, separate solo 006.2, Cloudflare Worker v006, generator/mission authority or the established individual Wonder journals.

## Verification and limits

Retain all **405** accepted automated tests. Add **19** focused cases in `tests/cinematic-encounters-008b3.test.mjs` for optional peaceful outcomes, genuine Mobility success/failure, noise and animal retreat, storm and predator credibility, witnessing/knowledge privacy, actual companion conversations, refusal of remote/duplicate interactions, old-save support, camera/mode compatibility and browser imports; **424 total**.

CI and GitHub Pages must pass on the final accepted `main` commit. **Manual desktop/mobile graphical smoke remains outstanding**: there has not been a verified live click-through of encounters, dialogue, all three control modes and save/reload.

**Scope boundary:** This is a substantive **008-B3 playable scene slice**, not the complete campaign engine: fully generated Game Mother/NPC conversations, multiple developed human NPCs, more physical herbivore species, complete edition-accurate published encounter/danger procedures, 007-M finite resources and a full multi-episode campaign remain future work. No Zoo Tycoon-style island management is required.

**Next:** Combine these validated pieces into a fuller first Cinematic episode with richer player-responsive endings and original human NPC dialogue while integrating suitable 007-M equipment costs. Preserve a genuine rhythm of wonder, action, tension, relief and uncertainty; no forced scare after every beautiful scene.
