# Checkpoint 007-J — Map-Constrained Dinosaur Pursuit, Sound and Low-Light Stealth

**Date:** 2026-10-23. **Development authority:** current GitHub `main` recovered at accepted Checkpoint 007-I (`e5dcd0f34d9163ed9479a8bba6a614899c4c048d`). **Rules inspiration:** the privately uploaded *Alien RPG — Evolved Edition*, especially the stealth/detection, group observation, hiding, darkness, and active search sections on printed pp. 55–58. The park sound-propagation model and velociraptor hearing statistics are **original gameplay design**, not claims of Evolved RAW or a transcription of its creatures.

## New playable mechanics

**Physical tracking and pursuit.** The animal retains a durable sound-source memory (`lastHeard`), a temporary alert level, and its physical location. At exploration patrol intervals, it may follow the shortest legal path **one connected zone at a time** toward the last audible source. On losing interest, it may resume deterministic patrolling. The predator does **not** teleport, update its target from hidden character coordinates, or always know where a fleeing player went.

**Locked maintenance barrier.** The reinforced staff-card door between `utility` and `shed` remains secured. An unaided velociraptor cannot traverse it in either direction, even when sound from behind it is audible. `creatureRoute` supports an explicit future `shedDoorBreached` flag; ordinary play does not silently breach the door. The same barrier **attenuates** sound by two additional zone-distance units; other map exits use normal one-unit attenuation. Both routing and sound calculations use the authored seven-room graph, not geometric name guesses. These are intentionally simplified spatial abstractions.

**Quiet movement.** Players may issue `sneak to [connected room]`, `creep to...`, or `move silently to...`, or select **Sneak to...** next to the regular travel buttons. A real Mobility check determines success. A success produces no travel noise; failure creates noise that can be followed if audible. A previously concealed survivor preserves their concealment only after a successful quiet move into a location with usable cover. Ordinary travel is noisier but quicker in combat: `move` costs one quick action and `sneak` costs a full action. All routes and the staff-card door are still checked by the original authoritative party engine. The same local decisions are available to autonomous party characters.

**Darkness and carried lighting.** The storm-darkened `jungle`, `paddock`, and `helipad` have a dim-light penalty of two Observation dice on human group detection. `control`, `lobby` and `shed` remain partly lit, and `utility` has operating fluorescent strips. A character's own carried flashlight or headlamp offsets the penalty **only for that character**; the creature's pool is unchanged. The character's scene reports local lighting without exposing hidden predator information. As in the source rulebook, group detection uses the best individual observation result rather than pooling everyone's successes.

**Audible warning rather than omniscience.** If the dinosaur changes rooms and passes close enough to a living survivor, that survivor can receive an actor-private footstep event. It does not name the dinosaur's hidden location or reveal the warning to distant companions. It uses the same sound barriers and current zone graph as the pursuit model.

**Modes, clocks, consequences.** Party/Character/Spectator mode ownership, human defensive declarations, surprise, initiative, full/quick budgets, source-grounded injuries and clocks, medical care and fixed camera selection remain unchanged. A newly supported move is an actual accepted actor action with the same deterministic random stream and world clock as other decisions.

## Files and validation

- `src/dinosaur-pursuit.mjs` — authored lighting map, real legal creature exits, BFS pursuit route, weighted sound reach, hearing and light helpers.
- `src/party-engine.mjs` — audible-source memory and alert, connected predator movement, per-actor sound warnings, dark-zone group detection, valid sneak action and personal-light scene projection.
- `src/combat-turns.mjs` — sneaking uses a full action rather than a quick move during combat.
- `src/party-director.mjs` — computer survivors favor stealth movement through outdoor exposed park zones, using only their own publicly known current scene and route.
- `party.html` and `src/party-app.mjs` — 007-J browser revision, ordinary/quiet movement controls and local darkness status.
- `tests/dinosaur-pursuit.test.mjs` — **16 new tests** for barrier traversal, attenuated sound, legal stepwise pursuit, success and failure on quiet movement, character-specific darkness, local audio warnings, no hidden-world location leakage, old saves and spectator mode.
- Existing **241 tests retained; 257 Node tests passing** at the implementation checkpoint. GitHub Actions validation and Pages deployment of the final audit/head commit are separate release acceptance gates.

## Compatibility

No changes to the version 3 party save requirement. New predator `lastHeardBeat` metadata is optional, and older saves with only `lastHeard` and `alert` are still legal. The 007-C v2-to-v3 migration, all original party states, the separate singleton solo 006.2 game, and the external Cloudflare Worker remain untouched. No API keys or Worker deployment required.

## Known limits / next milestone

This is a **bounded seven-zone dinosaur hearing and pursuit system** rather than complete Evolved stealth-mode procedure. It does not yet simulate deliberate aiming/turning of flashlights, variable sightlines, an exact five-to-ten-minute hide-search action schedule, weather-specific audio beyond the authored attenuation, species-specific scent and vision, animal door-breaking, realistic barriers, ammunition, or attacks during a cross-zone chase. The reinforced shed door has no creature break-action in this milestone. The bounded AI director still does not converse or improvise unmodeled actions.

**Next recommended checkpoint 007-K:** introduce explicit environmental light sources and flashlight toggles, timed stealth and predator searching by zone, group movement visibility/noise tradeoffs, then expanded species-specific chase/attack tactics, while retaining current deterministic traces and save compatibility.
