# UI-01 Production Adventure Hub shell — 2026-11-09

**State:** Proposed PR, not an accepted roadmap gate. The original cinematic prototype remains unchanged at \`prototypes/Dinosaur_Horror_Adventure_Hub_Cinematic.html\`. No change to gameplay version \`0.7.39\` or the approved **38/100** accepted score.

## Delivered shell

- \`hub.html\` is a dedicated, responsive Adventure Operations Terminal matching the approved dark-green / gold, horizontally browsable scenario cards, large cinematic featured image, right-side configuration panel and four-slot portrait composition.
- The seven **exact supplied JPEG stills** are extracted into \`assets/hub/{storm,count,tidal,research,breach,convoy,custom}.jpg\`. These are local user-provided prototype media; the public standalone reference continues to hold its originals.
- \`src/hub-app.mjs\` renders exclusively from \`listHubScenarios()\` (and \`resolveHubLaunchScenario()\` for validating selectable cards). It never imports adventure secret-bearing compiled packages into presentation objects, implements in-browser generation or treats prototype ID aliases as real game IDs.
- Only **After the Storm**, **The Long Count**, and **The Tidal Nursery** are playable in the current Party Engine. Research B, Paddock Breach, The Lost Convoy and Custom Adventure are clearly marked **preview-only**. Preview cards may be inspected, never launched.
- Navigation exposes Home / Continue, Adventures, Campaigns, Saved Games, Character Manager and Settings. Campaigns are honestly disabled until a persistent engine exists.
- Existing \`index.html\`, \`party.html\`, and \`characters.html\` remain functional at their old URLs with new cross-links to \`hub.html\`. No redirects or changes to the accepted Party engine.
- Saved Games only checks whether the existing \`dinosaur-party-incident-007c\` key is present; it does **not** parse, migrate or rewrite saves. The Party Engine remains responsible for load validation and legacy upgrades.

## Explicit limits and integration handoff

**This is the UI-01 shell, not UI-02/03.** The right-side mode/length/seed/atmosphere/conditions fields are visible configuration previews, **not** arguments passed into real scenarios. Four visual slots do **not** limit Evolved's true roster size. Open Party Engine is the only live-game link; players must select and explicitly start a scenario inside \`party.html\`. No silent save overwrite or demo fake generator. The Home shell is not yet the default \`index.html\` landing page; replacing the existing URL awaits a separately tested migration and preserved deep links.

Next:
1. **UI-02 / #127**: typed briefing + launch contract with explicit scenario/revision/seed/roster/mode and overwrite-safe start; wire actual Hub controls to Party initialization. Add appropriate focus ownership and 1–8 survivor support.
2. **UI-03 / #128**: multi-slot versioned save/archive migration with historical save acceptance, never import \`dhrpg_hub_demo_v1_*\` as real Party state.
3. **UI-04, UI-05 and MEDIA**: integrate observer-safe SVG map, compact Evolved waveform vitals/portraits, carefully curated audio and optionally cinematic stills/FMV only through trusted committed world-state projections.

## Verification

\`tests/adventure-hub-catalog.test.mjs\` (existing) and \`tests/hub-production-ui-01.test.mjs\` (new) enforce catalog identity, concept lockdown, presence of original JPEG media, no local save mutation, valid navigation/links, and safe art-path mapping. Acceptance still requires GitHub Actions \`npm test\` and real desktop/mobile browser smoke, including source secrecy and historical Party saves. This document does **not** certify manual visual QA.
