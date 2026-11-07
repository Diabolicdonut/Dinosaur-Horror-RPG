# Authenticated scene-image prototype

The existing `dinosaur-rpg` Worker supports an opt-in `POST /api/scene-image` endpoint alongside unchanged `/v1/gm/*` routes. **No extra OpenAI secret or separate Worker is needed.** It uses `OPENAI_API_KEY` on the server and requires the existing `GAME_TOKEN` supplied as `Authorization: Bearer <GAME_TOKEN>`.

## Request and response

```http
POST https://dinosaur-rpg.diabolicdonut.workers.dev/api/scene-image
Authorization: Bearer <GAME_TOKEN>
Content-Type: application/json

{
  "prompt": "Cinematic rainy jungle with two survivors at an abandoned fire station and no visible dinosaur.",
  "model": "gpt-image-2.5-flare",
  "size": "1536x1024",
  "quality": "medium",
  "output_format": "jpeg",
  "scene": { "id": "fire-station", "creature_visible": false }
}
```

On success: `{ "b64_json": "...", "mime_type": "image/jpeg", "model": "gpt-image-2.5-flare" }`. The browser displays `data:image/jpeg;base64,<b64_json>`. The model, output size, quality, format, and image count are controlled **only by the Worker**; browser values are checked for compatibility, not trusted as instructions. The endpoint forwards only the prompt and server-defined constraints; scene metadata is for browser-side consistency and prompt composition.

## Security and practical limits

- Shared token comparison, secret handling and origin allowlisting are reused. The image route uses its **own strict global Durable Object budget** rather than the approximate location-scoped `GM_LIMITER` used by gameplay. Untrusted web origins are blocked; the image route also supports the `Origin: null` of a downloaded local HTML demo, **only when its Bearer token is correct**. Never embed, export or commit the game token in HTML. The token grants paid API access through the proxy; keep it private, rotate if exposed, and enforce OpenAI budget limits.
- This is **on-demand**, not per narration turn. Each button press can incur an image-generation charge; the browser disables further requests while one is pending. The authenticated image route must reserve **at most 3 attempts per UTC day, 20 per UTC month, with at least 60 seconds between reservations**, all across Cloudflare locations and sessions. Reservations are written transactionally to a single named SQLite-backed Durable Object **before** calling OpenAI; error responses/timeouts are not refunded because an upstream attempt may still be charged. These are image attempt counts, **not exact USD spending accounting**: image prices depend on output tokens and can change. Set OpenAI project budget alerts/limits separately.
- Images are returned as base64 and are **not cached** or saved. If the `SCENE_IMAGE_BUDGET` Durable Object is absent or unavailable, image generation **fails closed with 503** while existing GM gameplay remains available. A production multi-user release still needs per-account credentials/quotas, image persistence, and content safeguards.
- The scene description is **not** authoritative world state. The deterministic engine remains the authority and must guard reveal timing, map geometry and visual continuity.
- OpenAI image access and any required organization verification must already be available on the OpenAI project. A successful local mock test does not demonstrate that a live OpenAI image was generated.
- The standalone cinematic audio demo is kept **outside this public repository**, because it contains links to third-party copyrighted audio. Its updated private HTML lets the user enter the existing GAME_TOKEN without storing it in exported markup.

## Testing and deployment

`npm test` covers the new image route's successful proxy call, inherited token protection, origin policy including local HTML, CORS, input validation, upstream error sanitization, unchanged GM status, independent gameplay rate limiting, image cooldown, daily/monthly quota rollover, fail-closed behavior, and paid-attempt reservation semantics. Merge only through the project's existing integration policy. **The pull request itself does not deploy the Cloudflare Worker**; after review and merge, deploy from the merged `worker/wrangler.jsonc` using the established release procedure and confirm the route live.

## Required Cloudflare binding and verification

The checked-in `worker/wrangler.jsonc` declares `SCENE_IMAGE_BUDGET` mapped to the exported `SceneImageBudget` class, with Cloudflare's SQLite-backed Durable Object `exports` lifecycle configuration. Deploy the **whole Worker module** from the **merged `main`** via `npx wrangler deploy --config worker/wrangler.jsonc` (or `cd worker && npx wrangler deploy`) using an authenticated Cloudflare session. Confirm the namespace was created. Never paste the API key into GitHub or local HTML. This is a new Cloudflare binding but requires **no new secret**.

Test live without paid generation first: authenticated malformed prompt -> 400; missing token -> 401; with a valid prompt, if budget binding is absent -> 503. An actual image generation test incurs a charge and must be separately authorized; do not claim production deployment or billing verification from GitHub Actions/Pages alone. Keep the project-wide OpenAI usage budget suitably low. Cloudflare strict quota has intentionally no administrator reset endpoint and counters are never derived from client requests.
