# Checkpoint 009-B2b2b — Reusable Cinematic Scene Contract

## Data and safety
`AdventureDefinition.cinematic` is optional. A valid package has three ordered acts with cumulative unlocksAfter referencing actual authored objectives. Optional scene events specify an existing physical room, act, title, display text, bounded theme, optional source-defined creature ID, optional requirement for a living capable colocated teammate, optional real compiled variant ID. Unknown fields, invalid rooms and creatures, false variants and inconsistent acts are rejected in definition validation.

`src/adventure-cinematic.mjs` observes the validated AdventureInstance, committed objective records, current physical positions of actors and animals, current seeded facts, and prior voluntary scene history. It returns eligible scenes only to the local acting character; historical rev1/rev2 have no scenes. An accepted `scene <id>` is free, atomic, once-only and actor-owned, changes only the event/action/scene record, and leaves RNG/clock/turn/health/stress/items/animals unchanged. No objective or consequence is auto-committed by experiencing a scene. Eligibility never guarantees that an event will occur. The module has no Nublar-specific assumptions.

## First sample fixture
Research adventure revision 3 adds Setup, Tilt and Showdown with six optional scenic moments: living herd, empty blind, flooded-river dread (only when that variation is true), comparing ecological records with a colocated survivor, last look at a physically present herd, and a return-camp human choice. All remain optional and can be entirely skipped. The player's opportunity to take an event depends on where they go and what they actually complete.

## Test and acceptance
Existing 522 cases remain required; 11 new tests exercise the act progression/locked facts and voluntary event invariants for **533 total**. No manual desktop/mobile smoke has been performed. Full combat/medical danger mechanics for research, NPCs, unlimited procedural Cinematic scenes and Campaign episode generation remain separate milestones. Avoid describing this as finished Alien-style cinematic scenario generation or engine parity.

## Accepted GitHub evidence

[PR #30](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/30) candidate `4f8e8b962bf0849de54b4723499fe1380dcb8478` passed 533/533. Merged main source commit `e37a83bd25c568a9f5f0f9c9c10a58c7e23ce1f8` passed [Actions 40262285692](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40262285692) (533 passing, 0 failing) and [Pages 40262285718](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40262285718) successful. No actual graphical/mobile user journey or simulation of the creature danger/NPC/medical parity was completed. Next milestone is 009-B2b2c.
