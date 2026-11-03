import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PAGES_RUN_NAME, classifyPagesRuns, verifyPagesForSha
} from '../.github/scripts/verify-pages.mjs';

const SHA = 'a'.repeat(40);
const OTHER = 'b'.repeat(40);
const REPO = 'Diabolicdonut/Dinosaur-Horror-RPG';
const run = (values = {}) => ({
  id: 100,
  name: PAGES_RUN_NAME,
  event: 'dynamic',
  head_sha: SHA,
  status: 'completed',
  conclusion: 'success',
  created_at: '2026-11-03T19:22:46Z',
  html_url: 'https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/100',
  ...values
});
const successApi = (runs) => ({
  ok: true,
  status: 200,
  async json() { return { workflow_runs: runs }; }
});

test('matching successful Pages deployment is evidence for the exact tested SHA', () => {
  const result = classifyPagesRuns([
    run({ id: 2, head_sha: OTHER }),
    run({ id: 3, name: 'Validate deterministic engine' }),
    run()
  ], SHA);
  assert.deepEqual(result, {
    state: 'success',
    runId: 100,
    url: 'https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/100'
  });
});

test('a different commit or only a node-test run is not deployment evidence', () => {
  assert.deepEqual(classifyPagesRuns([run({ head_sha: OTHER })], SHA), { state: 'waiting' });
  assert.deepEqual(classifyPagesRuns([
    run({ name: 'Validate deterministic engine' })
  ], SHA), { state: 'waiting' });
});

test('queued and in-progress Pages runs are not considered deployed', () => {
  for (const status of ['queued', 'in_progress', 'waiting']) {
    assert.deepEqual(classifyPagesRuns([run({ status, conclusion: null })], SHA),
      { state: 'waiting' });
  }
});

test('a later failed deployment overrides an older successful attempt', () => {
  const result = classifyPagesRuns([
    run({ id: 1, created_at: '2026-11-03T18:00:00Z' }),
    run({ id: 2, created_at: '2026-11-03T20:00:00Z', conclusion: 'failure' })
  ], SHA);
  assert.equal(result.state, 'failed');
  assert.equal(result.runId, 2);
  assert.equal(result.conclusion, 'failure');
});

test('stale unsuccessful Pages runs never override a newer successful deployment', () => {
  assert.equal(classifyPagesRuns([
    run({ id: 1, created_at: '2026-11-03T18:00:00Z', conclusion: 'failure' }),
    run({ id: 2, created_at: '2026-11-03T20:00:00Z' })
  ], SHA).state, 'success');
});

test('invalid API shape and invalid SHAs fail closed', () => {
  assert.throws(() => classifyPagesRuns(null, SHA), /workflow_runs/);
  assert.throws(() => classifyPagesRuns([], 'not-a-sha'), /Invalid commit SHA/);
});

test('polls only pending Pages runs and succeeds when exact SHA deploys', async () => {
  const responses = [
    successApi([run({ status: 'in_progress', conclusion: null })]),
    successApi([run({ head_sha: OTHER })]),
    successApi([run()])
  ];
  const checked = [];
  const sleeps = [];
  const result = await verifyPagesForSha({
    repository: REPO, sha: SHA, token: 'fake-token',
    maxAttempts: 3, intervalMs: 5,
    sleepImpl: async (ms) => { sleeps.push(ms); },
    fetchImpl: async (url, options) => {
      checked.push({ url, options });
      return responses[checked.length - 1];
    }
  });
  assert.equal(result.state, 'success');
  assert.equal(checked.length, 3);
  assert.deepEqual(sleeps, [5, 5]);
  for (const { url, options } of checked) {
    assert(url.includes('/actions/runs?head_sha=' + SHA));
    assert.equal(options.headers.Authorization, 'Bearer fake-token');
  }
});

test('never counts an older historic Pages success as current SHA proof', async () => {
  await assert.rejects(
    verifyPagesForSha({
      repository: REPO, sha: SHA, token: 'fake-token', maxAttempts: 2,
      intervalMs: 0, sleepImpl: async () => {},
      fetchImpl: async () => successApi([run({ head_sha: OTHER })])
    }),
    /No successful Pages deployment/
  );
});

test('fails immediately on completed unsuccessful deployment', async () => {
  let calls = 0;
  await assert.rejects(
    verifyPagesForSha({
      repository: REPO, sha: SHA, token: 'fake-token', maxAttempts: 3,
      sleepImpl: async () => { throw Error('should not sleep'); },
      fetchImpl: async () => {
        calls += 1;
        return successApi([run({ conclusion: 'failure' })]);
      }
    }),
    /Pages deployment.*failed/
  );
  assert.equal(calls, 1);
});

test('API errors and missing run records fail closed without false success', async () => {
  await assert.rejects(
    verifyPagesForSha({
      repository: REPO, sha: SHA, token: 'fake-token',
      fetchImpl: async () => ({ ok: false, status: 403 })
    }),
    /HTTP 403/
  );
  await assert.rejects(
    verifyPagesForSha({
      repository: REPO, sha: SHA, token: 'fake-token',
      fetchImpl: async () => successApi(undefined)
    }),
    /workflow_runs/
  );
});

test('malicious or malformed repository/SHA inputs cannot change the API target', async () => {
  let contacted = false;
  const options = {
    repository: REPO, sha: SHA, token: 'fake-token',
    fetchImpl: async () => { contacted = true; throw Error('must not call'); }
  };
  await assert.rejects(verifyPagesForSha({ ...options, repository: 'evil/repo?ref=main' }), /Invalid GitHub repository/);
  await assert.rejects(verifyPagesForSha({ ...options, sha: '../main' }), /Invalid commit SHA/);
  await assert.rejects(verifyPagesForSha({ ...options, token: '' }), /GITHUB_TOKEN/);
  await assert.rejects(verifyPagesForSha({ ...options, maxAttempts: 0 }), /Invalid polling bounds/);
  assert.equal(contacted, false);
});

test('automation keeps read-only main verification, independent dispatch and fallback', () => {
  const validation = readFileSync(new URL('../.github/workflows/validate.yml', import.meta.url), 'utf8');
  const merging = readFileSync(new URL('../.github/workflows/auto-merge-safe.yml', import.meta.url), 'utf8');
  assert.match(validation, /repository_dispatch:\s*\n\s*types: \[verify-merged-main\]/);
  assert.match(validation, /schedule:\s*\n\s*- cron:/);
  assert.match(validation, /workflow_dispatch:/);
  assert.match(validation, /permissions:\s*\n\s*contents: read\s*\n\s*actions: read/);
  assert.doesNotMatch(validation, /contents: write|actions: write|pull-requests: write|pull_request_target:/);
  assert.match(validation, /needs: node-test/);
  assert.match(validation, /node \.github\/scripts\/verify-pages\.mjs/);
  assert.match(validation, /github\.ref == 'refs\/heads\/main'/);
  assert.match(merging, /gh pr merge "\$PR_NUMBER" --repo "\$GH_REPO" --auto --squash/);
  assert.match(merging, /docs\/parallel-development\/\*\.md/);
  assert.match(merging, /merged_at/);
  assert.match(merging, /repos\/\$\{GH_REPO\}\/dispatches/);
  assert(merging.indexOf('merged_at') < merging.indexOf('-f event_type=verify-merged-main'));
  assert.match(merging, /scheduled main CI will catch a later merge/);
});
