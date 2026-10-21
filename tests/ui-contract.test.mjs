import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');

test('every browser element looked up by ID exists in the HTML', () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  const selectors = [...app.matchAll(/\$\('([^']+)'\)/g)].map(m => m[1]);
  const missing = [...new Set(selectors.filter(x => !ids.has(x)))];
  assert.deepEqual(missing, [], 'Missing HTML IDs: ' + missing.join(', '));
});
test('browser has a token persistence opt-in, working status, test, and debug export controls', () => {
  assert(html.includes('id="game-token" type="password"'));
  for (const id of ['remember-token', 'forget-token', 'test-ai',
    'ai-status', 'ai-status-label', 'ai-status-detail', 'export-debug']) {
    assert(html.includes('id="' + id + '"'), id);
  }
  assert(app.includes("'/v1/gm/status'"));
  assert(app.includes("makeDebugReport("));
  assert(app.includes("storageWrite(TOKEN_KEY, secret())"));
  assert(app.includes("initialize();"));
});
