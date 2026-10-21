# Simplest Cloudflare setup — paste code into your existing Worker

This is the recommended install path for the personal-use prototype when Cloudflare/GitHub CI integration is not wanted. **No GitHub connection, CLI, Wrangler config, or build setup is required.**

## Requirements already created by the user

- Worker: `dinosaur-rpg`
- Public address: `https://dinosaur-rpg.diabolicdonut.workers.dev`
- Encrypted secret: `OPENAI_API_KEY` (value must be the actual OpenAI API key)
- Encrypted secret: `GAME_TOKEN` (user-chosen long, unpredictable string)

## Install in the Cloudflare dashboard

1. Open https://dash.cloudflare.com/ and select **Workers & Pages**.
2. Select the existing **dinosaur-rpg** Worker, then **Edit code**.
3. Open the exact source file **[worker/index.mjs](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/blob/main/worker/index.mjs)** or its [raw copy-paste version](https://raw.githubusercontent.com/Diabolicdonut/Dinosaur-Horror-RPG/main/worker/index.mjs).
4. Select and copy the **entire** source text (including `export default`).
5. Replace the default Hello World script in Cloudflare's editor with that text.
6. Choose **Deploy** (or **Save and deploy**, depending on UI).
7. Under **Settings → Variables and Secrets**, confirm `OPENAI_API_KEY` and `GAME_TOKEN` are both set as **Secret** values; if changed, deploy the settings.
8. Visit **https://dinosaur-rpg.diabolicdonut.workers.dev/health**. Expect a JSON response with `"service":"dinosaur-rpg"`, `"version":"002"`, and `"ai_configured":true`.

**Never paste real key/token values into source code, GitHub, or ChatGPT.** The Worker reads both secrets securely using the `env` argument.

## Test with the browser game

1. Open the browser frontend (GitHub Pages once enabled, or a local instance).
2. Enable **AI GAME MASTER (BETA)**.
3. Enter only your `GAME_TOKEN` in the password field; this is not saved.
4. Try a natural-language request like "Carefully approach the lobby." The AI parses it into a supported structured action. The rules engine determines the outcome and AI narrates the actual results.
5. Unsupported novel actions return clarification; the full arbitrary-action adjudicator is a later milestone.

## Security / costs

The dashboard-paste method needs **no extra binding**. The Worker enforces a bearer token, restricts known browser origins, validates request size and response format, and timeouts requests. However, **there is no automatic rate limiting unless you separately set it up in Cloudflare**. The optional `GM_LIMITER` binding in the GitHub Wrangler config is used when deploying that way, but it is not required in the dashboard editor.

Protect OpenAI usage by keeping your `GAME_TOKEN` secret, setting API project budgets/alerts, and optionally configuring Cloudflare rate limiting. An allowed browser origin is *not* authentication. Even a budget alert might not be a hard spending cap.

Do not reconnect this Worker to a Git-based deployment unless you are ready to switch from manual edits to Git-driven deploys. Cloudflare's editor and GitHub source do not automatically synchronize.

## What remains

GitHub Pages publishing is a **separate setting in GitHub** (repository Settings → Pages → Deploy from branch → `main` and `/(root)`). It does **not** require Cloudflare integration. The browser points to this exact Worker address already.
