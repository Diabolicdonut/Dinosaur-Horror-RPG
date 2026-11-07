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

- Shared token comparison, secret handling, origin allowlisting and existing `GM_LIMITER` are reused. Untrusted web origins are blocked; the image route also supports the `Origin: null` of a downloaded local HTML demo, **only when its Bearer token is correct**. Never embed, export or commit the game token in HTML. The token grants paid API access through the proxy; keep it private, rotate if exposed, and enforce OpenAI budget limits.
- This is **on-demand**, not per narration turn. Each button press can incur an image-generation charge; the browser disables further requests while one is pending. For more stringent cost protection, add a dedicated Cloudflare image rate-limit binding before broader release.
- Images are returned as base64 and are **not cached** or saved. A production release should add authentication suitable for multiple users, cost quotas, image persistence, and content safeguards.
- The scene description is **not** authoritative world state. The deterministic engine remains the authority and must guard reveal timing, map geometry and visual continuity.
- OpenAI image access and any required organization verification must already be available on the OpenAI project. A successful local mock test does not demonstrate that a live OpenAI image was generated.
- The standalone cinematic audio demo is kept **outside this public repository**, because it contains links to third-party copyrighted audio. Its updated private HTML lets the user enter the existing GAME_TOKEN without storing it in exported markup.

## Testing and deployment

`npm test` covers the new image route's successful proxy call, inherited token protection, origin policy including local HTML, CORS, input validation, upstream error sanitization, unchanged GM status, and rate limiter. Merge only through the project's existing integration policy. **The pull request itself does not deploy the Cloudflare Worker**; after review and merge, deploy from the merged `worker/wrangler.jsonc` using the established release procedure and confirm the route live.
