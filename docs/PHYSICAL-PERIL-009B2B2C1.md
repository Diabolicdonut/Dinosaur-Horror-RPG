# 009-B2b2c1 — Source Evolved Peril and Physical Companion Aid

**Purpose:** Provide a real but optional injury risk in the second adventure without forcing predator encounters or undermining source rules.

The adventure manifest's optional `perils` array declares the real room, real creature ID (authored present there), selected skill, bounded modifier, attack dice, base damage, and optional seeded variant that must truly have been chosen by the adventure compiler. The generic peril service validates those typed facts and checks current creature and survivor positions plus prior attempts. Only an explicit `danger <id>` action spends time and rolls the original `resolveSkillCheck`. A failed evasion permits the original `applyCreatureAttack` engine to make an independent attack roll, armor/damage and critical-injury outcome; it does not guarantee a hit. Results flow through the existing `enrichInjuries` and research Party state. Duplicate attempts are rejected. No new predator is silently created or moved. Source `resolveClinicalAid` and `resolveRally` are permitted only to colocated living injured teammates and use normal Evolved seeded rolls.

**Version history:** Rev1–3 remain immutable and valid; new research starts bind rev4 with the single conditional peril. Existing Nublar, rescue, critical injury and Party control paths are not modified.

**Verification:** 547 regression target, +14 from 533 accepted. Final PR #32 and merged-main Actions/Pages required before acceptance. No manual graphical QA, full autonomous animal turns, true independent human NPCs or complete critical-injury time advancement yet; do not claim their completion.

## Accepted GitHub evidence

[PR #32](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/32) exact validated head `4425acd1e561ab700ea67db01eda626436d557a1` passed 547/547; source main `631daf8f185656e57a5056660b9370bdc6d65e67` independently passed [Actions 40263956091](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40263956091) and [Pages 40263955789](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40263955789). No hands-on browser smoke, autonomous predator pursuit, full injury-clock or generated Cinematic/Campaign features are claimed.
