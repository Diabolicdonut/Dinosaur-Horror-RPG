import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest, SCHEMAS, MODEL_ROUTING, modelFor } from '../worker/index.mjs';

const BASE = 'https://dinosaur-rpg.diabolicdonut.workers.dev';
const ORIGIN = 'https://diabolicdonut.github.io';
const ENV = {
  OPENAI_API_KEY: 'example-test-openai-secret',
  GAME_TOKEN: 'example-test-game-token',
  GM_LIMITER: { async limit() { return { success: true }; } }
};
const turn = {
  input: 'go to the lobby',
  location: 'Visitor Center Control Room',
  exits: ['lobby', 'utility'],
  features: ['terminal', 'radio'],
  items: [],
  inventory: ['flashlight']
};
const intent = {
  action: 'move', target: 'lobby', push: false,
  rule_id: 'movement', clarification: '', reason: 'Valid adjacent room.'
};
const mkRequest = (path, body = { payload: turn }, options = {}) => new Request(BASE + path, {
  method: options.method || 'POST',
  headers: {
    Origin: options.origin === undefined ? ORIGIN : options.origin,
    'Content-Type': options.contentType || 'application/json',
    ...(options.token === false ? {} : { Authorization: 'Bearer ' + (options.token || ENV.GAME_TOKEN) }),
    ...(options.headers || {})
  },
  ...(options.method === 'GET' || options.method === 'OPTIONS' ? {} : { body: JSON.stringify(body) })
});
const fakeUpstream = (object) => async (url, options) => {
  assert.equal(url, 'https://api.openai.com/v1/responses');
  assert.equal(options.headers.Authorization, 'Bearer ' + ENV.OPENAI_API_KEY);
  const req = JSON.parse(options.body);
  assert(['gpt-6-luna', 'gpt-6.1-sol', 'gpt-6-astra'].includes(req.model));
  assert.equal(req.store, false);
  assert.equal(req.text.format.strict, true);
  assert.equal(req.text.format.type, 'json_schema');
  return new Response(JSON.stringify({
    status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(object) }] }]
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

test('health is public and does not expose private keys', async () => {
  const r = await handleRequest(mkRequest('/health', null, { method: 'GET', token: false }), ENV);
  assert.equal(r.status, 200);
  const data = await r.json();
  assert.equal(data.status, 'online');
  assert(!JSON.stringify(data).includes(ENV.GAME_TOKEN));
  assert(!JSON.stringify(data).includes(ENV.OPENAI_API_KEY));
});
test('CORS preflight accepts only authorized page origins', async () => {
  const req = mkRequest('/v1/gm/turn', null, { method: 'OPTIONS', token: false });
  const res = await handleRequest(req, ENV);
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  assert(res.headers.get('Access-Control-Allow-Headers').includes('Authorization'));
  const bad = await handleRequest(mkRequest('/v1/gm/turn', null, { method: 'OPTIONS', token: false, origin: 'https://evil.example' }), ENV);
  assert.equal(bad.status, 403);
  assert.equal(bad.headers.get('Access-Control-Allow-Origin'), null);
});
test('GAME_TOKEN is required before OpenAI is contacted', async () => {
  let contacted = false;
  const mock = async () => { contacted = true; throw Error('must not call'); };
  for (const opts of [{ token: false }, { token: 'wrong-game-token' }]) {
    const res = await handleRequest(mkRequest('/v1/gm/turn', { payload: turn }, opts), ENV, mock);
    assert.equal(res.status, 401);
  }
  assert.equal(contacted, false);
});
test('browser origin cannot be spoofed into authorization', async () => {
  const res = await handleRequest(mkRequest('/v1/gm/turn', { payload: turn }, { origin: 'https://attacker.example' }), ENV);
  assert.equal(res.status, 403);
});
test('AI interpretation returns allowlisted structured player intent', async () => {
  const res = await handleRequest(mkRequest('/v1/gm/turn'), ENV, fakeUpstream(intent));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await res.json(), intent);
  assert.equal(SCHEMAS.turn.properties.action.enum.includes('teleport'), false);
});
test('narration uses already-resolved events without state changes', async () => {
  const payload = { events: ['You open the gate.'], location: 'shed', stress: 1 };
  const res = await handleRequest(mkRequest('/v1/gm/narrate', { payload }), ENV, fakeUpstream({ text: 'The rusted hinges scream in the dark.' }));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).text, 'The rusted hinges scream in the dark.');
});
test('dialogue responds with a proposal, never a committed new fact', async () => {
  const res = await handleRequest(mkRequest('/v1/gm/dialogue', {
    payload: { npc: 'InGen technician', input: 'Where is the helicopter?' }
  }), ENV, fakeUpstream({ text: 'I do not know.', proposed_fact: '' }));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).proposed_fact, '');
});
test('dashboard paste mode works with the two secrets and no rate-limiter binding', async () => {
  const env = { OPENAI_API_KEY: ENV.OPENAI_API_KEY, GAME_TOKEN: ENV.GAME_TOKEN };
  const r = await handleRequest(mkRequest('/v1/gm/turn'), env, fakeUpstream(intent));
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), intent);
});
test('configured rate limiter rejects excessive requests or failures', async () => {
  for (const env of [
    { ...ENV, GM_LIMITER: { async limit() { return { success: false }; } } },
    { ...ENV, GM_LIMITER: { async limit() { throw Error('service down'); } } },
    { ...ENV, GM_LIMITER: {} }
  ]) {
    const r = await handleRequest(mkRequest('/v1/gm/turn'), env);
    assert([429, 503].includes(r.status));
  }
});
test('oversized or malformed requests are rejected without OpenAI', async () => {
  const res = await handleRequest(mkRequest('/v1/gm/turn', { payload: { input: 'x'.repeat(2000) } }), ENV);
  assert.equal(res.status, 400);
  const res2 = await handleRequest(mkRequest('/v1/gm/turn', { payload: {} }), ENV);
  assert.equal(res2.status, 400);
});
test('upstream failure exposes no provider error or secret', async () => {
  const upstream = async () => new Response(JSON.stringify({ error: { message: ENV.OPENAI_API_KEY } }), { status: 401 });
  const r = await handleRequest(mkRequest('/v1/gm/turn'), ENV, upstream);
  assert.equal(r.status, 502);
  const body = await r.text();
  assert(!body.includes(ENV.OPENAI_API_KEY));
});
test('unsupported routes never forward requests to OpenAI', async () => {
  const r = await handleRequest(mkRequest('/v1/gm/evil'), ENV, async () => { throw Error('unreachable'); });
  assert.equal(r.status, 404);
});

