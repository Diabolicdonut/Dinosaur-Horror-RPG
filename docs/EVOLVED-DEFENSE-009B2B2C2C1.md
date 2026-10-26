# 009-B2b2c2c1 — Evolved predator reaction interruption

**Source-bound mechanics:** Initial predator still must exist under fixed authored seed and patrol within the physically connected room graph. Passive detection and source numbered initiative determine whether the animal actually has an opening strike. Rev7 defers that strike only if warranted; no injury happens before the threatened actor chooses `react defend` or `react decline`. Defend invokes existing Evolved Close Combat versus creature attack, while declining accepts the attack without a reaction. Both are deterministic from stored attack and defense seeds. The correct character receives the interruption even after the normal roster cursor advances. Explicit choice is supported in Party, Focus and Spectator AI. A valid resolved attack consumes ten combat seconds, not another exploration beat.

**Historical authority:** The exact original Rev6 is immutable `adventures/ridge-survey-rev6.mjs`; no previously saved incident acquires new reaction prompts. Rev7 gets this new reaction choice. Source validation covers actual actor/room/predator, seed-bounded threat eligibility, event beat and historical reaction/clock counts.

**Limit:** Not full 10-second multi-turn source combat, adversary pursuit/attacks outside the opening threat, clinical progression across combat rounds, weapon inventory combat or general-purpose NPC AI.

**Testing:** 572 older cases preserved, eleven new = 583. Exact PR, main Actions and Pages must be green before acceptance; manual graphical testing is outstanding.
