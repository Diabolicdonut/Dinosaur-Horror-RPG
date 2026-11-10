# Dinosaur Horror RPG — private Cloudflare Worker to Dropbox audio bridge

**Work in review, not yet deployed.** This is the follow-up to the 94/400 approved ambience registry (DHR-078 / PR #136), replacing the earlier per-browser Dropbox-link import. Source branch may be integrated only through the normal reviewed PR + CI process. Do not claim live success without a real Cloudflare deployment and listening test.

## Why Worker-side Dropbox OAuth

The user's connected Dropbox has `/Projects/Dinosaur Horror RPG/Audio/` with `Ambience`, `Music` and `Sound Effects`. The earlier user-generated catalog of 15,255 raw sharing links (450 ambience, 38 music and 14,767 effects) is still useful as an inventory but **no longer needed for live streaming**. The new Worker fetches original Dropbox files by fixed server-side path, protected by an OAuth refresh token in Cloudflare encrypted secrets. It does not publish a single `rlkey`, refresh token, OAuth access token or audio byte file in GitHub or game saves.

### Required Cloudflare setup — once per Worker

Create or authorize a Dropbox API application with **Full Dropbox** file permissions (or otherwise grant genuine read access to the existing `/Projects/Dinosaur Horror RPG/Audio/` folder), request **offline access**, and enable **`files.content.read`** and **`files.metadata.read`**. Configure these secrets directly on the already-existing `dinosaur-rpg` Cloudflare Worker, **never in GitHub**:

- `DROPBOX_APP_KEY` — Dropbox app key.
- `DROPBOX_APP_SECRET` — Dropbox app secret.
- `DROPBOX_REFRESH_TOKEN` — long-lived offline refresh token from user authorization.

The already-deployed `GAME_TOKEN` remains required and is also used as a keyed HMAC secret to mint narrowly scoped, short-lived (~20 minute) playback grants. This is a private single-player gateway, **not** an invitation to place `GAME_TOKEN` or another permanent credential into playback URLs. Rotating the GAME_TOKEN invalidates existing signed URLs and the old client token. `OPENAI_API_KEY` is not needed for audio playback, but remains required by the existing AI routes. Leave the existing `GM_LIMITER` binding and `GM_REQUIRE_LIMITER=true` in place; requests to mint or select audio are separately rate-limited and fail closed if that binding is missing.

Because the public repo cannot configure your Cloudflare account, this PR alone does not install credentials or prove working Dropbox access. The previously connected Dropbox plugin in ChatGPT is **not** the same OAuth connection as Cloudflare Workers.

### Endpoints

- `GET /v1/media/status`, `GET /v1/media/library`: require existing `Authorization: Bearer GAME_TOKEN`, expose only readiness/configuration flags and the public approved asset names. The readiness result intentionally does **not** claim a successful real audio download.
- `POST /v1/media/sign` with `{"path":"Ambience/Michael Ghelfi - RPG Ambiences Vol. 3 - 04 Jungle.ogg"}` or a selected approved music path. Requires Bearer auth; emits a Worker URL signed with HMAC, exact asset path and expiry. All 306 explicitly rejected ambience tracks remain denied. Music uses 38 known named tracks.
- `POST /v1/media/effect` with `{"species":"Velociraptor","seed":1234}` requires Bearer auth. The Worker reads that species' real Dropbox folder metadata, rejects entries outside the published 119 known folders and sampled audio formats, chooses a deterministic indexed file and mints its URL. This supports the 14,767 user-supplied creature effects without placing thousands of private links in the repo. File naming alone does not identify exactly what vocalization or action each recording represents. The user intends to refine those classifications later.
- `GET /v1/media/stream?path=...&exp=...&sig=...`: verifies an unexpired HMAC grant and strict allowlist before fetching from the fixed Dropbox root. Returns a streamed audio body with `Content-Type`, `Content-Length`, `Content-Range`, `Accept-Ranges` and inline disposition as applicable, forwarding one validated byte `Range` header to the Dropbox content-download endpoint. It never buffers complete recordings in Worker memory, and returns sanitized upstream errors. The signed URL is a **temporary bearer capability**, so it must not be logged or intentionally shared. The audio files themselves remain streamable to any party temporarily holding that signed URL; this is not DRM.

### Browser experience

The real `party.html` shows a compact **Mother / Game Master · Audio** panel. The player enters the *existing* GAME_TOKEN (or reuses the explicit remember-token opt-in from the game's main page), presses **Enable audio**, and hears one of the 94 approved ambience tracks as the engine's **observer-visible committed scene** changes. There are separate music, effects and ambience sliders, mute, sparse event music, species effect preview and optional automatic creature cues. No user Dropbox credentials, link CSV import, Dropbox folder paths, scenario hidden plans or raw private media URL list enters the browser.

The browser requests a signed Worker stream per cue, plays in a regular HTML `Audio` element with two-bed crossfade, and renews an active bed before a 20-minute grant expires. Audio failure never blocks game actions or modifies saved turns, dice, events or versioned adventures. A user gesture is required to unlock playback on some mobile browsers; use **Enable audio** again if permission is blocked after asynchronous first sign. An imported local Dropbox catalog from an earlier prototype is no longer used or needed by the integrated game.

### Security and operational limits

1. **Do not publish the original 15,255 Dropbox URLs or existing `Dinosaur_Horror_Audio_Demo_Complete_15255(1).html`** on the public GitHub Pages site; it contains live sharing keys. Verify whether those previous Dropbox shares were public. Even when the Worker hides new links, old anyone-with-link URLs remain accessible until revoked in Dropbox. For the strongest protection, revoke those old public links **after** OAuth streaming is verified.
2. The Worker's CORS allowlist is browser hygiene, not authentication. Require Bearer tokens for minting, short expiry/HMAC signatures for streams, strict filename/folder allowlists and Cloudflare account-side rate-limit/WAF controls. No Worker can prevent a fully authorized browser user from saving streamed sound bytes.
3. Test real Dropbox OAuth refresh, path access, actual Ogg/MP3/WAV content-type, HTTP `206` range replay/seek, mobile autoplay behavior, Android and desktop listening, volume/crossfade, simulated network loss and Cloudflare traffic/bandwidth costs. GitHub Actions CI uses stubbed Dropbox API responses and cannot verify live media.
4. Michael Ghelfi recordings, game-franchise-derived creature SFX and music remain subject to their own permissions. User-owned copies and a private project are not automatically licensed for public distribution. Do not publish the original recordings or share URLs in a public repo or public media bucket without rights.
5. The Cloudflare Git production pipeline must be checked on the **exact merged `main` commit**. A successful GitHub Actions/Pages run does not prove the Cloudflare Worker itself deployed. Existing GM gateway secrets/settings and historical save fingerprints must remain untouched.

## Test contract

`tests/worker-private-dropbox-audio.test.mjs` covers allowlisted paths, missing auth, rejected origin, HMAC issue/tamper/replay/expiration, Worker-only URL, no secret leaks, dropped unknown species, source path stability, OAuth token request, metadata filtering, byte-range 206 and 429/503 conditions. Existing `tests/party-live-dropbox-audio.test.mjs` and `tests/ambience-director-dhr078.test.mjs` exercise quiet/narrative scene choices, category selection and browser interface contracts. Run full `npm test` and syntax checks on the PR head; separately verify desktop/mobile behavior before merge.

**Accepted roadmap remains 21 gates / 38/100**; this media integration cannot earn acceptance until completed and independently validated.
