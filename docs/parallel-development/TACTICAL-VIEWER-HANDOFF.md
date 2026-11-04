# Level-2 SVG Tactical Viewer — Integration Director Handoff

**Date:** 2026-11-04  
**Owner direction:** Approved standalone visual prototype. Adopt the visual approach in the RPG, adapting to its current architecture.  
**Tracking:** [Integrator issue #117](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/issues/117)  
**Reference implementation:** [`prototypes/tactical-viewer-v2.html`](../../prototypes/tactical-viewer-v2.html) (single-file HTML/CSS/JS; reference only).

## Nonnegotiable distinction: this is a TEST DEMO

The owner explicitly does **not** want direct directional movement controls in the finished RPG. The prototype's **WASD / arrow keys** and **click empty map to move** exist *only* to allow manual testing of map LOS, fog, light and memory in isolation. **Remove these in actual game integration.** No drag-to-move or token teleportation either. Let the established narrative/action interface submit intentions to the engine; render committed results back into the map. A single click on a character token can select it; **double-click** centers that character visually. Pan/zoom/center must never mutate rules/game state.

This file is **not** a finished gameplay feature, an accepted roadmap milestone, an authoritative physical-world model, or a prompt to merge code as-is. The integrated viewer will require architecture, CSS and data-contract changes.

## Design direction approved by owner

- Atmospheric, legible **top-down Level 2** VTT/minimap: simple but attractive SVG vectors, reusable geometry and token silhouettes; no external art library or asset catalog.
- Show players and environment positions, approximate relative scale when warranted, walls, foliage, doors, cover, fences, lights, vehicles and threats **that the observing characters actually know about**.
- Obstacle/line-of-sight occlusion, flashlights and light pools, fog of war, remembered explored spaces and uncertain/lost contacts; preserve dinosaur horror instead of offering a total-information tactical overlay.
- Floating and side controls should be compact/minimizable. Collapse map help and legend; allow hiding optional panels.
- Camera: wheel/buttons/pinch zoom, drag pan, Fit view, Center selected survivor, and double-click any visible survivor token to center that survivor. Make mobile/touch usable.
- Keep text/narrative the primary play affordance; the map is helpful reference, not a tactical game that replaces Evolved mechanics.

## Integration architecture

**Current main:** single-player `src/app.mjs` already renders a seven-node SVG **zone graph**, not scaled encounter geometry. Party UI `src/party-app.mjs` has actor camera/control selection and player-view projections but no equivalent full scene VTT. `src/dinosaur-visibility.mjs` describes authored zone sightlines; `docs/DINOSAUR-SPATIAL-007L1.md` and `docs/DINOSAUR-LIGHT-STEALTH-007K.md` govern accepted visibility/light/cover state. **Do not override these established mechanics** with the prototype's approximate pixel ray caster.

Recommended adaptation:
1. Define a typed, **read-only tactical presentation model** derived from existing per-observer view data: visible and known map nodes/geometry, known actor tokens, confirmed or uncertain threats, cover, light state, scene metadata, optional ground-truth scale when the engine actually defines it.
2. Build an independent `SVG viewer` module usable in Party, Focus/Character and Spectator modes. Give it scene and camera config; have it raise only presentation events (selection, focus, zoom) or a nonauthoritative UI *intent* for an engine action — never secretly commit an action.
3. Scene geometry may be generated from versioned adventure definitions or a procedural generator, but ground truth must remain in deterministic engine. Until actual continuous geometry/scale exists, render a clear zone schematic or declared approximate layout, **not invented tactical distances** or rules-meaningful LOS.
4. Use the engine's authorized **player projection** for every observer. Separate survivors should not see one another's uncommunicated observations. The client must not receive/retain private Game Mother predator positions and show them merely under black SVG rectangles. Omniscient/debug reveal in the prototype must not be shipped as an ordinary user control.
5. Connect flashlight/floodlight display only to real equipment/battery/light, doors, weather and deliberate committed events. Pan/zoom/focus may not spend time, dice, action budget, battery, RNG or save mutations.
6. Preserve replay and current historical adventures/saves; do not rewrite old scenario definition fingerprints just to graft on geometry. Version optional **presentation data** where needed.

## Prototype-only buttons and assumptions to omit or constrain

- **REMOVE:** `relocate()` as a direct map input; `document.keydown` WASD/arrow movement; map `click` movement.
- **REMOVE from production player controls:** `Advance predator`, simulated sensor ping, forced fog reveal/omniscience, arbitrary toggles that alter player physics independent of committed game actions.
- **REPLACE:** static `hardPolys`, `plantPolys`, preset 1000×640 yard, sample survivor/predator positions, mock clock/log with generated/authored projection and real narrative events.
- **ADAPT:** LOS raycasting, lighting masks and persistent explored history to game knowledge rules. The prototype's raycaster is a *visual demonstration*, not source-verified Evolved mechanics; respect the existing authored room graph and future physical geometry.
- **PRESERVE visually:** token styling/silhouettes, soft light/shadow presentation, fog layers, collapsible legend/help/panels, map controls and center-on-double-click.

## Acceptance and regression plan

- Compare at least two structurally distinct adventures; ensure no hardcoded compound dependency. Test every control mode and separated observers, including spectator camera changes.
- Verify a hidden predator has no player-visible token, DOM metadata or accurate coordinate leak; lost contact uses only previously obtained *and appropriately permitted* knowledge.
- Test flashlight off/on, battery exhaustion, doors/occlusion, cover, darkness and weather events through **actual engine commits**. Visual representation must never grant new mechanical sight, attack targets or range.
- Test viewer-only pan, zoom, token selection and double-click centering cause **zero** differences to action budget, RNG, journal, resource clocks, characters or saves.
- Desktop/mobile/touch smoke: pinch, drag, click/selection vs pan, centered token double-click, collapsible controls, keyboard and screen-reader equivalents, reduced-motion preference, focus visibility. Check accidental map-click relocation cannot happen.
- Maintain `npm test`, current regression baselines, accepted historical saves and no hidden state leakage. Integrator to perform exact merged-main Actions/Pages validation as required.
- Do not revise `site-progress.json` / 38% accepted score for a handoff or partially implemented renderer; roadmap and queue changes must be reviewed under existing governance.

## Original demo verification

The standalone prototype's regression suite was re-run in Chromium in the original conversation on 2026-11-04 (movement memory, solid obstacle blocking, visibility layers, debug bounds, uncertain ping, reset, no JS exceptions, zero outgoing network requests, no mobile horizontal overflow). These tests validate **demo behavior only**, not integration or engine semantics.

This review-only branch intentionally changes **no production engine, party UI, worker, roadmap acceptance, or historical save data**. Merge the prototype source only if useful as a maintained reference, then dispatch separate implementation PR(s) when ready.
