# Rules baseline — proof of concept 001

## Sources and intent

Primary inspiration: the user's privately supplied *Alien RPG — Core Rulebook* (Free League), a personal-use scanned PDF. Supporting reference: *Year Zero Mini* v1.1, Matt Kay / 3 Skulls Pub (2026), particularly its d6 dice pools, success-on-six, narrative consequences, and simple attribute design.

**Important:** this code is a compact hybrid prototype, not rules-as-written for either source. Its exact mechanics are enumerated below so they can be audited and replaced safely after closer manual rulebook comparison.

## Implemented (engine source is authoritative)

| Subsystem | Prototype rule |
| --- | --- |
| Character | Four attributes: Strength 3, Agility 4, Wits 4, Empathy 2. Four fixed skills. |
| Skill checks | Roll attribute + skill six-sided dice. Any 6 = success. |
| Stress | Roll additional d6 equal to current stress; their 6s count as success, their 1s trigger panic. |
| Panic | Roll 1d6 + current stress. At 6+, stress increases and noise is generated. At 9+, the current task fails, even if successes were rolled. |
| Push | Prefix a check action with `push`. If the first roll fails, add 1 stress and reroll nonsuccessful base dice plus the new stress pool. One push maximum per command. |
| Health | 4 starting health, 2 lost on failed raptor evasion. Medkit restores 2, capped at 4. |
| Dinosaur | One persistent raptor, 1 graph edge movement per time-consuming action. Noise of 2 is audible one edge away; noise 3 two edges away. Targeted pursuit and otherwise rare patrol. Shared-location contact can cause an evasion check and injuries. |
| Exploration | Seven connected rooms; free descriptive actions, time-consuming movement/use/hide/item pickup, access-card gating, inventory persisted. |
| Campaign objective | Keycard → generator → distress transmission → helipad beacon = escape. |
| Replay | Xorshift32 seed stored in every save. Every game action deterministic with stored state, including attack resolution. |
| Visibility | View projection does not expose the dinosaur unless in the same room. |
| AI boundary | The optional AI translates into a small action vocabulary and may narrate committed events; it cannot roll or modify world state. |

## Missing / deliberately noncanonical

Alien RPG's complete character creation, skill catalog, talents, full signature attacks, wounds, critical injury table, survival supply dice, initiative, stealth modes, stress and panic tables, vehicles, encumbrance, downtime and campaign advancement are **not implemented**.

The prototype's rule for 9+ panic negating a check, the simplified chase/evasion, and the 4-health pool are **house rules**, not a claim about the source game's official rules. Dinosaur behavior is designed for game tension rather than paleontological certainty.

## Quality gates

Automated `node --test` covers rules reproducibility, scene visibility boundaries, locked passages, item persistence, save restoration, legal actions, pushed rolls, and escape conditions.

The initial checks do **not** establish that a full non-assisted campaign can be won with every seed. Manual browser QA and scenario-balance tests remain next steps.

## Next improvements

1. Perform a browser smoke test with a real browser, including mobile viewport and reload.
2. Compare the official Alien stress/push/panic mechanics to the handwritten prototype implementation; revise with deviations recorded.
3. Introduce perception rules for visibility, wind/scent, lighting, distance and line-of-sight rather than using room adjacency alone.
4. Expand encounter attacks, wound and escape procedures, and predator AI state machine.
5. Replace all franchise-specific scenario data with generic original assets for a distributable version.

## Reference preservation

Do not commit either copyrighted rulebook PDF to this repository. Keep those sources in the user's private Library for reference only.
