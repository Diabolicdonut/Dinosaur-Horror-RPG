import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../worker/index.mjs';

// DHR-055: Worker abuse/security boundaries, without real credentials or provider calls.
const BASE = 'https://dinosaur-rpg.diabolicdonut.workers.dev';
const ORIGIN = 'https://diabolicdonut.github.io';
const SECRET = 'test-only-openai-key';
const TOKEN = 'test-only-game-token';
const PAYLOAD = {
  input: 'move to the lobby', location: 'control',
  exits: ['lobby'], features: [], items: [], inventory: []
};
const RESULT = { action: 'move', target: 'lobby', push: false,
  rule_id: 'movement', clarification: '', reason: 'Adjacent exit' };
const ENV = { GAME_TOKEN: TOKEN, OPENAI_API_KEY: SECRET,
  GM_LIMITER: { async limit() { return { success: true }; } } };

function request(options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (options.origin !== null) headers.Origin = options.origin ?? ORIGIN;
  if (options.authorization !== null) headers.Authorization = options.authorization ?? 'Bearer ' + TOKEN;
  return new Request(BASE + (options.path || '/v1/gm/turn'), {
    method: options.method || 'POST',
    headers,
    ...(options.method === 'GET' || options.method === 'OPTIONS' ? {} : {
      body: options.body === undefined ? JSON.stringify({ payload: PAYLOAD })
        : typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
    })
  });
}
function validProvider(callCount) {
  return async (url, options) => {
    callCount.count++;
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.headers.Authorization, 'Bearer ' + SECRET);
    assert.equal(JSON.parse(options.body).store, false);
    return new Response(JSON.stringify({ status: 'completed',
      output: [{ type: 'message', content: [
        { type: 'output_text', text: JSON.stringify(RESULT) }
      ] }] }), { status: 200 });
  };
}

test('DHR-055: missing and malformed Bearer authorization never contact the provider', async () => {
  const upstream = { count: 0 };
  for (const authorization of [null, '', 'Basic ' + TOKEN, TOKEN,
    'Bearer ', 'Bearer wrong', 'Bearer ' + TOKEN + 'tampered', 'bearer ' + TOKEN,
    'Bearer ' + TOKEN + ',Bearer second']) {
    const result = await handleRequest(request({ authorization }), ENV, validProvider(upstream));
    assert.equal(result.status, 401, String(authorization));
    assert.equal((await result.json()).error, 'unauthorized');
    assert.equal(result.headers.get('Cache-Control'), 'no-store');
  }
  assert.equal(upstream.count, 0);
});

test('DHR-055: spoofed approved Origin is not an authorization credential', async () => {
  const upstream = { count: 0 };
  const forged = request({ origin: ORIGIN, authorization: null });
  assert.equal((await handleRequest(forged, ENV, validProvider(upstream))).status, 401);
  assert.equal((await handleRequest(request({ origin: null, authorization: null }),
    ENV, validProvider(upstream))).status, 401);
  assert.equal((await handleRequest(request({ origin: 'https://attacker.example' }),
    ENV, validProvider(upstream))).status, 403);
  assert.equal(upstream.count, 0);
});

test('DHR-055: unconfigured secrets fail closed and reveal neither credential', async () => {
  for (const env of [{ ...ENV, GAME_TOKEN: undefined },
    { ...ENV, OPENAI_API_KEY: undefined }]) {
    const upstream = { count: 0 };
    const response = await handleRequest(request(), env, validProvider(upstream));
    assert.equal(response.status, 503);
    const body = await response.text();
    assert.equal(body.includes(TOKEN), false);
    assert.equal(body.includes(SECRET), false);
    assert.equal(upstream.count, 0);
  }
});

test('DHR-055: configured limiter is required even if Cloudflare binding is missing', async () => {
  for (const limiter of [undefined, null, false]) {
    const upstream = { count: 0 };
    const env = { ...ENV, GM_REQUIRE_LIMITER: 'true', GM_LIMITER: limiter };
    const response = await handleRequest(request(), env, validProvider(upstream));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, 'rate_limiter_unavailable');
    assert.equal(upstream.count, 0);
  }
});

test('DHR-055: rate limiter malformed verdicts and failures cannot spend model credits', async () => {
  const variants = [
    { limit: async () => null },
    { limit: async () => ({ success: 'true' }) },
    { limit: async () => ({}) },
    { limit: async () => { throw Error('provider key leaked: ' + SECRET); } },
    {}
  ];
  for (const limiter of variants) {
    const upstream = { count: 0 };
    const response = await handleRequest(request(),
      { ...ENV, GM_REQUIRE_LIMITER: true, GM_LIMITER: limiter },
      validProvider(upstream));
    assert.equal(response.status, 503);
    assert.equal(upstream.count, 0);
    const body = await response.text();
    assert(!body.includes(SECRET));
    assert(!body.includes(TOKEN));
  }
});

test('DHR-055: a repeated authenticated request still consumes the shared rate budget', async () => {
  let checks = 0;
  const upstream = { count: 0 };
  const env = { ...ENV, GM_REQUIRE_LIMITER: 'true',
    GM_LIMITER: { async limit({ key }) {
      assert.equal(key, 'single-player-ai-gateway');
      return { success: ++checks === 1 };
    } } };
  assert.equal((await handleRequest(request(), env, validProvider(upstream))).status, 200);
  const replay = await handleRequest(request(), env, validProvider(upstream));
  assert.equal(replay.status, 429);
  assert.equal(replay.headers.get('Retry-After'), '60');
  assert.equal(checks, 2);
  assert.equal(upstream.count, 1);
});

