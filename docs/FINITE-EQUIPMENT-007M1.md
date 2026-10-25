# Checkpoint 007-M1 — Finite Replacement Lamp Cells

**Date:** October 25, 2026. **Accepted baseline:** 008-C1, v0.7.19, commit `de72f0e9ef0e885ae512f6d89a60bcb1144486a8`, **440/440** tests and successful accepted main Actions and Pages. This is a small original scenario equipment extension, retaining private *Alien RPG Evolved Edition* skill, stress, time, light and predator mechanics; no unverified claim of source-rule battery procedures.

## Why this is a game decision

The accepted party game already starts with a carried flashlight and respects **finite lamp charge** as the actual exploration clock advances: active light improves perception but exposes visible users to a physical Velociraptor. Previously a drained lamp could not be repowered. This milestone adds precisely **two physical sealed replacement cells**, with meaningful scarcity and actual transport.

- One cell is held in the **Maintenance Shed** alongside already-authored tools and medical gear.
- One cell is in the **Emergency Helipad** supply crate area.
- A survivor must enter the relevant real room and **take battery_cell** through the ordinary item-pickup/turn rules. Physical `give battery_cell to pc-N` uses the already-validated, same-room item transfer. Cells do not teleport between parties or locations.
- A player can choose **Replace lamp battery** (or type `battery replace`, `replace battery`, `swap battery`, `reload flashlight` / `reload headlamp`) when actually carrying a flashlight/headlamp, at least one spare cell, and a lamp with **less than maximum charge**. The action costs a normal exploration turn and can advance the real Velociraptor's physically bounded world tick; it is not a source-rules skill roll or forced scare.
- A legal replacement **removes exactly one cell from inventory permanently**, refills to the original `LIGHT_CAPACITY_STRETCHES` maximum, and leaves the lamp **OFF**, so switching it on requires a separate legitimate action. No free visibility or stealth.
- Replacing an already full lamp, trying without an owned light/cell, carrying no reserve, and swapping during active combat are prohibited and rejected without changing the world. There is no recharging infrastructure in this first bounded resource step.

The browser shows **only a viewed actor's personal carried spare count**, their established lamp charge and the optional replace button. It does **not** reveal the hidden/remote map stock or teammates' off-camera resources.

## Item accounting, persistence and mechanical fidelity

The accepted `inventory` and `rooms[].items` data store the same stable `battery_cell` object ID as other authored items. New party-v3 incidents have an optional `batterySpent:0` counter, incremented only on a committed battery replacement. A pure resource checker bounds **physical floor stock + all held cells + consumed cells at two** for saved incidents, including old saves without the new counter; a forged 3rd cell/illegal spent count fails validation. No new save schema version. Old saved incidents with no new cell stock or `batterySpent` remain valid and do not magically gain off-map replacement cells. Existing light legacy-fallback semantics, medical clocks and 008-A–008-C1 scene continuity remain unchanged.

**Limit:** This uses two identical item IDs, not unique per-cell serial identities. Conservation of the *total* quantity is validated, while tracking of each cell's unique physical history is an optional later refinement. No weapon ammunition, additional consumables, chemical exposure, dynamic ecology, alien rules reinterpretation, forced horror or island management was introduced.

## Verification

Retain the **440** accepted prior tests. Add **14** focused cases in `tests/finite-batteries-007m1.test.mjs` for physical spawn/pickup, one-use consumption, restored maximum, preserved lamp-off status, exhausted resources, no duplicate use, rejecting unnecessary swaps, restricting nonlamp survivors, same-room transfer, preventing remote transfer, using both cells exactly once, forged-quantity save rejection, old saves and camera-mode privacy, and browser/parser wiring. **454 total**. The initial PR candidate run [40162021440](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40162021440) passed **454/454**. Separate final-PR-head and accepted-main Actions and Pages validations are required. Real desktop/mobile browser graphical smoke is **still outstanding**, not claimed completed.

**Next:** 007-M2 can add additional *scenario-authored* finite physical tools and meaningful repairs with real cost and Evolved checks, or pivot to 007-N typed natural-language Game Mother for better actual RPG play. Do not require whole-island population, ecosystem or hotel management.
