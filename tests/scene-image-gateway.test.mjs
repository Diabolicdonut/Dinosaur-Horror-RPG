import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../worker/index.mjs';
import { safeSceneImagePayload, SCENE_IMAGE_MODEL } from '../worker/scene-image.mjs';

const endpoint = 'https://dinosaur-rpg.example/api/scene-image';
const env = { GAME_TOKEN: 'example-private-game-token', OPENAI_API_KEY: 'never-expose-provider-secret' };
function secured(overrides = {}) {
  // The real Cloudflare binding enforces the generic per-minute abuse limit.
  // A mocked approval allows verification of old daily/monthly quota removal.
  return { ...env, GM_REQUIRE_LIMITER: 'true',
    GM_LIMITER: { limit: async () => ({ success: true }) }, ...overrides };
}
const origin = 'https://diabolicdonut.github.io';
const prompt = 'Photorealistic rainy forest at dusk, two people shelter beneath a concrete canopy, no dinosaur visible.';

function req({ path = endpoint, method = 'POST', token = env.GAME_TOKEN, from = origin, body = { prompt }, headers = {} } = {}) {
  const all = { Origin: from, ...headers };
  if (token !== null) all.Authorization = 'Bearer ' + token;
  if (method === 'POST') all['Content-Type'] = 'application/json';
  return new Request(path, { method, headers: all, body: method === 'POST' ? JSON.stringify(body) : undefined });
}

test('accepts the standalone demo payload but caps model, count and quality', async () => {
  let requests = 0;
  const upstream = async (url, options) => {
    requests++;
    assert.equal(url, 'https://api.openai.com/v1/images/generations');
    assert.equal(options.headers.Authorization, 'Bearer ' + env.OPENAI_API_KEY);
    const parsed = JSON.parse(options.body);
    assert.equal(parsed.model, SCENE_IMAGE_MODEL);
    assert.equal(parsed.n, 1);
    assert.equal(parsed.size, '1536x1024');
    assert.equal(parsed.output_format, 'jpeg');
    assert.equal(parsed.quality, 'medium');
    assert.match(parsed.prompt, /rainy forest at dusk/);
    return new Response(JSON.stringify({ data: [{ b64_json: 'QUJDRA==' }] }), { status: 200 });
  };
  const response = await handleRequest(req({ body: { prompt, model: SCENE_IMAGE_MODEL, size: '1536x1024', quality: 'medium', output_format: 'jpeg', scene: { id: 'fire-station' } } }), secured(), upstream);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
  assert.equal(requests, 1);
  const result = await response.json();
  assert.equal(result.b64_json, 'QUJDRA==');
  assert.equal(result.mime_type, 'image/jpeg');
  assert.ok(!JSON.stringify(result).includes(env.OPENAI_API_KEY));
});

test('denies missing or incorrect GAME_TOKEN before calling OpenAI', async () => {
  let calls = 0;
  const upstream = async () => { calls++; throw new Error('must not call'); };
  for (const token of [null, 'wrong']) {
    const response = await handleRequest(req({ token }), secured(), upstream);
    assert.equal(response.status, 401);
  }
  assert.equal(calls, 0);
});

test('refuses disallowed web origins but permits local file demo with valid bearer token', async () => {
  const upstream = async () => new Response(JSON.stringify({ data: [{ b64_json: 'QUJD' }] }));
  const forbidden = await handleRequest(req({ from: 'https://untrusted.example' }), secured(), upstream);
  assert.equal(forbidden.status, 403);
  const local = await handleRequest(req({ from: 'null' }), secured(), upstream);
  assert.equal(local.status, 200);
  assert.equal(local.headers.get('Access-Control-Allow-Origin'), 'null');
  const gmBlocked = await handleRequest(req({ path: 'https://dinosaur-rpg.example/v1/gm/status', method: 'GET', from: 'null' }), secured(), upstream);
  assert.equal(gmBlocked.status, 403);
});

test('CORS preflight works for authorized image route', async () => {
  const response = await handleRequest(req({ method: 'OPTIONS', token: null, headers: { 'Access-Control-Request-Headers': 'authorization,content-type' } }), env);
  assert.equal(response.status, 204);
  assert.match(response.headers.get('Access-Control-Allow-Headers'), /Authorization/);
});

test('invalid prompt, oversized prompt and client-selected high quality fail before OpenAI', async () => {
  let called = false;
  const upstream = async () => { called = true; throw new Error('must not call'); };
  for (const body of [{ prompt: 'too short' }, { prompt: 'a'.repeat(5100) }, { prompt, quality: 'high' }, { prompt, model: 'gpt-image-2.5-sunburst' }, { prompt, scene: [] }]) {
    const response = await handleRequest(req({ body }), secured(), upstream);
    assert.equal(response.status, 400, JSON.stringify(body).slice(0,60));
  }
  assert.equal(called, false);
  assert.equal(safeSceneImagePayload({ prompt })?.prompt, prompt);
});

