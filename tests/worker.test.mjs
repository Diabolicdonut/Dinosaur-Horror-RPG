import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest, SCHEMAS } from '../worker/index.mjs';

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
test('missing or failing rate limiter blocks API calls', async () => {
  for (const env of [
    { ...ENV, GM_LIMITER: undefined },
    { ...ENV, GM_LIMITER: { async limit() { return { success: false }; } } },
    { ...ENV, GM_LIMITER: { async limit() { throw Error('service down'); } } }
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
