# 009-D1 — Independent adventure gameplay and source-bound Party runtime

**Acceptance:** Verified 2026-10-28. Source PR #59 exact head `acd3afd694a891d9f51ea1ad0837dbfcf481d026` [Actions 40702638677](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40702638677) 657/657; independently merged main `fc4a8ca085b32905f75b673f544ffe0f813395b0` [Actions 40703031919](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40703031919) 657/657; [Pages 40703030381](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/40703030381) SUCCESS. Manual graphical testing outstanding; 38/100 unchanged.

**Scope:** Scenario separation and second original playable adventure, not NPC combat,
unlimited procedural generation or complete Evolved rules parity.

## Recovered baseline

2026-10-28 main `c9291f61d2942cc00b4d2518a0d296e5f2048fe5`,
game **009-C5 / v0.7.37**, **650 automated tests**, independently green Actions
`40605928701` and Pages `40605928105`. Current approved roadmap:
**18 gates, 38/100 earned points**, distinct from 5/8 first-playable.

## Implemented boundary

- The catalog includes a separate, original `tidal-nursery` revision 1
  adventure, *The Tidal Nursery*. Four physically connected locations,
  three causally ordered field objectives, one neutral Parasaurolophus,
  real Evolved Observation/Comtech checks, and a peaceful research ending.
  Each seed fixes one of two physical obstacles: spring tide (source-authored
  Mobility passage modifier) or corroded radio (Comtech objective modifier).
  Neither variant adds a predator or a compulsory fight.
- The standalone Party runtime resolves **the selected manifest's** rooms,
  exits, stock, item labels, objectives, initial creatures, flags and save
  fingerprint, rather than looking up *The Long Count* singleton. The
  adventure catalog, not hardcoded scenario-name conditionals, routes
  creation, save validation, views and steps. The companion route planner
  likewise uses the chosen source-defined physical map.
- *The Long Count* revision 1–12 immutable sources and its current revision
  13 remain precisely routed through their previous bindings; the Nublar
  legacy incident retains its dedicated implementation. Older saved games
  are not silently migrated into *The Tidal Nursery*.
- The UI offers the new adventure explicitly and uses general field-mission
  labels instead of calling every non-Long-Count scenario a rescue.
- New tests cover seed choice, source integrity, physical movement,
  nonmandatory wildlife encounter, actual objective checks, quiet completion,
  forged identity/stock/location rejection, Party/Focus/Spectator agency,
  and legacy adventure preservation.

## Remaining boundary / limitations

This is **not** a universal Evolved engine: the Nublar prototype still has
several hardcoded mechanical/location cases; new manifests use the bounded
standalone adventure runtime. The new peaceful scenario is a second engine
test rather than several fully developed Cinematic adventures or procedurally
generated campaigns. Predator combat and supported NPC autonomy still exist
in the Long Count path and were not extended by this checkpoint. No
graphical desktop/mobile QA or Worker redeployment is claimed.

The 18-gate overall roadmap remains **38%** and the foundation **5/8**:
the `scenario-independence` and `authored-replayability` gates remain
**partial**. Only full acceptance of a weighted gate can earn points.

## Validation

Automated regression suite passed **657/657** on exact source PR head and independently merged main. GitHub Pages succeeded. The new seven tests establish source and save compatibility, but real desktop/mobile browser smoke remains outstanding.
