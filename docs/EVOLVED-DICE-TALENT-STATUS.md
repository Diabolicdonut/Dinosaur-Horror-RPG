# Checkpoint 007-B — Evolved dice, stress and career-talent implementation status

**Date:** 2026-10-22
**Primary authority:** the user's private *Alien RPG — Evolved Edition* PDF; **Using Skills** pp. 42–44, **Career Talents** pp. 48–51, **Stress and Panic** pp. 72–73. Source code contains original instructions/identifiers and original Jurassic Park career/talent text, not copied rulebook prose.

**Scope:** The independent `src/evolved-checks.mjs` module and Field Assessment panel on `characters.html` implement a reproducible *mechanics laboratory*. They do not replace the live checkpoint 006.2 dinosaur game. Every action and result still needs world-state validation and actor-ID integration before it becomes an in-game effect.

## Mechanically implemented, independently tested

| Evolved rule / case | Implemented behavior |
| --- | --- |
| Basic check | Attribute + trained skill, or untrained attribute + 0 skill, with separately recorded base d6 and stress d6 |
| Die results | Six contributes one success, more sixes grant extra successes, one or more stress-die ones trigger one stress response for that check |
| Difficulty / help / gear | Caller-supplied signed base-dice modifier and 0–3 helpers; minimum one ordinary die, stress pool not affected by difficulty |
| Switching attributes | Check may use an explicitly supplied attribute, including documented career-talent alternatives |
| Pushing | Eligible non-six faces reroll; existing sixes kept; +1 stress and one extra stress die (or +2 for an active Jumpy response); initial stress die 1 prevents pushing, as do passive checks and Deflated; eligible career talent allows a second push |
| Resolve | Stress response roll = d6 + stress − Resolve, with enduring results and conditional response penalties; repeated response yields additional stress; the highest result negates success even when a six occurred |
| Passive checks | Can include stress dice as success opportunities but cannot trigger stress responses or be pushed |
| Opposed checks | Both actors roll their own seeded skill tests; active side needs strictly more successes; a tie does not count as active success |
| Panic | Independent d6 + stress − Resolve result with classified response and preserved actor state; real-world panic movement, item loss, environmental effects, turn skipping and trauma **NOT yet applied** |
| Cinematic story point | An explicitly earned/held story point can turn one base die into a 6, before or after a pushed check; use decrements existing point without introducing another RNG draw |
| Deterministic replay | Individual per-die faces, push rerolls, response die, seeds and results reproducible; source character is not modified in place |

**Security/logic boundary:** The caller currently supplies task context, helpers, target model and modifiers directly in the isolated lab. In a playable game they must be independently authorized from the real scene, equipment, actor time budget, NPC/dinosaur knowledge, and Evolved-specific eligibility; no AI-requested modifier is inherently authoritative.

## Initial career talent effects

The adapted career data provides **27 selectable original Jurassic Park talent names**. Each is paired with its source mechanical role in `TALENT_MECHANICS`. The following descriptions identify what is actually executed now.

### Active effects in the check/sandbox module

- **Park Ranger:** Experienced Tracker (active-search Observation bonus), Safe Restraint (grapple Close Combat bonus), Park Authority (Command substitution and bonus for authority appeals).
- **InGen Representative:** Negotiator (Wits + Manipulation substitution).
- **Young Visitor:** Hard to Catch (Mobility dodge bonus), Quick Reflexes (second Agility-based push), with Unlikely Fortune reserved for injury/death mechanics.
- **Field Medic:** Emergency Treatment (first-aid bonus), Trauma Specialist (surgery bonus). Recovery Care returns an appropriate nursing-duration multiplier but does not yet shorten a real healing clock.
- **Operations Supervisor:** Keep It Together (rally bonus), Rapid Orders returns quick action cost (scheduler not yet active), Chain of Command models extra stress on a properly authorized rank-order check (an actual subordinate-order target is not yet simulated).
- **Pilot:** Emergency Maneuver (piloting acceleration bonus), Familiar Controls (vehicle-specific bonus **only when character has an explicit matching model**; picker not yet available), Risk Taker (optional voluntary stress before check).
- **Maintenance:** Last Push (second Strength push), Steady Hands (omit up to two stress dice without reducing full stress used for effects), Resilient Worker (no-push Strength damage-mitigation roll).
- **Scientist:** Persistent Inquiry (second Wits push). Field Analysis and Species Insight await actual scene-grounded research/creature knowledge and consequences.
- **Tactical Response:** Steady Under Fire (enhanced safe-rest stress reduction for a nearby group), Careful Aim returns ammo-supply reduction for later supply mechanics, Combat Focus marks special panic combat behavior without driving a combat scheduler.

### Not yet active as complete world effects

**Tactical:** Combat Focus's compulsory attacks/behavior, Careful Aim's actual ammunition depletion. **Corporate:** Corporate Access's conditional item grant, Personal Contingency's opponent redirection. **Visitor:** Unlikely Fortune's death/critical injury choice. **Medic:** Recovery Care's calendar application. **Supervisor:** Rapid Orders' actual action scheduling and Chain of Command's real NPC obedience constraints. **Pilot:** Familiar Controls specialty selection in character creator. **Scientist:** Field Analysis's discovery, companions' stress changes and Species Insight's one-per-creature weakness revelation. All other scenario-dependent effects require a validated real world state, equipment and action economy.

**Do not advertise all 27 talents as fully playable merely because their metadata exists.** The module has useful working talent effects and test contracts; final implementations must be phased in once the supporting world subsystems exist.

## UI and developer verification

- **Character Lab:** `characters.html`, `src/characters-app.mjs` and `src/characters.css` contain a Field Assessment section. Select actor, skill, supported context, stress, modifier, push count and seed. Test check is deterministic. Reveal the recorded dice only with the opt-in debug checkbox.
- **Non-mutation:** Testing mechanics does not change the saved character or incident; the returned `after` actor is a simulation result that may be committed later by a validated world engine.
- **Testing:** `tests/evolved-checks.test.mjs` covers dice replay, limits, pushing, stress response/Resolve, talent bonus scopes, panic classification, damage-reduction, rest, story points, and opposed checks, alongside all prior regression suites.
- **No external dependency or Cloudflare Worker update** needed for this frontend-only standalone lab.

## Next gate

1. Implement full per-actor runtime character state and validate at least one Evolved mechanical action within a separately versioned party incident.
2. Add injury/armor/supply recovery and action scheduler, enabling the currently deferred career talents to operate on actual objects and characters.
3. Integrate generated parties, Player/Focus/Spectator ownership, and knowledge-bounded AI actors only after rule-authoritative event commits are tested.
4. Maintain save migration and original game regression suites; do not silently overwrite old saves.

**This is an executable check-and-talent foundation, not yet an Evolved RAW-complete survival simulation.**
