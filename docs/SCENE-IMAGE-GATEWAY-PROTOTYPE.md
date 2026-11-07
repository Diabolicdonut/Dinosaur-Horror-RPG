# Authenticated scene-image gateway — testing-friendly usage

The existing `dinosaur-rpg` Worker supports on-demand `POST /api/scene-image` next to the existing `/v1/gm/*` routes. The browser supplies the existing `GAME_TOKEN` as `Authorization: Bearer <GAME_TOKEN>`; the OpenAI API key stays on the server. No new secret or separate Worker is needed.

## Request / response

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

Success: `{ "b64_json": "...", "mime_type": "image/jpeg", "model": "gpt-image-2.5-flare" }`. The browser can display `data:image/jpeg;base64,<b64_json>`. Only the validated prompt is forwarded; the server fixes the model, resolution, image count (one), output format and quality.

## Costs, limits, and protection

**No per-session, daily or monthly image-generation cap, and no artificial cooldown.** Earlier 3/day, 20/month and 60-second Durable Object quotas were deliberately removed for repeated simultaneous game testing. No `SCENE_IMAGE_BUDGET` Durable Object binding is required.

- The existing `GM_LIMITER` Cloudflare rate-limit binding remains an abuse safeguard (configured at 30 requests / 60 seconds); image requests use limiter key `single-player-image-gateway`, independent of gameplay key `single-player-ai-gateway`. It prevents rapid accidental or malicious bursts but does **not** cap total images across sessions or days. Multiple test sessions can generate images within normal burst limits.
- The existing `GM_REQUIRE_LIMITER=true` in `wrangler.jsonc` makes all billable routes fail closed when the generic limiter is missing; don't disable it for public hosting. No other usage quota is enforced by this project.
- Each successful or potentially billed image invocation is charged to your **OpenAI API project**, not to your ChatGPT subscription. Estimated standard-rate GPT Image 2.5 Flare medium landscape output cost (1536x1024) is roughly USD $0.0103 plus small prompt input charges, based on typical token usage; exact price varies by usage and settings. Check the API project usage dashboard and spending-alert configuration. With hard project caps removed here, usage can accumulate.
- `GAME_TOKEN` still guards access; allowed browser origins remain restricted. `Origin: null` is permitted for the local HTML demo with a valid Bearer token. Never commit or share the token; rotate it if exposed. Origin checks alone are not authentication.
- Image prompts must describe established, player-visible scene facts. The rendered image is **not** authoritative game state. The deterministic engine controls positions, revealed clues, and hidden animals.
- No automatic image generation per narration turn; the endpoint is opt-in. These images are returned inline as base64 and are not automatically saved to Dropbox or other persistence.

## Tests and deployment

`npm test` covers token/origin validation, CORS, fixed-size/quality/model costs, sanitizer behavior, unauthenticated rejection, independent image/GM minute-rate keys, absence of daily/monthly quotas and cooldown, and no dependency on Durable Objects. Test calls use mocked OpenAI responses and do not create API charges.

After reviewed PR merge, deploy the merged code to the existing Worker via:

```bash
npx wrangler@latest deploy --config worker/wrangler.jsonc
```

This does not require provisioning `SCENE_IMAGE_BUDGET`. It does require the configured `GM_LIMITER` and existing `GAME_TOKEN` / `OPENAI_API_KEY` secrets. GitHub Actions and Pages do **not** deploy or verify the live Cloudflare Worker. Verify live authentication and origin handling before making a separately authorized paid image-generation request.
