# Debugging, AI connectivity, and stored GAME_TOKEN — Checkpoint 004

## For the player

The browser now has an **AI connection status** that distinguishes:

- **AI DISABLED:** AI is switched off; deterministic commands still work.
- **TOKEN REQUIRED / TOKEN CHANGED:** enter a token and press **TEST AI CONNECTION**.
- **CONNECTING:** checking the Cloudflare Worker.
- **GATEWAY READY:** the Worker has accepted the GAME_TOKEN and reports an OpenAI key configured; **this does not yet prove that the OpenAI model is responding**.
- **OPENAI RESPONDING:** a genuine AI interpretation or narration request succeeded during this session.
- **AI REQUEST FAILED / AI NOT CONNECTED:** a specific network, authentication, version, or provider error has occurred; the deterministic game remains playable.

The new **TEST AI CONNECTION** button calls `GET https://dinosaur-rpg.diabolicdonut.workers.dev/v1/gm/status` with your GAME_TOKEN. This is an authenticated status check, not a billable model invocation. If it shows an HTTP 404, the *Worker* needs the updated code from `worker/index.mjs` pasted into the Cloudflare editor again. A successful status check requires the new Worker revision; the existing `/health` endpoint alone cannot validate a token.

The first successful model call upgrades the display to **OPENAI RESPONDING**. If a model call fails, the interface surfaces a failure and records the HTTP status and sanitized error; it does not pretend the connection is healthy.

## Remember token on this device

Tick **REMEMBER TOKEN ON THIS DEVICE**. The page saves your entered GAME_TOKEN in **this browser's localStorage**, under this site's origin, to survive reloads and future GitHub Pages site updates. It does **not** place it in public GitHub files, the HTML source, the game save or the debug download. The checkbox is deliberately not selected for first-time use.

To revoke local persistence, click **FORGET SAVED TOKEN** (also clears the input). Unchecking the remember box stops persistence but leaves the token available in the current input until you close/reload the page.

**Security:** localStorage is not encrypted and can be accessed by JavaScript running on the same origin. Only enable it on a trusted private device. If the device is shared or any site script is compromised, rotate GAME_TOKEN in Cloudflare. A static public HTML page cannot safely contain an embedded secret.

The enabled/disabled preference for AI also persists on the same device.

## Start, resume and recover

The app now **automatically reloads a compatible autosave** on page load rather than always resetting to turn 0 and showing the original introductory prompt. It shows a clear "Session resumed automatically" message and the recent authoritative event history. **NEW INCIDENT** explicitly resets the session. **LOAD** remains available manually.

Each submitted player command appears in the incident log with a `PLAYER` source marker so an ignored or failed command cannot be confused with repeated opening narrative.

## EXPORT SAVE vs EXPORT DEBUG

- **EXPORT SAVE:** the original game-state JSON for game restoration and reproduction; no GAME_TOKEN.
- **EXPORT DEBUG:** a separate timestamped `dinosaur-rpg-debug-turn-...json` download intended for identifying gameplay and AI failures. It contains the **complete current state** (including hidden dinosaur locations, seed, RNG state, inventory, flags, injuries and 250-item game event history), canonical scenario definitions, ruleset/version, 500-entry recent display transcript, up to 500 latest diagnostic events, browser origin/path/user agent, AI connection state, enabled/remembered flags, sanitized model request/response payloads and timing/HTTP errors.

Exports are generated locally in the browser, not uploaded anywhere. The debug file never includes the token or API key values; redaction also removes known key-format strings, bearer headers and secret-valued object fields. Nevertheless, debug exports can contain story spoilers and **any personal text you typed as player commands**, so review the file before sharing.

### Useful debugging sequence

1. Enable AI, enter GAME_TOKEN, optionally tick **REMEMBER TOKEN ON THIS DEVICE**.
2. Click **TEST AI CONNECTION** and check whether it says **GATEWAY READY** (not a guarantee of model availability).
3. Try `move lobby` — should change location without AI interpretation.
4. Try a narrative command like `I carefully head to reception` — the Worker should parse it and the engine should execute it, followed by AI narration.
5. If anything fails or seems to repeat the opening prompt, click **EXPORT DEBUG** and attach that JSON to the development chat. Note which command failed. Do not send your GAME_TOKEN.

## Developer / deployment notes

- All source code remains in `Diabolicdonut/Dinosaur-Horror-RPG`.
- GitHub Pages receives HTML/JS changes from main when Pages is configured and published.
- The **Cloudflare dashboard deployment is manual**; modifying `worker/index.mjs` in GitHub does not update the existing Worker until the owner pastes the new code into Cloudflare and deploys.
- `GET /v1/gm/status` requires a valid `Authorization: Bearer <GAME_TOKEN>` header and returns only nonsecret readiness/model metadata. This route does not bill OpenAI.
- If OpenAI API access is not provisioned for selected models, a gateway readiness check can succeed while an inference fails. The report records the gateway status and sanitized error code without leaking secrets.
- Recording a player command does not advance the deterministic world on its own; only engine acceptance does.
- Source `src/diagnostics.mjs` owns export sanitization; unit tests cover state completeness and token removal.
