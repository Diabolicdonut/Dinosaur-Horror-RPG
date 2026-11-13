# DHR-078 / MEDIA-01 — Mother/GM approved ambience registry (2026-11-09)

**Source of selection:** user-uploaded `Ambience(2).xlsx`, worksheet `Ambience`, four columns `ns1:title2`, `ns1:album`, `ns1:trackNum`, and `Use`. There are **400** rows across RPG Ambiences Vol. 1–8, **94** with literal `Yes` and **306** with literal `No`. The list is a **positive allowlist**; no `No` or unknown track can become eligible through fuzzy matching or GM prompts.

**Actual media cross-check:** the user-connected Dropbox `/Projects/Dinosaur Horror RPG/Audio/Ambience` contains all **94/94** approved files by exact `Michael Ghelfi - RPG Ambiences Vol. N - NN Title.ogg` filename (verified via live Dropbox folder listing on 2026-11-09). The directory also contains numerous unapproved .ogg files, including a separate Vol. 9; folder existence is **not** permission to use those. The spreadsheet contains **titles and selections, not playback URLs**.

## Implementation

- `media/ambience-approved.v1.json`: versioned 94-row allowlist, exact album/track/filename, useful inferred soundscape tags, conservatively inferred mood intensity, audio gain and fades, flags for potentially audible dinosaur/monster cues. `loop: unchecked` reflects that seamless looping was not personally listened to and verified. `approved` means **approved by the user for the private game's ambience selection**, **not** verified public streaming/distribution rights.
- `src/ambience-director.mjs`: pure `createAmbienceRegistry`, `proposeAmbienceCue`, `playbackDirective`, `mockPlayback`. No external network calls, file copying, raw URLs, provider tokens, engine state mutation or implicit audio playback.
- `tests/ambience-director-dhr078.test.mjs`: counts, default-deny, known good environment cues, muted/silent beats, audible-creature restrictions, repeated narration, source-consistent modes, malformed/hostile metadata, missing asset, ducking and fade proposals.

## Producer / GM contract

Supply a **trusted, sanitized, committed player-observable scene projection**, e.g.:

```js
import {createAmbienceRegistry, proposeAmbienceCue, playbackDirective} from './src/ambience-director.mjs';
const registry = createAmbienceRegistry(manifest); // fetch private-use, versioned JSON
const scene = {
  committed:true, biome:'jungle', weather:'clear', timeOfDay:'day',
  context:'open', mood:'normal', audibleCreatureCue:false
};
const cue = proposeAmbienceCue(registry, {scene, previousTrackId:null});
const directive = playbackDirective(cue,{volume:0.35,muted:false,narrating:false});
```

**Source authority:** `committed:true` is a contract assertion by the trusted presentation projector, not a security seal. The browser must never form this scene from inaccessible GM data or player-entered arbitrary JSON. Client-only boolean `audibleCreatureCue` cannot authenticate a server-side secret; trusted engine must project it only after an actually committed, player-audible cue. The adapter intentionally does **not** read raw danger/creature plans even if extra fields were mistakenly passed.

**Director behavior:** low-volume *Jungle* (Vol. 3 #04) as a daylight/quiet default; nighttime *Jungle Nighttime* (Vol. 4 #22); wet-jungle *Jungle Rain* (Vol. 3 #06); and *Jungle Campfire* (Vol. 3 #05) for camp scenes. Rain heard from inside favors *Rain (Interior Perspective)* (Vol. 7 #36). GM may request only an approved `trackId`, which must also be locally plausible. Dinosaur/monster-explicit beds are suppressed without committed public audible creature evidence. Quiet beats, muted audio, unsupported scenes and media failures may all remain **silent**. Continuous scene beds return `hold` rather than restarting after each narration turn. Playback directives propose bounded gain, roughly 3.5-second transitions, and `-8dB` narration ducking; they do not alter turn pacing or trigger music. `loopRequested` never implies a verified seamless loop. This is general-purpose across Party/Focus/Spectator.

**Rejected sound:** previously disliked noisy howling-wind *Abandoned Shack* ambience is forbidden irrespective of its file presence and not in the allowlist.

## Rights and private Dropbox boundaries

Michael Ghelfi's recordings remain in the user's Dropbox; **no sound recordings, cover art, streaming tokens, share links or temporary URLs** are committed to GitHub. Rights to stream from a public GitHub Pages site or redistribute these recordings are **not yet verified**, so the manifest declares `licenseStatus:not-verified-for-public-streaming`. Approved here means selection for private gameplay only, subject to any applicable creator terms. Never convert a Dropbox preview web address into an audio stream by assumption.

The future trusted asset resolver should map an exact approved **`assetKey`/filename** to a short-lived playable media handle (or local authorized object) **after authorization**. Dropbox content/download URLs often require auth or face cross-origin and range/seek restrictions; do not send an API token to browser scripts, persist signed URLs in the repository, expose an unrestricted proxy, or assume the browser supports those URLs. Validate Ogg playback/looping, fades, mute/volume, mobile autoplay gesture requirements, content-type/CORS/Range, actual audio loudness and intended scene mood before live promotion.

## Delivery boundary

This PR is an isolated, testable **catalog/schema/selection and mock-playback** slice of issue #131. It does **not** play sounds in the current Party/Hub UI, connect Dropbox OAuth, ship music or effects libraries, perform browser listening QA, alter save compatibility or change gameplay/adventure revisions. Future UI integration should use this adapter in the central presentation projector after the Hub/Map integration, while all player controls remain functional without any audio. Accepted roadmap stays **21 gates, 38/100** until full media acceptance. Follow the existing branch/PR review and integration policy.
