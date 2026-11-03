# DHR-001 / Issue #67 — independent post-bot-merge main verification

## Observed failure (November 3, 2026)

PR [#66](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/66) was squash-merged by `github-actions[bot]` as commit
`d03c9e933569773a6b2622912fc75dfae9635c26`. Its PR-head engine check passed
([41701985687](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41701985687)),
and the merged SHA received a successful native Pages build/deployment
([41702704501](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41702704501)).
There was **no `Validate deterministic engine` push run for that merge SHA** in the Actions run history.
The later human-authored `main` commit `68441b14dff03c0c3536ab674f3331007ff915ac`
did run engine validation ([41705394422](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/actions/runs/41705394422)),
but that does not retroactively prove a run on the bot-merged source revision.

Root cause: GitHub Actions workflow operations authenticated with the default `GITHUB_TOKEN`
do not normally create additional workflow runs for downstream events (including a `push`
created by an Actions bot). GitHub explicitly exempts `repository_dispatch` and
`workflow_dispatch` from that recursion limit. The Pages infrastructure deployed the commit,
but Pages success did **not** certify the independent `node-test` job at that SHA.

## New verification path

1. The existing guarded, docs-only `pull_request_target` merge job continues to call
   `gh pr merge --auto --squash` under existing branch protection. Only after GitHub reports
   `merged_at` and a valid `merge_commit_sha` does it call the repository's
   `repository_dispatch` endpoint with event `verify-merged-main`.
2. The original `Validate deterministic engine` workflow now accepts that dispatch and
   runs its **same** `node-test` suite and syntax checks, on the default branch SHA.
   The workflow retains only `contents: read` and `actions: read` permissions.
3. After `node-test` succeeds, `verify-main-pages` checks the GitHub Actions API for
   a completed, successful `pages build and deployment` **whose `head_sha` equals
   `GITHUB_SHA`**. It retries temporary queued/in-progress/absent results, but fails
   on failed deployment, API error, malformed response or timeout. PR tests and
   Pages success for a different SHA do not count.
4. Native auto-merge can remain pending longer than the dispatch job's bounded wait
   (for example, pending required review). A read-only scheduled validation on
   `main` at minutes 7 and 37 of every hour acts as the independent fallback,
   and `workflow_dispatch` permits manual re-verification. GitHub scheduled
   tasks are best-effort, may be delayed, and are **not** a time-bound SLA.

The dispatched event includes the observed merge SHA and PR number as **audit metadata only**.
It is not used to choose executable source: the workflow always validates
GitHub's actual event commit from `main`. This prevents arbitrary client payloads
from choosing unreviewed pull-request code to execute. The setup does not require
a PAT, a GitHub App key, external service, new secret or branch-rule exception.

## Reproducible check for the Integration Director

- Review [PR #66](https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pull/66)
  and its pre-fix Actions records: successful PR-head check and Pages on
  `d03c9e9`, absent merged-main engine run.
- On this PR, confirm the `node-test` job passes, including
  `tests/post-merge-ci.test.mjs` normal/failure/mismatch/delay/authorization fixtures.
  `verify-main-pages` is intentionally skipped on PR refs.
- **After this PR is reviewed and merged by the Integration Director**,
  use the Actions `Run workflow` control on `main` for
  `Validate deterministic engine`, or wait for its scheduled `main` run.
  Confirm `node-test` **and** `verify-main-pages` succeed, recording the exact
  `GITHUB_SHA` and the Pages run link from the check log.
- For a later *authorized docs-only* bot merge, compare its PR's `merge_commit_sha`
  against the dispatched/scheduled `node-test` and Pages run SHA. A dispatch
  after a newly advanced `main` might validate a later descendant SHA;
  preserve that distinction in acceptance evidence. If checks fail or no
  independent run is observed, do not mark the merge verified.
- A successful Pages Actions run verifies deployment workflow status, **not**
  browser visuals, HTTP response correctness or live Cloudflare Worker behavior.
  Those require separate manual checks.

## Security and compatibility boundary

This issue adds CI-only behavior, unit tests and documentation. It does not
change Evolved rules, gameplay, scenario fingerprints, saves, worker secrets,
the auto-merge filename allowlist, or branch protection. The privileged
merge workflow **never checks out PR code**, and gameplay auto-merge remains
prohibited. Accepted roadmap completion remains **38/100** until the
Integration Director independently accepts the relevant full gate.
