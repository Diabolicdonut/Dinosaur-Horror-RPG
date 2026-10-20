/** Local-only, dependency-free static server + optional AI gateway.
 * Never place OPENAI_API_KEY into a static deployment or browser bundle.
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8787);
const MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';
const STATIC = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/src/style.css': ['src/style.css', 'text/css; charset=utf-8'],
  '/src/app.mjs': ['src/app.mjs', 'text/javascript; charset=utf-8'],
  '/src/engine.mjs': ['src/engine.mjs', 'text/javascript; charset=utf-8'],
  '/src/scenario.mjs': ['src/scenario.mjs', 'text/javascript; charset=utf-8']
};
const ALLOWED = ['look', 'status', 'inventory', 'map', 'help', 'move', 'sneak', 'run', 'take', 'use', 'hide', 'wait'];
function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
async function readJson(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk.toString('utf8');
    if (body.length > 12000) throw new Error('Request exceeds 12 KB limit.');
  }
  return JSON.parse(body);
}
async function openAI(mode, payload) {
  const interpret = mode === 'interpret';
  const schema = interpret ? {
    type: 'object', additionalProperties: false,
    properties: {
      action: { type: 'string', enum: ALLOWED },
      target: { type: 'string' },
      push: { type: 'boolean' }
    },
    required: ['action', 'target', 'push']
  } : {
    type: 'object', additionalProperties: false,
    properties: { text: { type: 'string' } },
    required: ['text']
  };
  const system = interpret
    ? 'Translate player requests into a single legal engine action. You are NOT a rules arbiter. Use the provided exit and feature IDs; never invent map locations or items. If intent is ambiguous, choose look. Output only the schema.'
    : 'Narrate the given already-resolved events with immersive, restrained Jurassic Park survival-horror atmosphere in 1-3 sentences. Facts, dice results, locations, creatures, health, objectives, and outcomes are immutable. Do not add new threats, movement, discoveries or consequences. Output only the schema.';
  const apiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.OPENAI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      instructions: system,
      input: JSON.stringify(payload),
      max_output_tokens: 280,
      text: { format: { type: 'json_schema', name: interpret ? 'game_intent' : 'game_narration', schema, strict: true } }
    }),
    signal: AbortSignal.timeout(20000)
  });
  const raw = await apiResponse.json();
  if (!apiResponse.ok) throw new Error('OpenAI API returned HTTP ' + apiResponse.status + ': ' + String(raw.error?.message || 'Unknown API error').slice(0, 180));
  const text = (raw.output || []).flatMap(x => x.content || []).filter(x => x.type === 'output_text').map(x => x.text).join('');
  if (!text) throw new Error('No model output was returned.');
  const result = JSON.parse(text);
  if (interpret && !ALLOWED.includes(result.action)) throw new Error('Unsupported AI action.');
  return result;
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/director') {
    if (req.method !== 'POST') return send(res, 405, { error: 'POST required.' });
    if (!process.env.OPENAI_API_KEY) return send(res, 503, { error: 'Configure OPENAI_API_KEY on the server first.' });
    try {
      const { mode, payload } = await readJson(req);
      if (!['interpret', 'narrate'].includes(mode) || !payload || typeof payload !== 'object') return send(res, 400, { error: 'Invalid mode or payload.' });
      const output = await openAI(mode, payload);
      return send(res, 200, output);
    } catch (error) { return send(res, 502, { error: String(error.message || error).slice(0, 300) }); }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed.' });
  const item = STATIC[url.pathname];
  if (!item) return send(res, 404, { error: 'Not found.' });
  try {
    const content = await readFile(join(ROOT, item[0]));
    res.writeHead(200, { 'Content-Type': item[1], 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { send(res, 404, { error: 'Static file unavailable.' }); }
});
server.listen(PORT, HOST, () => console.log(`Dinosaur Horror RPG: http://${HOST}:${PORT} (AI ${process.env.OPENAI_API_KEY ? 'enabled' : 'disabled'})`));
