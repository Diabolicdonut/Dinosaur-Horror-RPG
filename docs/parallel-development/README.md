# Parallel development: initial auto-merge pilot

This is **not** a blanket authorization to merge Dinosaur Horror gameplay changes.

## How it works

- Normal workers create their own branches and pull requests against `main`.
- The existing `node-test` required check, branch currency requirement, and other `Protect Main` rules remain in force.
- A PR gets automatic merge **only when explicitly labeled** `safe-auto-merge`.
- Initially, that PR must change **only** Markdown files directly in `docs/parallel-development/`. Any game code, shared roadmap, status file, configuration, or other path is excluded.
- The `Verify automatic-merge eligibility / auto-merge-policy` check enforces the allowlist on pull requests, including follow-up commits. The privileged workflow independently checks the changed-file list before invoking GitHub native auto-merge.
- If a required check fails, a branch is stale/conflicting, or permission is missing, automatic merge does not bypass the block.

## Required administrator setup after this pilot PR merges

1. Verify that `Verify automatic-merge eligibility` runs successfully on a regular pull request.
2. Add the `auto-merge-policy` job as a **required** check in the existing `Protect Main` ruleset. Retain `node-test` as required and retain the strict up-to-date requirement.
3. Create the GitHub label `safe-auto-merge` and only apply it to reviewed, docs-only pilot PRs.
4. Check the next pilot PR's Actions and merged-main results before expanding automation.

## Important limits

The label is an **approval signal**, not an automatic classification. Workers must not self-label unless explicitly preauthorized by the project owner. A label alone is not enough for code: the workflow's filename allowlist rejects code paths.

Do not extend this allowlist to engine code, gameplay rules, save migration, secrets, scenario authority or progress/checkpoint files without a separate design and test review. A normal `npm test` pass is not proof of a correct game design.

GitHub states that Actions operations using the default `GITHUB_TOKEN` do not necessarily trigger follow-on push workflows. Before using GitHub Actions to merge production gameplay changes, verify or implement a reliable independent post-merge `main` validation/deployment trigger (for example, an appropriately scoped GitHub App token). Do not mark gameplay milestones accepted solely because this auto-merge job succeeded.

The Integration Director alone records accepted gameplay checkpoints after verified `main` CI, deployment, save compatibility and roadmap/audit reconciliation. This pilot does not modify those ledgers.
