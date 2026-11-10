# LIVE-01 — Dropbox audio playback on actual Party game

**Status:** proposed implementation in stacked PR after DHR-078 / #136. **Not merged or deployed.** This bridge is a browser playback enhancement only; no game-state/save/Worker permissions, physics, dice, or scenario revisions change.

## User-approved sources

- The user marked 94 of 400 Michael Ghelfi RPG Ambiences Vol. 1–8 selections as **Yes** in `Ambience(2).xlsx`; the others are excluded.
- The user's existing `Dinosaur_Horror_Audio_Demo_Complete_15255(1).html` contains a `<script id="seed-data" type="application/json">` array of exactly 15,255 `[relative_path,raw_dropbox_link]` entries: 450 ambience, 38 music, 14,767 creature effects. All 94 approved ambience filenames matched Dropbox and the prior catalog.
- Source audio URLs contain Dropbox sharing link tokens. **Do not commit/export these to GitHub Pages.** The existing catalog is imported *once by the local player* through the live Party interface and stored in IndexedDB on that device. Private link keys never enter exported game saves, GM prompts, public repository contents, cloud services controlled by this project, or the game's localStorage. Music and species choices are available after importing the full library.

## Player flow

1. Open the real GitHub Pages `party.html` after integration/deployment.
2. Under **Mother / Game Master · Audio**, click **Import existing Dropbox links** and select `Dinosaur_Horror_Audio_Demo_Complete_15255(1).html`, or a compatible JSON/CSV audio link export. No new link generation is necessary.
3. The UI reports imported counts (expected: 94 ambience, 38 music, 14,767 effects). Select **Enable audio** once to satisfy autoplay gesture policies. Set ambience/music/effect volume, mute, and whether optional event music and effects should play.
4. The game then changes ambience using the already-rendered `partyView` observer projection, crossfades at environmental changes, retains the same bed on repeat narration, triggers sparse event music, and samples creature effects only after a source-visible danger event. Optional dropdowns enable manual track and creature preview.
5. The browser remembers the catalog across visits in IndexedDB. Another browser/device needs its own one-time import. **Forget local links** clears this browser's catalog, not the Dropbox source.

The audio adapter accepts only actual approved ambience filenames and valid `https://www.dropbox.com/scl/fi/...` or supported legacy raw `/s/` links. Music filenames are limited to `Music/*.mp3` and effects to `Sound Effects/<species>/<file>.wav` (or other listed supported audio extensions). No arbitrary remote hosts, javascript: URLs, secrets, or user-entered names can become playback sources. The existing 306 rejected ambience tracks and all unapproved extra ambience never enter the local playable library. The previously rejected howling-wind Abandoned Shack track remains excluded.

## Source authority and limitation

The Media controller consumes the **player-visible** `partyView` projection; it never reads private GM data. It does not infer live dinosaur sounds from remote sightings; automatic creature SFX requires a current danger event and a creature present in the observer-visible scene. The 14,767 numbered creature files are *not semantically classified* by attack, walking, injury or death: until the user updates the effect annotations, generic folder-based sound choice is a provisional approximation, and auto-SFX can be toggled off.

The ambience rules remain deterministic and no automatic persistent music loop is forced on the player. Original audio files stay in Dropbox. Playback uses HTMLAudioElement rather than Web Audio to avoid cross-origin media decoding restrictions, with two ambience elements for short crossfades, one music element and two effect elements. Failure to fetch a Dropbox URL, blocked autoplay, CORS, format incompatibility or offline conditions leave gameplay usable.

## Validation required before claiming LIVE

- PR-head `npm test` plus CI syntax checks and positive import/cue tests.
- GitHub integration review of both stacked PRs (DHR-078 #136, this bridge). Do not squash into `main` without reviewing conflicts with Adventure Hub #135.
- **Real manual browser validation still required**: Chrome/Firefox/Safari, Android/iOS user gesture, Dropbox URL redirect/audio headers/seek/range/format, switching scenarios, silent room, speaker mute, import persistence and deleting local catalog. Cross-device import is a deliberate privacy requirement; no server proxy, secret OAuth tokens, or irreversible link exposure.
- Rights of any creator-supplied soundtrack and dinosaur effects for public distribution/streaming remain to be verified; a public repository must never contain the actual audio or share-link tokens.

**Acceptance score unchanged:** 21 roadmap gates / 38 of 100 points; this PR is not accepted gameplay and is not yet deployed. Do not close #131 until integration is independently verified.