test('DHR-055: dashboard-paste mode retains compatibility without the optional binding', async () => {
  const upstream = { count: 0 };
  const response = await handleRequest(request(),
    { OPENAI_API_KEY: SECRET, GAME_TOKEN: TOKEN }, validProvider(upstream));
  assert.equal(response.status, 200);
  assert.equal(upstream.count, 1);
});

test('DHR-055: misleading or oversized Content-Length is rejected before the model', async () => {
  const upstream = { count: 0 };
  for (const [length, status] of [['10001', 413], ['abc', 400], ['-1', 400]]) {
    const response = await handleRequest(request({
      headers: { 'Content-Length': length }
    }), ENV, validProvider(upstream));
    assert.equal(response.status, status);
  }
  assert.equal(upstream.count, 0);
});

test('DHR-055: request body limit counts UTF-8 bytes, not JavaScript code units', async () => {
  const body = JSON.stringify({ payload: { ...PAYLOAD, padding: '🦖'.repeat(2600) } });
  assert(body.length < 10000);
  assert(Buffer.byteLength(body, 'utf8') > 10000);
  const upstream = { count: 0 };
  const response = await handleRequest(request({ body }), ENV, validProvider(upstream));
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error, 'request_too_large');
  assert.equal(upstream.count, 0);
});

test('DHR-055: a split UTF-8 character is decoded across streamed chunks', async () => {
  const encoded = new TextEncoder().encode(JSON.stringify({
    payload: { ...PAYLOAD, input: 'look 🦖' }
  }));
  const split = encoded.indexOf(0xf0);
  assert(split > 0);
  const chunks = [encoded.slice(0, split + 1), encoded.slice(split + 1, split + 3),
    encoded.slice(split + 3)];
  const stream = new ReadableStream({ start(controller) {
    for (const chunk of chunks) controller.enqueue(chunk);
    controller.close();
  } });
  const req = new Request(BASE + '/v1/gm/turn', {
    method: 'POST', duplex: 'half',
    headers: { Origin: ORIGIN, Authorization: 'Bearer ' + TOKEN,
      'Content-Type': 'application/json' },
    body: stream
  });
  const upstream = { count: 0 };
  const response = await handleRequest(req, ENV, async (url, options) => {
    assert.equal(JSON.parse(JSON.parse(options.body).input).input, 'look 🦖');
    return validProvider(upstream)(url, options);
  });
  assert.equal(response.status, 200);
  assert.equal(upstream.count, 1);
});

test('DHR-055: invalid UTF-8, broken JSON and invalid request payload are client errors', async () => {
  const upstream = { count: 0 };
  const invalidUtf8 = new Request(BASE + '/v1/gm/turn', {
    method: 'POST', body: Uint8Array.from([0xc3, 0x28]),
    headers: { Origin: ORIGIN, Authorization: 'Bearer ' + TOKEN,
      'Content-Type': 'application/json' }
  });
  for (const req of [invalidUtf8, request({ body: '{"payload":' }),
    request({ body: { payload: { ...PAYLOAD, input: '' } } })]) {
    const response = await handleRequest(req, ENV, validProvider(upstream));
    assert.equal(response.status, 400);
  }
  assert.equal(upstream.count, 0);
});

test('DHR-055: JSON lookalike content type cannot reach the provider', async () => {
  const upstream = { count: 0 };
  const response = await handleRequest(request({
    headers: { 'Content-Type': 'application/jsonp' }
  }), ENV, validProvider(upstream));
  assert.equal(response.status, 415);
  assert.equal(upstream.count, 0);
});

test('DHR-055: dialogue prompt and NPC identifier are both bounded before the model', async () => {
  const upstream = { count: 0 };
  const cases = [
    { npc: 'x'.repeat(161), input: 'What happened?' },
    { npc: 'Ranger', input: 'a'.repeat(401) },
    { npc: ' ', input: 'What happened?' },
    { npc: 'Ranger', input: '  ' }
  ];
  for (const payload of cases) {
    const response = await handleRequest(request({
      path: '/v1/gm/dialogue', body: { payload }
    }), ENV, validProvider(upstream));
    assert.equal(response.status, 400);
  }
  assert.equal(upstream.count, 0);
});

test('DHR-055: OpenAI connection failures never leak upstream details or claim success', async () => {
  for (const failed of [
    async () => { throw Error('connection failed ' + SECRET + ' ' + TOKEN); },
    async () => new Response(JSON.stringify({ error: SECRET + TOKEN }), { status: 401 })
  ]) {
    const response = await handleRequest(request(), ENV, failed);
    assert.equal(response.status, 502);
    const body = await response.text();
    assert.deepEqual(JSON.parse(body), { error: 'ai_unavailable' });
    assert(!body.includes(SECRET));
    assert(!body.includes(TOKEN));
  }
});

test('DHR-055: status probe makes no paid calls and does not assert model connectivity', async () => {
  const upstream = { count: 0 };
  const response = await handleRequest(request({ method: 'GET', path: '/v1/gm/status' }),
    ENV, validProvider(upstream));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).model_call_verified, false);
  assert.equal(upstream.count, 0);
});
