# 009-R2 — Dinosaur Horror RPG Adventure Hub and Presentation Roadmap
**Status:** Approved for development, not accepted gameplay · **Date:** 2026-11-09 · **Roadmap:** 21 gates, 100 points, 38 accepted · **Source:** user-supplied standalone `Dinosaur_Horror_Adventure_Hub_Cinematic(1).html` (~3.3 MB) and approved gameplay interface reference screenshots. The prototype file is **not committed by this documentation PR**. New worker chats need the actual file attached for exact visual fidelity.

## Product vision and screen flow

The game opens on a cinematic **Adventure Operations Terminal**, never drops straight into an incident unless the player deliberately chooses Continue. Navigation has Home/Continue, Adventures, Campaigns, Saved Games, Character Manager, Settings. The default view has a scrollable scenario-card row, featured full-width scenario image and source-safe premise, configurable adventure settings, party setup, and an explicit Begin Adventure → briefing → Enter Adventure path. Four illustrated survivors is the default visual layout; 1–8 remain supported in the underlying Evolved character rules. Scenario cards are browsable even when not yet implemented, but only compiled runtime adventures are Start-enabled.

The gameplay view uses an approximately 45% narrative/command left column and 55% Map + portrait/vitals right column. There are three right-side modes: normal Map above portraits; expanded Map with portraits collapsed; and optional large cinematic still replacing both. The Map is a Level-2 SVG tactical display (read-only, lightweight VTT) with camera follow/double-click centering, pan/zoom, lighting, line of sight, and fog. No directional arrow movement or click-to-move actions—gameplay movement and inventory changes stay natural language. Portrait clicks open detailed character sheet/inventory. Compact waveform pacing suggests Evolved Stress; color suggests current Health. Neither stylized BPM nor zero Health implies death; flatline only on confirmed fatal engine outcome. All details must honor the selected observer's legitimate knowledge.

## The supplied prototype: inventory and integration cautions

The supplied self-contained HTML has an embedded seven-image `SCENE_ART` map, seven scenario examples (After the Storm, Long Count, Tidal Nursery, Research B, Paddock Breach, Lost Convoy, Custom Adventure), several 4-person illustrative casts, six navigation tabs, editable preview attributes, three display modes, length/seed/weather/tone/audio/cinema preferences, a simulated generator, final briefing, settings, and up to 60 isolated demo save records with import/export. It includes responsive CSS with 1510/1130/770/450px breakpoints and is ~3.3 MB due mainly to inline JPEG art. No paid network API or actual RPG engine is called.

These are **prototype demonstrations**, not gameplay truth:
- Prototype scenario IDs (`storm`, `count`, `tidal`, etc.) are not engine adventure IDs; use only `src/adventure-catalog.mjs` and validated compiled manifests as the source of launchable choices. Research B, Paddock Breach, Lost Convoy and generated previews need playable/adapted content before being startable.
- Prototype `state.config.mode==='character'` maps to engine `focus`, and selecting a portrait/camera must not silently change control ownership.
- Prototype's four-character limit and simplified (1–5) attribute preview are not the actual 1–8 survivor, 12-skill/talent/equipment Evolved character validation. Existing Character Lab is authoritative.
- Prototype saves use `dhrpg_hub_demo_v1_*` localStorage and a `dinosaur-horror-hub-demo` JSON wrapper; **do not deserialize these as Party saves** or modify legacy `dinosaur-party-incident-007c` state without explicit migration. Existing Party UI currently warns new adventure can replace the live Party save; the production hub must present an explicit save/overwrite/slot decision.
- The custom generator is only deterministic local mock text, not a manifest compiler; no genuine unvalidated adventure starts. Build eventual procedural experiences through adventure-definition compile/validator and trusted hidden-state boundary.
- Image rendering, character portrait generation, and Dropbox audio are optional media paths; never use hidden GM facts, emit a media event as a gameplay action, leak API keys, or automatically bill one image per narration update.
- Preserve image-art rights and loading performance; the 3.3 MB inline-image demo is suitable for evaluation, not a settled optimization strategy for GitHub Pages.

