# Checkpoint 007-F — Live Initiative and Combat Action Economy

**Date:** October 22, 2026  
**Rule authority:** the user's private *Alien RPG — Evolved Edition* PDF, printed **Combat & Initiative pp. 59–61**, **Close Combat pp. 62–63**, **Ranged Combat pp. 64–66**, **Damage pp. 67–71**. The underlying dinosaur, character names, source code, and game prose are original.

## Implemented in the playable party incident

**Encounter transition.** Exploration continues in the existing shared party sequence. If the map-tracked velociraptor detects an exposed living survivor in its zone, the engine records contact, resolves the previously implemented opposed Observation/panic effects, and **starts combat**. The animal no longer makes an unscheduled attack merely because its position overlaps a character at the end of an exploration action.

**Actual initiative cards.** Every exposed participant in the dinosaur's zone draws a distinct seeded numbered card from 1–10. The Velociraptor has **Speed 2**, receiving two cards and two scheduled turns per combat round. Survivors and raptor turns are ordered by card; when the last card resolves, the engine redraws initiative and resets survivor action budgets. Creature turns execute as individually logged, deterministic AI-owned actions, never as free damage rolled on unrelated player actions.

**Human action budgets.** A survivor may take **one full action plus one quick action**, in either order, **or two quick actions**. A third quick action or second full action is rejected before any dice, movement, RNG or permanent state change occurs. Movement, item pick-up, transfer, and prepared watch are quick; attacks, first aid, close searching, equipment operations, and concealment are full. **End Combat Turn** gives up remaining budget without a roll. Multiple eligible actions can occur during one human initiative turn, with the turn passing automatically when its budget is exhausted.

**Defensive interruption.** **Stand Watch** uses a quick action to reserve the survivor's readiness to dodge. If attacked before exhausting their remaining quick budget, they can automatically spend that reserved quick action for a trained, stress-bearing Mobility defense against the raptor's d6 attack. The reservation is attached to the actor and physically consumes the budget; an unprepared survivor receives no free dodge. This is a deliberately bounded computer/UI alternative to asking an interactive human to declare an interrupt after the AI has selected an attack, but before it rolls.

**Control modes and camera.** Party controls all playable survivor initiative turns; the creature's turns execute via the computer even in Party mode. Character mode controls only the selected survivor, and spectator mode controls all survivors. Both AI survivors and the raptor use the **same initiative schedule** and underlying state mutations. Spectator **Step** resolves one scheduled human or creature action, not a whole round; changing focus/camera/mode does not spend time, redraw a card or advance the schedule. A paused Spectator Mode stops dinosaur as well as survivor autoplay.

**Persistent combat state.** Current round, sorted cards, initiative index, each participating character's budget, and recent round history are stored under optional `combat` in the existing party schema version 3. Old v3 saves **without** combat data load unchanged; v2 party saves continue through their previous migration. Ended encounters return to exploration without creating duplicate creature turns. Malformed cards and impossible budgets fail validation.

**Separated clock.** Combat rounds are accounted in approximate **10-second** units only when a scheduled round completes. Exploration stretches remain approximately **10 minutes per completed party group action cycle** and never increase merely because five cards were played in combat. Older party saves acquire optional `clock` metadata only when they next commit an action; earlier recorded world events and RNG draws are not replayed.

## Exact source fidelity versus local design decisions

| Rule area | Current implementation | Scope |
| --- | --- | --- |
| Numbered initiative | Unique 1–10 cards, new draw per combat round | Implemented |
| Creature multiple turns | Raptor gets two cards for Speed 2 | Implemented |
| Full and quick actions | Full + quick (any order), or two quick; no unused carryover | Implemented |
| Movement | One connected room/zone for one quick action | Implemented; existing 7-zone map |
| Defending with a quick interrupt | Prepared watch authorizes and pays for a Mobility dodge | Implemented with automatic preauthorization; explicit player choice remains pending |
| Initiative holding/swap | Not yet supported | Deferred |
| Surprise and ambush priority | No automatic first-card ambush handling yet | Deferred |
| Action budget after partial interruptions | Reserved defense deducted; out-of-turn dodge confirmation UI not yet available | Partial |
| Two clocks | ~10s combat rounds vs ~10m exploration party cycles | Implemented approximations |
| Dinosaur movement and combat tactics | Two actual attack/search turns in present zone; no full cross-zone chase initiative routine | Partial, original dinosaur behavior |
| Full Evolved injuries and lethal timing | Existing abbreviated D66 injuries, first aid and partial panic | Deferred to 007-G |
| Complete character talents | Existing tested talent hooks; real source-equivalent world-dependent effects remain incomplete | Deferred |

This milestone is **not** a claim of complete Evolved RAW. Combat rounds intentionally use a simple physical room/zone model and a prepared-defense policy; the rulebook has additional initiative switching, surprise, attack, cover, injury and interrupted reaction procedures. The earlier 007-E model did not yet make multiple rounds or dinosaur speed actionable; 007-F does.

## Regression and compatibility gates

- `src/combat-turns.mjs`: combat-state authority for drawn order, human budgets and remaining initiative.
- `src/party-engine.mjs`: combat start, scheduled velociraptor attack, logged world consequences, actor action costs and phase return.
- `src/party-director.mjs`: AI owner selection for dinosaur slots; user focus and spectator step remain deterministic.
- `src/party-app.mjs`, `party.html`, `src/party.css`: initiative card/round display, remaining human actions, End Combat Turn, combat seconds and action availability.
- `tests/combat-turns.test.mjs`: 17 new tests including seeded card sequencing, Speed 2, both legal action combinations, exhausted action rejection, reserved dodge, camera/control changes, spectator stepping and old-save compatibility. Previous scenario and world tests remain, including source-corrected injury tests that now wait for the raptor's actual initiative.
- **184 total automated Node tests** expected after integration. GitHub CI, not this document, is the authority for passing status. Browser-level manual testing remains separate.

**Next milestone (007-G):** implement detailed D66 injury-specific lasting effects, scheduled death rolls, medical stabilization and surgery, recovery time and full panic interruptions; then expand surprise/ambush/initiative holds and richer dinosaur tactics. Preserve all control modes and old saves throughout.
