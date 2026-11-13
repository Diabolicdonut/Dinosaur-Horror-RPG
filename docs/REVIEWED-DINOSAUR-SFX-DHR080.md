# DHR-080 — Reviewed dinosaur effects and deterministic audio cue proposals

**Status:** independent implementation for review; not yet in live Party, Worker, or accepted Gate 21. Follows issue #138. Existing accepted checkpoint **009-D2 / v0.7.39 / 21 gates / 38 of 100** is unchanged.

## Why this module exists

The user maintains audio-review spreadsheets in Dropbox. The input starter collection contains **605 source rows**, of which **293 are approved** (94 ambience, 38 music, 147 Acrocanthosaurus SFX and 14 TheropodMedium shared SFX). The Acrocanthosaurus approved rows have descriptive notes, while the shared effects have no descriptions yet. These are interpretation aids for choosing plausible sound, **not a verified dinosaur emotion/behavior dataset**. Leave missing durations/annotations unknown, never guess them.

The currently proposed Cloudflare audio bridge in PR #137 can stream chosen paths but selects species effects by `seed % files.length`. This pure adapter implements a separate **reviewed-metadata-to-cue recommendation** seam without entering the browser/Worker or changing existing playback before its dependency is accepted.

## Source trust and data handling

1. Keep editable workbooks and **compiled audio metadata private in Dropbox**. Do **not** publish them or private Dropbox sharing links in GitHub. Do not upload copyrighted recordings.
2. In an authenticated server-side refresh job, parse the worksheets, honor **Use=Yes** exactly, preserve individual source workbook/sheet/row and exact validated Dropbox relative filename. Build `dhr.audio-cue-catalog.v1`; the optional `intentTags` must be reviewer-approved, not inferred as objective dinosaur biology.
3. **Do not pass the raw compiled catalog to the browser.** Load on the Cloudflare Worker with a bounded cache and a separate exact-path allowlist derived from the current approved authenticated inventory. Before a stream, re-check the media gateway's existing strict allowlist.
4. The pure `createReviewedSfxRegistry(manifest,{authorizedPaths})` requires `policy.defaultDeny` and `includeOnlyUseYes`, exact approved count, legitimate SFX file path, matching species folder and basename, unique ID/path, real source provenance, and allowlisted path. Unsupported fields, URLs, credentials, malformed tags and duplicate identities fail closed. Other media kinds remain owned by the ambience and music controllers. Approved Acro/SFX paths are not broadly published in repository source.
5. Never treat a browser-provided `committed:true` as proof. Only the trusted server-side engine/projector may construct the player-audible event. The `proposeReviewedSfxCue` adapter checks `committed`, `playerAudible`, `eventType:'creature-sound'`, an exact species/group and reviewed or description-supported intent, but **does not authenticate events itself**. Hidden predator plans, sight-only contact and player text are not sound evidence.
6. The same event ID yields `hold`; recent cues are excluded to avoid incessant reuse. Selection is deterministic independent of manifest order and gameplay control mode; no RNG, save changes or separate dice rolls. The module can return silence if no suitable sound exists.
7. Unknown species, unapproved metadata, mismatched explicit GM cue requests, unclassified sound effects or unknown intents yield silence. Explicit `sharedGroup` may admit group effects, never implicit species substitution.
8. Return only `cueId`, Worker-relative `assetKey`, a small distance gain, a capped stop time and a replay event ID. Repeat-pattern effects are **not looped** and are limited to a 4.5-second first excerpt pending manual audition/segment tagging; unknown durations use a conservative 8-second stop cap. This adapter does not normalize raw audio loudness, which requires listening QA.

## Example: trusted, sanitized caller

```js
import {createReviewedSfxRegistry,proposeReviewedSfxCue}
  from './src/reviewed-sfx-director.mjs';

const approvedPaths = new Set(serverVerifiedApprovedPaths);
const registry = createReviewedSfxRegistry(privateCompiledManifest,
  {authorizedPaths:approvedPaths});

const event = trustedCommittedPresentationEvent; // NOT client-supplied
const proposal = proposeReviewedSfxCue(registry,{
  event:{
    committed:true,
    playerAudible:true,
    eventType:'creature-sound',
    eventId:event.id,
    species:event.audibleSpecies,
    sharedGroup:event.explicitSharedSoundGroup,
    intent:event.reviewedIntent,
    distance:event.perceivedDistance
  },
  recentCueIds:sessionAudioHistory,
  lastEventId:lastPlayedEventId,
  settings:playerAudioSettings
});
// If proposal.type==='sfx', have Worker authorize and sign assetKey again.
// Do not pass Dropbox API tokens, raw share URLs or raw worksheet content.
```

## Outstanding integration dependencies and QA

- **PR #136**: selected 94/400 ambience registry (and quiet jungle baseline).
- **PR #137**: `GAME_TOKEN` Cloudflare Worker-protected Dropbox streaming; configure `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET` and `DROPBOX_REFRESH_TOKEN` in the deployed Worker after authorized Dropbox OAuth. A GitHub PR is not live deployment.
- **DHR-080 live follow-up**: Worker-private catalog fetch/cache/refresh, binding reviewed SFX IDs to signing endpoint, event projection from actual committed game events, repeat excerpt auditioning, and real end-to-end playback. Do not replace PR #137's existing seed chooser until this adapter is proven and approved.
- **Browser acceptance**: desktop/mobile autoplay permission and Ogg/MP3/WAV, Range 206, multi-effect overlap, volume/crossfade, no-threat-leak, muted/quiet, expected loudness, saved-adventure compatibility. Audio failure must never stall the game.
- Creator-specific licences for Michael Ghelfi and game-derived audio still require review. Existing public Dropbox sharing links are not protected by the Worker until revoked separately.

**Acceptance:** focused pure-module tests + exact-head `npm test` and syntax CI; no main merge, no milestone percentage change until Integration Director review and production QA.
