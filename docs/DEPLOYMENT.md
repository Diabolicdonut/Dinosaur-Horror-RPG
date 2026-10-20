# Deployment — GitHub Pages + Cloudflare Worker

This is the deployment runbook for checkpoint 002.

## Existing addresses

- GitHub source: https://github.com/Diabolicdonut/Dinosaur-Horror-RPG
- Target static site (after Pages is enabled): https://diabolicdonut.github.io/Dinosaur-Horror-RPG/
- Cloudflare Worker (already created by user): https://dinosaur-rpg.diabolicdonut.workers.dev/
- Worker project in repository: `worker/`
- Browser gateway configuration: `src/app.mjs` (constant `WORKER_BASE`)

**Status:** Worker code is versioned in GitHub, not automatically deployed by a GitHub source commit. The user must connect Cloudflare Builds or deploy once using Wrangler. Repository ownership and secrets remain with the user.

## Recommended one-time Cloudflare setup (automatic future deploys)

1. Sign into https://dash.cloudflare.com/ and open **Workers & Pages**.
2. Select the existing Worker named **dinosaur-rpg**.
3. Open **Settings → Builds** and select **Connect**. [Cloudflare's current instructions](https://developers.cloudflare.com/workers/ci-cd/builds/).
4. Connect the GitHub repository `Diabolicdonut/Dinosaur-Horror-RPG`, branch `main`.
5. Set **Root directory** to `worker`. This is essential: `wrangler.jsonc` lives in that directory, and the Worker project is not the site's root `index.html`.
6. Leave **Build command** empty (no build step).
7. Set **Deploy command** to `npx wrangler deploy`. If prompted for a preview command, use `npx wrangler preview`.
8. Verify Worker name is **dinosaur-rpg** (the configuration already uses exactly this name).
9. Verify **Settings → Variables and Secrets** contains two **Secrets**, not plaintext vars:
   - `OPENAI_API_KEY`
   - `GAME_TOKEN`
10. Save the connection and trigger the first Worker deployment using Cloudflare's build/deploy controls or a new GitHub commit after connection. Connecting a repository does not necessarily deploy the existing commit until a build is triggered.
11. Open **https://dinosaur-rpg.diabolicdonut.workers.dev/health**; after deployment you should get JSON containing `"service":"dinosaur-rpg"`, `"version":"002"`, and `"ai_configured":true`.

Do not paste the values of either secret into GitHub, the browser source, deployment commands, Cloudflare logs, or chat.

If Cloudflare's connection UI uses a different label, look for the Git-based **Builds** configuration on the existing Worker, not the separate Cloudflare Pages product.

### Alternative: one-time manual deployment from your computer

Install Node.js 20+ and Git. From your terminal:

```bash
git clone https://github.com/Diabolicdonut/Dinosaur-Horror-RPG.git
cd Dinosaur-Horror-RPG
npx wrangler login
npx wrangler deploy --config worker/wrangler.jsonc
```

This deploys to the existing Worker named `dinosaur-rpg`, preserving the attached secrets. Source documentation: https://developers.cloudflare.com/workers/wrangler/commands/workers/

## GitHub Pages setup

1. Open `Diabolicdonut/Dinosaur-Horror-RPG` in GitHub.
2. Select **Settings → Pages**.
3. Choose **Deploy from a branch**, **main**, **/(root)** and **Save**.
4. Wait for Pages to publish, then load `https://diabolicdonut.github.io/Dinosaur-Horror-RPG/`.
5. Enable **AI GAME MASTER (BETA)** in the game and enter your **GAME_TOKEN** in the password field. The token stays in memory; do not type the OpenAI API key into the website.
6. Try a free-form command, e.g. `I cautiously head toward reception`. The AI will return a legal action, which the deterministic engine validates and executes, followed by AI narration.
7. Check Cloudflare Worker analytics for failed requests and OpenAI billing dashboard for spend.

Static GitHub Pages without the Worker still plays through the supported local commands.

## Security and troubleshooting

- **401**: token mismatch, missing token field or secret not deployed.
- **403**: browser Origin is not allowlisted in `worker/index.mjs` (expected published GitHub Pages origin: `https://diabolicdonut.github.io`).
- **404**: Hello World code is still deployed to Cloudflare; deploy this repository's `worker/` directory.
- **429**: rate limiting applies (currently `30` requests per `60` seconds using Cloudflare's `GM_LIMITER` binding). This is an abuse throttle, **not** a guaranteed monthly spending ceiling. Set spend alerts / budgets in OpenAI too.
- **503**: missing secret or missing rate-limit binding. Check Wrangler configuration and Worker settings.
- **502**: upstream model unavailable/refusal/error; the current game mechanics remain local.
- The authentication token in browser memory is a bearer credential. On a public page, anyone possessing it can use the Worker. Do not share it, and rotate it if exposed.
- CORS allowlisting does not protect the API independently of bearer token authentication.
- This Worker does not store server-side saves and cannot offer cross-device persistence.
- The `/v1/gm/dialogue` route is implemented as a draft proposal endpoint; the current seven-room prototype does not yet contain a persistent NPC knowledge simulation.
- The `/v1/gm/turn` route maps free-form prose into **currently supported actions only**. Unsupported improvised actions return `clarify`; full AI adjudication requires additional typed engine capabilities and tests.
- Requests are bounded by payload size, rate limit, server-side timeout, strict output schema, and rejection of arbitrary effect commands. No general prompts or third-party URL fetches are forwarded by the Worker.
- Do not use Cloudflare Worker code editor to replace the configured repository source if you want GitHub to remain authoritative.

## Verification

Run `npm test` locally, or inspect the `Validate deterministic engine` GitHub Actions workflow. This includes mocked Worker authentication, CORS, output schema, rate limits, and upstream error tests.

Run the Worker without the full browser only after deploying:

```bash
curl -i https://dinosaur-rpg.diabolicdonut.workers.dev/health
```

A working health endpoint does **not** prove the OpenAI request succeeds. That requires a real authenticated request and valid OpenAI account billing.