test('OpenAI errors never leak the provider response or secret', async () => {
  const upstream = async () => new Response('sensitive upstream internal error', { status: 429 });
  const response = await handleRequest(req(), secured(), upstream);
  assert.equal(response.status, 502);
  const text = await response.text();
  assert.ok(!text.includes('sensitive'));
  assert.ok(!text.includes(env.OPENAI_API_KEY));
});

test('existing GM status route still authenticates without a model request', async () => {
  const response = await handleRequest(req({ path: 'https://dinosaur-rpg.example/v1/gm/status', method: 'GET' }), env, async () => { throw new Error('status must not invoke OpenAI'); });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).authenticated, true);
});


test('image requests have no daily/monthly quota or 60-second cooldown', async () => {
  let calls = 0;
  const limiterKeys = [];
  const safeEnv = secured({ GM_LIMITER: {
    limit: async ({ key }) => { limiterKeys.push(key); return { success: true }; }
  } });
  const upstream = async () => {
    calls++;
    return new Response(JSON.stringify({ data: [{ b64_json: 'QUJD' }] }), { status: 200 });
  };
  // Exceed old day (3) and month (20) limits without advancing a fake clock.
  // Calls are allowed here because the minute limiter mock grants them.
  for (let i = 0; i < 25; i++) {
    const response = await handleRequest(req(), safeEnv, upstream);
    assert.equal(response.status, 200, 'request ' + (i + 1));
  }
  assert.equal(calls, 25);
  assert.equal(limiterKeys.length, 25);
  assert(limiterKeys.every(key => key === 'single-player-image-gateway'));
});

test('GM and images have separate per-minute limiter keys', async () => {
  const keys = [];
  const safeEnv = secured({ GM_LIMITER: {
    limit: async ({ key }) => { keys.push(key); return { success: true }; }
  } });
  const upstream = async url => {
    if (url.includes('/images/generations'))
      return new Response(JSON.stringify({ data: [{ b64_json: 'QUJD' }] }), { status: 200 });
    throw Error('GM status should never call upstream');
  };
  const first = await handleRequest(req(), safeEnv, upstream);
  assert.equal(first.status, 200);
  const gm = await handleRequest(req({ path: 'https://dinosaur-rpg.example/v1/gm/status',
    method: 'GET' }), safeEnv, upstream);
  assert.equal(gm.status, 200);
  // Status is zero-cost and does not draw from the limiter.
  const input = req({ path: 'https://dinosaur-rpg.example/v1/gm/narrate',
    body: { payload: { events: ['one'], location: 'camp' } } });
  let gmCalled = false;
  const result = await handleRequest(input, safeEnv, async (url) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    gmCalled = true;
    return new Response(JSON.stringify({ output: [{ content: [{ type: 'output_text', text: '{"text":"Safe narration."}' }] }] }), { status: 200 });
  });
  assert.equal(result.status, 200);
  assert(gmCalled);
  assert.deepEqual(keys, ['single-player-image-gateway', 'single-player-ai-gateway']);
});

test('per-minute image rate limit still prevents excessive requests and paid calls', async () => {
  let calls = 0, key = null;
  const response = await handleRequest(req(), secured({
    GM_LIMITER: { limit: async ({ key: bucket }) => {
      key = bucket;
      return { success: false };
    } }
  }), async () => { calls++; throw Error('must not contact OpenAI'); });
  assert.equal(response.status, 429);
  assert.equal((await response.json()).error, 'rate_limited');
  assert.equal(response.headers.get('Retry-After'), '60');
  assert.equal(key, 'single-player-image-gateway');
  assert.equal(calls, 0);
});

test('configured fail-closed limiter protects images but requires no Durable Object binding', async () => {
  let calls = 0;
  const upstream = async () => { calls++; return new Response(JSON.stringify({ data: [{ b64_json: 'QUJD' }] })); };
  const without = await handleRequest(req(), { ...env, GM_REQUIRE_LIMITER: 'true' }, upstream);
  assert.equal(without.status, 503);
  assert.equal((await without.json()).error, 'rate_limiter_unavailable');
  assert.equal(calls, 0);
  const allowed = await handleRequest(req(), secured(), upstream);
  assert.equal(allowed.status, 200);
  assert.equal(calls, 1);
});

test('invalid auth, origin and payload never reach image generation', async () => {
  let calls = 0;
  const upstream = async () => { calls++; throw Error('unreachable'); };
  for (const input of [
    req({ token: null }),
    req({ token: 'incorrect' }),
    req({ from: 'https://untrusted.example' }),
    req({ body: { prompt: 'short' } }),
    req({ body: { prompt, quality: 'max' } }),
    req({ body: { prompt, model: 'gpt-image-2.5-sunburst' } })
  ]) {
    const response = await handleRequest(input, secured(), upstream);
    assert(response.status >= 400);
  }
  assert.equal(calls, 0);
});

test('upstream failure is sanitized and does not create artificial quota lockout', async () => {
  const safeEnv = secured();
  const first = await handleRequest(req(), safeEnv, async () => new Response('provider details', { status: 503 }));
  assert.equal(first.status, 502);
  const second = await handleRequest(req(), safeEnv,
    async () => new Response(JSON.stringify({ data: [{ b64_json: 'QUJD' }] }), { status: 200 }));
  assert.equal(second.status, 200);
});
