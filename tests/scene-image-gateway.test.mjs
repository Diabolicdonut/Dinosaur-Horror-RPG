import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../worker/index.mjs';
import { safeSceneImagePayload, SCENE_IMAGE_MODEL } from '../worker/scene-image.mjs';
import { SceneImageBudget, reserveSceneImageBudget, SCENE_IMAGE_LIMITS } from '../worker/scene-image-budget.mjs';

const endpoint = 'https://dinosaur-rpg.example/api/scene-image';
const env = { GAME_TOKEN: 'example-private-game-token', OPENAI_API_KEY: 'never-expose-provider-secret' };
function budgetNamespace(now = () => Date.now()) {
  const data = new Map();
  const storage = {
    async transaction(fn) {
      const t = { get: async key => data.get(key), put: async (key, value) => { data.set(key, value); } };
      return fn(t);
    }
  };
  const instance = new SceneImageBudget({ storage });
  return {
    idFromName(name) { assert.equal(name, 'global-scene-images'); return name; },
    get() {
      return { fetch: (url, options) => instance.fetch(new Request(url, options)) };
    },
    storage, data, instance, now
  };
}
function secured(overrides = {}) {
  return { ...env, SCENE_IMAGE_BUDGET: budgetNamespace(), ...overrides };
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

test('images use an independent strict quota and do not consume gameplay GM rate limits', async () => {
  const response = await handleRequest(req(), secured({ GM_LIMITER: { limit: async () => ({ success: false }) } }), async () => new Response(JSON.stringify({ data: [{ b64_json: 'QUJD' }] })));
  assert.equal(response.status, 200);
});

test('image requests fail closed without quota binding or when quota storage errors', async () => {
  let calls = 0;
  const upstream = async () => { calls++; throw new Error('no paid calls'); };
  const missing = await handleRequest(req(), env, upstream);
  assert.equal(missing.status, 503);
  assert.equal((await missing.json()).error, 'image_budget_unavailable');
  const failed = await handleRequest(req(), secured({ SCENE_IMAGE_BUDGET: {
    idFromName: () => 'id', get: () => ({ fetch: async () => { throw Error('DO offline'); } })
  } }), upstream);
  assert.equal(failed.status, 503);
  assert.equal(calls, 0);
});

test('strict quotas enforce global cooldown, UTC day and month boundaries', async () => {
  const ns = budgetNamespace();
  const start = Date.parse('2026-11-07T01:00:00.000Z');
  const storage = ns.storage;
  const a = await reserveSceneImageBudget(storage, start);
  assert.equal(a.allowed, true);
  assert.equal(a.dayRemaining, SCENE_IMAGE_LIMITS.perDay - 1);
  const cooldown = await reserveSceneImageBudget(storage, start + 2000);
  assert.deepEqual({ error: cooldown.error, retryAfter: cooldown.retryAfter },
    { error: 'image_cooldown', retryAfter: 58 });
  const b = await reserveSceneImageBudget(storage, start + 60000);
  const c = await reserveSceneImageBudget(storage, start + 120000);
  assert.equal(b.allowed, true);
  assert.equal(c.allowed, true);
  const exceeded = await reserveSceneImageBudget(storage, start + 180000);
  assert.equal(exceeded.error, 'image_daily_quota');
  assert(exceeded.retryAfter > 0);
  for (let day = 1; day < 7; day++) {
    const t = start + day * 86400000;
    for (let j = 0; j < 3; j++) {
      const out = await reserveSceneImageBudget(storage, t + j * 60000);
      assert.equal(out.allowed, !(day === 6 && j === 2));
    }
  }
  const exhausted = await reserveSceneImageBudget(storage, start + 7 * 86400000);
  assert.equal(exhausted.error, 'image_monthly_quota');
  const reset = await reserveSceneImageBudget(storage, Date.parse('2026-12-01T01:00:00.000Z'));
  assert.equal(reset.allowed, true);
  assert.equal(reset.monthRemaining, SCENE_IMAGE_LIMITS.perMonth - 1);
});

test('quota denial, invalid input and wrong token never reach paid image API', async () => {
  const ns = budgetNamespace();
  const fixedEnv = secured({ SCENE_IMAGE_BUDGET: ns });
  let calls = 0;
  const upstream = async () => { calls++; return new Response(JSON.stringify({ data: [{ b64_json: 'QUJD' }] })); };
  const first = await handleRequest(req(), fixedEnv, upstream);
  assert.equal(first.status, 200);
  const denied = await handleRequest(req(), fixedEnv, upstream);
  assert.equal(denied.status, 429);
  assert.equal((await denied.json()).error, 'image_cooldown');
  assert(Number(denied.headers.get('Retry-After')) > 0);
  assert.equal((await handleRequest(req({ token: 'wrong' }), fixedEnv, upstream)).status, 401);
  assert.equal((await handleRequest(req({ body: { prompt: 'short' } }), fixedEnv, upstream)).status, 400);
  assert.equal(calls, 1);
});

test('failed upstream image still consumes reservation to avoid retry-driven bills', async () => {
  const ns = budgetNamespace();
  const fixedEnv = secured({ SCENE_IMAGE_BUDGET: ns });
  const failed = await handleRequest(req(), fixedEnv, async () => new Response('upstream failed', { status: 503 }));
  assert.equal(failed.status, 502);
  const second = await handleRequest(req(), fixedEnv, async () => { throw Error('must not call'); });
  assert.equal(second.status, 429);
});

test('gameplay GM rate limit remains fail-closed independently from image quota', async () => {
  const input = req({ path: 'https://dinosaur-rpg.example/v1/gm/narrate',
    body: { payload: { events: ['one'], location: 'camp' } } });
  const response = await handleRequest(input, secured({
    GM_REQUIRE_LIMITER: 'true',
    GM_LIMITER: { limit: async () => ({ success: false }) }
  }), async () => { throw Error('must not call'); });
  assert.equal(response.status, 429);
});
