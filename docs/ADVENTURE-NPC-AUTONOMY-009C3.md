# 009-C3 — Physically Grounded Supporting NPC Return

**Accepted — October 26, 2026** · Prior accepted **009-C2**, version **0.7.34**, **618/618** tests, verified main `020e3c97c33bf6b0ec68b38b1f876a1c30592710`.

## Purpose

Move one step beyond *static* adventure-defined NPCs without turning the experience into a zoo population simulator or overriding *Alien RPG Evolved Edition*. A cast member may independently choose to follow a **single authored physical goal** only after a **real prerequisite**, and their movement must be serializable, reproducible, and validated against the frozen original scenario revision. This is a reusable engine capability, not an adventure's hardcoded script.

## Data and source boundary

The optional `supportingCast[].autonomy` is a declarative `return_route`:
- `trigger` references a real, compiled, source-authored **objective**;
- `path` is a finite (2–12) simple room chain beginning at the character's initial physical location, with every step a legal two-way exit in the compiled physical map;
- `cadence` is one to four **completed exploration roster rounds** between possible physical steps;
- no programmable handler, teleport, dice formula, new NPC, predator spawn, arbitrary event, inventory edit, Story Point reward or scenario-dependent core rule is supported.

In *The Long Count* **revision 11**, Tomas Wren has a finite route from **Survey Ridge → Rocky Ascent → Canvas Research Camp**. He begins returning only once the **send-field-report** objective was actually completed by the player through the existing Evolved Comtech mechanics. He travels at most one adjacent zone per eligible roster round, and stops at camp. Leena Harrow continues her original stationary operations-coordinator duty.

## Deterministic replay, visibility and save safety

`src/adventure-supporting-cast.mjs` independently reconstructs all expected autonomous NPC moves from the compiled cast, actual objective records, survivor count and monotonically advancing exploration beats. Every accepted save must match **all** expected `npcAutonomyRecords` and final physical NPC locations exactly; inserting a move, leaving one out, changing its from/to, moving an NPC without an authored route, or advancing before the objective will invalidate the save. No RNG or Evolved roll is consumed by pure travel. Existing conversations retain their original physical location by the character's location at their **recorded beat**; a character walking later does not retroactively invalidate genuine earlier dialogue.

Only physically colocated player survivors receive arrival/departure narration. A remote player's projected scene does not include NPC positions or offscreen travel narration; an exported complete state remains inspectable as with earlier client-side versions.

Older *The Long Count* **revision 10** is frozen exactly as accepted in `adventures/ridge-survey-rev10.mjs`, and prior rev1–9 remain unchanged. Rev10 saves have no autonomy journal and maintain their previously stationary NPCs. The Nublar rescue, solo mode and Cloudflare Worker are out of scope.

## Deliberate limits

This implements **independent, objective-triggered route choice and actual physical travel**, not a generalized AI thinking/planning architecture. NPCs do **not** yet detect or flee predators, make Evolved checks, defend, suffer injuries, start combat, manage resources, hold independent turn initiative, negotiate with skill rolls, conceal secrets server-side, or decide arbitrary alternate routes. A following milestone should introduce perception-grounded threat responses and NPC combat under authentic Evolved rules before claiming complete independent survivor simulation.

The `npcAutonomyRecords` are checked against source conditions for **every roster round**, not simply accepted because a narrative line was generated. Retained past act/scene/encounter references are not modified or reinterpreted.

## Candidate verification

The source branch is `work/009-c3-npc-autonomy`, PR #48. Eight focused NPC autonomy tests plus the previous 618 tests = **626/626 accepted**: PR #48 head `bd44955ea05c871af1570e0ec85b2045f07978f8` Actions 40422528987 SUCCESS; independently merged source main `5c883577bb861f341d4e565d7c23498a5492d849` Actions 40422688451 SUCCESS and Pages 40422687402 SUCCESS. Manual graphical desktop/mobile gameplay testing remains outstanding.
