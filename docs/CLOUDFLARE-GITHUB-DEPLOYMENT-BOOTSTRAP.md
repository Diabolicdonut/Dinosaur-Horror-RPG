# Cloudflare Git deployment bootstrap (2026-11-07)

This documentation-only change is the first post-connection `main` commit intended to initiate the Cloudflare Builds integration for the existing `dinosaur-rpg` Worker. It **does not** change Worker code, game state, GitHub Actions, secrets, or accepted roadmap progress.

## Expected Cloudflare production configuration

- Git repository: `Diabolicdonut/Dinosaur-Horror-RPG`
- Production branch: `main`; builds enabled
- Root directory: `/`
- Build command: none
- Deploy command: `npx wrangler deploy --config worker/wrangler.jsonc`
- Existing Worker name: `dinosaur-rpg`
- Runtime secrets: `GAME_TOKEN` and `OPENAI_API_KEY` (configured directly in Cloudflare, never stored in Git)
- Code-defined rate-limit binding: `GM_LIMITER` (see `worker/wrangler.jsonc`), with `GM_REQUIRE_LIMITER=true` for paid endpoints.

## Verification after the trigger commit reaches main

1. In Cloudflare Dashboard, open Workers & Pages → `dinosaur-rpg` → **Builds / Deployments**. Check for a production build of this exact `main` commit.
2. Read the Wrangler build log and deployment result. A GitHub Actions green check or Pages deployment alone does **not** establish Cloudflare deployment success.
3. Confirm the production Worker still has the encrypted `GAME_TOKEN` and `OPENAI_API_KEY` secrets. Never log, paste, or commit their values.
4. Confirm the `GM_LIMITER` binding resolves at runtime (rate-limit bindings may not appear in the ordinary Bindings panel); if missing and `GM_REQUIRE_LIMITER=true`, paid endpoints deliberately fail with HTTP 503.
5. Test `GET /health` (no secret) and then `GET /v1/gm/status` with the existing Bearer token, expecting `authenticated: true`. **Do not put the token in a URL or screenshot.**
6. Confirm that an unauthenticated `POST /api/scene-image` returns HTTP 401 and valid malformed input returns HTTP 400. A real image request may be billable; only initiate one intentionally.
7. Do not claim the Worker is live on the new source until the Cloudflare build is successful and the deployed behavior is checked.

The image gateway deliberately has no daily, monthly, or 60-second cooldown quota. It retains the generic short-window rate limiter and fixed one-image model/quality/size to prevent unbounded individual request size; API billing still applies.

## Safety

Do not use this docs-only trigger to mark gameplay milestones complete, alter `site-progress.json`, or auto-merge gameplay PRs. Existing historical saves and Evolved rules remain untouched.