test('all existing GM routes choose deliberate defaults, not legacy single-model setting', () => {
  assert.deepEqual(modelFor('turn'), { model: 'gpt-6-luna', effort: 'none', max_output_tokens: 500 });
  assert.deepEqual(modelFor('narrate'), { model: 'gpt-6.1-sol', effort: 'low', max_output_tokens: 850 });
  assert.deepEqual(modelFor('dialogue'), { model: 'gpt-6.1-sol', effort: 'medium', max_output_tokens: 1600 });
  assert.equal(MODEL_ROUTING.turn.model, 'gpt-6-luna');
  assert.equal(modelFor('turn', { OPENAI_MODEL: 'gpt-6-astra' }).model, 'gpt-6-luna');
});
test('explicit Sol/Astra override cannot send unsupported none reasoning', () => {
  assert.deepEqual(modelFor('turn', { GM_MODEL_TURN: 'gpt-6.1-sol' }), { model: 'gpt-6.1-sol', effort: 'low', max_output_tokens: 500 });
  assert.equal(modelFor('turn', { GM_MODEL_TURN: 'gpt-6-astra' }).effort, 'low');
  assert.throws(() => modelFor('turn', { GM_MODEL_TURN: 'unbounded-client-value' }));
  assert.throws(() => modelFor('not_a_route'));
});
test('live Request body uses the selected model and effort for each route', async () => {
  const cases = [
    ['/v1/gm/turn', { payload: turn }, intent, 'gpt-6-luna', 'none'],
    ['/v1/gm/narrate', { payload: { events: ['A generator starts.'], location: 'shed' } }, { text: 'The generator rattles to life.' }, 'gpt-6.1-sol', 'low'],
    ['/v1/gm/dialogue', { payload: { npc: 'InGen field medic', input: 'Can you help?' } }, { text: 'Maybe.', proposed_fact: '' }, 'gpt-6.1-sol', 'medium']
  ];
  for (const [path, payload, output, model, effort] of cases) {
    const upstream = async (url, options) => {
      const req = JSON.parse(options.body);
      assert.equal(req.model, model);
      assert.equal(req.reasoning.effort, effort);
      assert(req.max_output_tokens > 0);
      return new Response(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(output) }] }] }), { status: 200 });
    };
    const response = await handleRequest(mkRequest(path, payload), ENV, upstream);
    assert.equal(response.status, 200, path);
  }
});
test('player input cannot select an expensive GM model directly', async () => {
  const requested = { ...turn, model: 'gpt-6-astra', reasoning: { effort: 'max' } };
  const upstream = async (_, options) => {
    const req = JSON.parse(options.body);
    assert.equal(req.model, 'gpt-6-luna');
    assert.equal(req.reasoning.effort, 'none');
    return new Response(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(intent) }] }] }), { status: 200 });
  };
  const res = await handleRequest(mkRequest('/v1/gm/turn', { payload: requested }), ENV, upstream);
  assert.equal(res.status, 200);
});