## Formal Gate 19 — Adventure Hub / launch / saves (4 points, Planned)
**UI-01 [DHR-073 / #126]:** Import visual reference into maintainable shell, build exact real adventure-catalog adapter; preview-only cards remain non-launchable. Responsive keyboard/touch UI; never break historical index/party/characters entrypoints.
**UI-02 [DHR-074 / #127]:** Typed launch contract (manifest ID/revision, seed, valid roster, mode/focus ownership), optional start settings that preserve scenario rules. Briefing and explicit save-before-restart. Four is a default, not maximum.
**UI-03 [DHR-075 / #128]:** Validated multi-slot save archive; migration-safe import/export, continue, manual/autosave, explicit deletion and no silent overwrites. Maintain old keys/save fingerprints and local privacy. Cloud save synchronization is not a prerequisite.
**Acceptance:** End-to-end launch/load for all current real scenarios, all three modes, historic saves, custom party variants, accessibility, safe generated-preview handling, and mobile/desktop manual test evidence.

## Formal Gate 20 — Map / vitals / scene imagery (3 points, Planned)
**UI-04 [DHR-076 / #129]:** Incorporate approved SVG viewer after handoff PR #118. Read-only layer consumes public projection, not raw source secrets; no invalid object markers or invented measurement.
**UI-05 [DHR-077 / #130]:** Compact Health/Stress waveform, optional portrait row, character sheet/inventory detail. Character health/status from Evolved accepted state, not normalized fake 100-point bars.
**MEDIA-02 [DHR-079 / #132] image slice:** From a committed scene, display cached/approved optional cinematic still in place of Map/portraits, return to Map and restore focus. Do not expose undiscovered animals.
**Acceptance:** Deterministic observer-projection tests, map/portrait/scene toggle, LOS/fog/redaction, pan/zoom/fullscreen and responsive/keyboard access, replay-compatible state. Mock image endpoint tests plus authorized manual check when available.

## Formal Gate 21 — Audio / optional cinematic playback (2 points, Planned)
**MEDIA-01 [DHR-078 / #131]:** Curated descriptive asset manifest for user's connected Dropbox folders, source licensing, tags for mood/intensity/location/species/loop/levels, approved/rejected status. Exclude howling wind abandoned-shack ambience. Event-aligned mixer permits silence/duck/fade and low quiet jungle bed. GM proposes catalog IDs, never arbitrary files or raw URLs.
**MEDIA-02 [DHR-079 / #132] later FMV slice:** Optional skippable full-screen prepared video library with rights/compatibility checks; preserve deterministic state and interruptibility; absence of a clip must not block the scene.
**Acceptance:** Sound cue trigger/no-threat-leak tests, stable volume/mute handling, layered audio fallback/silence, media loading failure, and actual browser compatibility test. Video support can be phased but the acceptance gate is not credited early.

## Shared integration architecture and ownership

- The deterministic Evolved engine owns physics, dice, action economy, health, inventory and versioned saves.
- The Game Mother interprets natural-language intent and proposes **bounded source-allowed** audio/image/cinematic requests; it never determines rules truth by media.
- A single player-visible presentation projector turns committed source state into sanitized `scene`, `visibleActors`, `visibleCreatures`, `healthStress`, `mapGeometry`, `permissions`, and optional `presentationCues`. Do not send raw GM secret plans to rendering modules.
- The UI shell owns layout and launch; Map renderer owns SVG; portrait component owns status; sound adapter owns playback; cinematic director owns media switching. **One integrator alone** edits conflicting central `party.html`, `src/party-app.mjs` or layout CSS.
- Preserve old entrypoints; new `hub.html`/replacement default entry may be proposed only after explicit migration and deep-link smoke coverage.

## Phase plan and operational acceptance

**Phase 0 (now):** 009-R2 scope, queue and tests; identify prototype as input, not merged code.
**Phase 1 (parallel):** DHR-073 Hub catalog shell; DHR-077 pure portrait/vitals component; DHR-078 curated audio schema. No more than four simultaneously conflicting developer chats.
**Phase 2:** DHR-074 launch validation and DHR-075 multi-slot save archive after shell; DHR-076 Map after approved viewer handoff and shell.
**Phase 3:** DHR-079 still-image director; audio controller playback; later optional FMV without blocking campaign delivery.
**Phase 4:** real browser desktop/mobile, accessibility, 3 control modes, both new/historical Party saves and varied adventures, offline and Worker failures, source-visible spoiler tests.

**Fixed score:** 38 accepted + 62 incomplete = 100. Gate 19=4, Gate 20=3, Gate 21=2; nine points moved exclusively from incomplete previous gates 7, 8, 9, 10, 12, 14, 15, 17 and 18 (each -1), with no changes to their acceptance criteria. No prototype, doc, partial task, or approved artistic design independently earns roadmap points. The historical six accepted gates retain all 38 points.
