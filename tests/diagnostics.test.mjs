import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiagnostics, makeDebugReport, redactSensitive, DEBUG_SCHEMA } from '../src/diagnostics.mjs';
import { newGame, step } from '../src/engine.mjs';
import { SCENARIO } from '../src/scenario.mjs';

test('debug report includes full deterministic state, seed and hidden predator position', () => {
  const state = step(newGame(1407), 'move lobby').state;
  const report = makeDebugReport({
    state, scenario: SCENARIO, transcript: [{ text: 'Moved to lobby' }],
    diagnostic: [], aiStatus: { status: 'ready', version: '004' },
    token: 'private-example-token', tokenRemembered: true, aiEnabled: true,
    savedGameAvailable: true,
    client: { build: '004', origin: 'https://diabolicdonut.github.io',
      path: '/Dinosaur-Horror-RPG/', userAgent: 'Test Agent',
      worker: 'https://dinosaur-rpg.diabolicdonut.workers.dev' }
  });
  assert.equal(report.schema_version, DEBUG_SCHEMA);
  assert.equal(report.game.state.initialSeed, 1407);
  assert.equal(report.game.state.rng, state.rng);
  assert.equal(report.game.state.dinosaurs[0].location, state.dinosaurs[0].location);
  assert.equal(report.game.state.player.location, 'lobby');
  assert.equal(report.ai.tokenPresent, true);
  assert.equal(report.ai.tokenRemembered, true);
  assert.equal('token' in report.ai, false);
});
test('debug report redacts token in command history, AI payload, events and error text', () => {
  const token = 'my-private-game-secret-ABCDE123';
  const state = newGame(1234);
  state.history = [{ command: 'say ' + token, events: [{ text: 'Bad token: ' + token }] }];
  const report = makeDebugReport({
    state, scenario: SCENARIO, transcript: [{ text: 'Bearer ' + token }],
    diagnostic: [{ payload: { Authorization: 'Bearer ' + token, game_token: token },
      api: 'sk-proj-abcdef0123456789XYZ', text: token }],
    aiStatus: { lastFailure: token, status: 'error' },
    token, aiEnabled: true,
    client: { build: '004', origin: 'https://example.test', path: '/',
      userAgent: 'test', worker: 'https://worker.example.test' }
  });
  const json = JSON.stringify(report);
  assert(!json.includes(token));
  assert(!json.includes('sk-proj-abcdef0123456789XYZ'));
  assert(json.includes('[REDACTED'));
  assert.equal(report.diagnostics[0].payload.game_token, '[REDACTED]');
});
test('bounded diagnostics contain timestamped, sanitized events', () => {
  const log = createDiagnostics(2);
  log.add({ kind: '1', text: 'SECRET12345' }, 'SECRET12345');
  log.add({ kind: '2' });
  log.add({ kind: '3' });
  const snapshot = log.snapshot();
  assert.equal(snapshot.length, 2);
  assert.deepEqual(snapshot.map(x => x.kind), ['2', '3']);
  assert(snapshot.every(x => typeof x.at === 'string'));
});
test('sanitize known secret field names and bearer credentials', () => {
  const scrubbed = redactSensitive({
    GAME_TOKEN: 'does-not-appear',
    nested: { OPENAI_API_KEY: 'sk-proj-aaaaabbbbbbccccc', content: 'Bearer longvalue' }
  });
  assert.equal(scrubbed.GAME_TOKEN, '[REDACTED]');
  assert.equal(scrubbed.nested.OPENAI_API_KEY, '[REDACTED]');
  assert(scrubbed.nested.content.includes('[REDACTED]'));
});
