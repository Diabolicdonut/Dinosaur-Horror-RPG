import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../worker/index.mjs';
import { safeSceneImagePayload, SCENE_IMAGE_MODEL } from '../worker/scene-image.mjs';

const endpoint = 'https://dinosaur-rpg.example/api/scene-image';
const env = { GAME_TOKEN: 'example-private-game-token', OPENAI_API_KEY: 'never-expose-provider-secret' };
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
  const response = await handleRequest(req({ body: { prompt, model: SCENE_IMAGE_MODEL, size: '1536x1024', quality: 'medium', output_format: 'jpeg', scene: { id: 'fire-station' } } }), env, upstream);
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
    const response = await handleRequest(req({ token }), env, upstream);
    assert.equal(response.status, 401);
  }
  assert.equal(calls, 0);
});

test('refuses disallowed web origins but permits local file demo with valid bearer token', async () => {
  const upstream = async () => new Response(JSON.stringify({ data: [{ b64_json: 'QUJD' }] }));
  const forbidden = await handleRequest(req({ from: 'https://untrusted.example' }), env, upstream);
  assert.equal(forbidden.status, 403);
  const local = await handleRequest(req({ from: 'null' }), env, upstream);
  assert.equal(local.status, 200);
  assert.equal(local.headers.get('Access-Control-Allow-Origin'), 'null');
  const gmBlocked = await handleRequest(req({ path: 'https://dinosaur-rpg.example/v1/gm/status', method: 'GET', from: 'null' }), env, upstream);
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
    const response = await handleRequest(req({ body }), env, upstream);
    assert.equal(response.status, 400, JSON.stringify(body).slice(0,60));
  }
  assert.equal(called, false);
  assert.equal(safeSceneImagePayload({ prompt })?.prompt, prompt);
});

test('OpenAI errors never leak the provider response or secret', async () => {
  const upstream = async () => new Response('sensitive upstream internal error', { status: 429 });
  const response = await handleRequest(req(), env, upstream);
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

test('existing Worker rate limiter also governs image requests', async () => {
  const response = await handleRequest(req(), { ...env, GM_LIMITER: { limit: async () => ({ success: false }) } }, async () => { throw new Error('must not call'); });
  assert.equal(response.status, 429);
});
