# DHR-055 — Cloudflare Worker credential, request-budget and abuse boundary

**Scope:** GitHub Issue #85. Candidate Worker-only hardening for roadmap gate 18; not completion of the gate, a new gameplay checkpoint, or a claim about deployed Cloudflare state.

## Verified source contracts

- `worker/index.mjs` uses mandatory `GAME_TOKEN` Bearer authentication before any paid model call. `OPENAI_API_KEY` is read only from Worker environment bindings and sent only on the Worker-to-OpenAI HTTPS request. Neither key is returned to the browser. `/health` remains public; authenticated `GET /v1/gm/status` checks local readiness without making an OpenAI request, and explicitly says `model_call_verified: false`.
- CORS restricts normal browser origins, but **is not an authentication mechanism**. An arbitrary HTTP client can forge or omit the `Origin` header. A stolen `GAME_TOKEN` can be reused until rotated. No replay nonce or trusted session store exists; this task does not pretend to add one.
- Paid routes accept only POST JSON, retain the `10,000` **UTF-8 byte** body ceiling and the `7,000`-character JSON payload ceiling, and apply route-specific bounds. The Worker rejects malformed JSON, invalid UTF-8 and misleading declared lengths before contacting OpenAI. Turn/adjudicate inputs remain capped at 400 characters. Dialogue speaker names are capped at 160 and dialogue requests at 400 characters. Unexpected upstream/network/model errors return sanitized failure codes.
- The optional Cloudflare `GM_LIMITER` is shared across the single-player gateway and counts authenticated paid requests, including replays. With `GM_REQUIRE_LIMITER=true`, **missing, broken or failing limiter bindings fail closed (503)** instead of bypassing cost protection; valid over-quota outcomes return 429 with `Retry-After: 60`. Malformed limiter results are not treated as success.

## Deployment distinction and remaining security limitations

- The committed `worker/wrangler.jsonc` config sets `GM_REQUIRE_LIMITER: "true"` and declares the 30-per-60-second `GM_LIMITER` binding. **Cloudflare must actually provision the binding**. If it is absent or unavailable, paid API routes return 503 rather than consuming OpenAI credits. This is intentional operational fail-closed behavior, not evidence that the live binding exists.
- The manually pasted Worker source with only `OPENAI_API_KEY` and `GAME_TOKEN` and **without** `GM_REQUIRE_LIMITER` remains compatible, but has **no Worker-enforced request rate cap**. Configure Cloudflare account-side rules and OpenAI billing alerts/usage limits; do not describe provider cost alerts as guaranteed hard ceilings. To require the binding in this mode, explicitly configure `GM_REQUIRE_LIMITER=true` and `GM_LIMITER`, or move to the Wrangler-managed deployment.
- A valid bearer credential is reusable by design. Rate limiting bounds repeated paid usage within a window, but **does not provide one-time-request replay protection**, per-user identities, distributed persisted nonce checks, account-wide hard spend caps, or prevention of token extraction from a compromised client. Future trusted-server state/auth infrastructure belongs to later roadmap work (DHR-056/057), not this issue.
- This patch does not move hidden GM state off the client, change game session/save formats, change world or rule authority, or prove secure hosting of client-side scenario secrets.

## Regression verification and manual QA

Run `node --test tests/worker.test.mjs tests/worker-security-dhr055.test.mjs`, then `npm test` and `node --check worker/index.mjs`, `node --check tests/worker-security-dhr055.test.mjs`. The new suite exercises bad/missing Bearer authorization, forged and omitted origins, credential custody, repeated requests against a limiter, absent/malformed/throwing limiter bindings, body bytes vs UTF-16 characters, streamed split/malformed UTF-8, malformed JSON/content-type/length, excessive dialogue prompts, unavailable OpenAI and status probes. Provider calls are injected mocks; no real secrets or OpenAI billing are required.

**Manual verification still pending:** confirm Cloudflare's deployed Worker source is updated, confirm environment binding `GM_LIMITER` is available and `GM_REQUIRE_LIMITER` is set, check over-limit 429 and bad-binding 503 behavior on a controlled staging Worker, then verify a real authenticated OpenAI call and OpenAI-side usage/alerts without exposing keys. GitHub PR-head CI is not evidence that the Cloudflare dashboard deployment actually changed.
