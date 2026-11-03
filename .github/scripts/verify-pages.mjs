// Validate the GitHub Pages deployment *for the exact main SHA* tested by CI.
// Run only from the read-only validation workflow; do not use PR code or secrets.
import { pathToFileURL } from 'node:url';

export const PAGES_RUN_NAME = 'pages build and deployment';

export function classifyPagesRuns(runs, sha) {
  if (!Array.isArray(runs)) throw new TypeError('GitHub Actions response is missing workflow_runs.');
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new TypeError('Invalid commit SHA.');

  const matching = runs.filter((run) =>
    run && run.name === PAGES_RUN_NAME && run.head_sha === sha
  ).sort((left, right) =>
    Date.parse(right.created_at || '') - Date.parse(left.created_at || '')
  );
  const latest = matching[0];
  if (!latest || latest.status !== 'completed') return { state: 'waiting' };
  if (latest.conclusion === 'success') {
    return { state: 'success', runId: latest.id, url: latest.html_url };
  }
  return {
    state: 'failed',
    runId: latest.id,
    url: latest.html_url,
    conclusion: latest.conclusion || 'unknown'
  };
}

export async function verifyPagesForSha({
  repository, sha, token,
  fetchImpl = fetch,
  sleepImpl = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  maxAttempts = 30,
  intervalMs = 20000
}) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository || '')) {
    throw new TypeError('Invalid GitHub repository name.');
  }
  if (!/^[0-9a-f]{40}$/.test(sha || '')) throw new TypeError('Invalid commit SHA.');
  if (typeof token !== 'string' || !token) throw new Error('GITHUB_TOKEN is required.');
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 ||
      !Number.isInteger(intervalMs) || intervalMs < 0) {
    throw new TypeError('Invalid polling bounds.');
  }

  const endpoint = 'https://api.github.com/repos/' + repository +
    '/actions/runs?head_sha=' + sha + '&per_page=100';
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetchImpl(endpoint, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer ' + token,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    if (!response.ok) {
      throw new Error('GitHub Actions API returned HTTP ' + response.status + '.');
    }
    const payload = await response.json();
    const outcome = classifyPagesRuns(payload?.workflow_runs, sha);
    if (outcome.state === 'success') return outcome;
    if (outcome.state === 'failed') {
      throw new Error('Pages deployment for ' + sha + ' failed (' +
        outcome.conclusion + '): ' + (outcome.url || 'no run URL'));
    }
    if (attempt < maxAttempts) await sleepImpl(intervalMs);
  }
  throw new Error('No successful Pages deployment for ' + sha +
    ' after ' + maxAttempts + ' checks.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.env.GITHUB_REF !== 'refs/heads/main') {
    console.error('Pages verification requires the main branch.');
    process.exitCode = 1;
  } else {
    verifyPagesForSha({
      repository: process.env.GITHUB_REPOSITORY,
      sha: process.env.GITHUB_SHA,
      token: process.env.GITHUB_TOKEN
    }).then((result) => {
      console.log('Verified Pages SUCCESS for exact main SHA ' +
        process.env.GITHUB_SHA + ': ' + result.url);
    }).catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
  }
}
