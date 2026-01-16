#!/usr/bin/env node
/*
  Simple CI watcher for PRs: polls check runs for the PR's HEAD commit and
  when a workflow run completes with status 'failure' it runs targeted
  Playwright tests locally and posts a summary comment on the PR.

  Usage: node scripts/watch-pr-ci.js --pr=16 [--interval=30]

  Requirements: GitHub CLI (`gh`) and Node, and Playwright installed in the repo.
*/

const { spawnSync } = require('child_process');
const args = require('minimist')(process.argv.slice(2));
const PR = args.pr || args.p || process.env.PR_NUMBER || '16';
const INTERVAL = parseInt(args.interval || 30, 10) * 1000;
const OWNER = args.owner || process.env.GITHUB_OWNER || 'Mattywhewell';
const REPO = args.repo || process.env.GITHUB_REPO || 'ai-mall';
const READY_PRS = (args.readyPrs || args.ready || process.env.READY_PRS || '').split(',').map(s => s.trim()).filter(Boolean);

function gh(argsArr) {
  // argsArr is an array of gh CLI arguments
  const res = spawnSync('gh', argsArr, { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`gh ${argsArr.join(' ')} failed: ${res.stderr}`);
  }
  return res.stdout;
}

function getHeadSha(pr) {
  const out = gh(['api', `repos/${OWNER}/${REPO}/pulls/${pr}`, '--jq', '.head.sha']);
  return out.trim();
}

function listCheckRunsForSha(sha) {
  const out = gh(['api', `repos/${OWNER}/${REPO}/commits/${sha}/check-runs`]);
  return JSON.parse(out);
}

function anyFailures(checkRuns) {
  if (!checkRuns || !Array.isArray(checkRuns.check_runs)) return false;
  return checkRuns.check_runs.some(cr => cr.conclusion === 'failure' || cr.conclusion === 'cancelled');
}

function allCompleted(checkRuns) {
  if (!checkRuns || !Array.isArray(checkRuns.check_runs)) return false;
  return checkRuns.check_runs.every(cr => cr.status === 'completed');
}

function postPrComment(pr, body) {
  gh(['pr', 'comment', `${pr}`, '--body', body]);
}

async function isPrMerged(pr) {
  const out = gh(['api', `repos/${OWNER}/${REPO}/pulls/${pr}`, '--jq', '.merged']);
  return out.trim() === 'true';
}

async function isPrDraft(pr) {
  const out = gh(['pr', 'view', `${pr}`, '--json', 'isDraft', '--jq', '.isDraft']);
  return out.trim() === 'true';
}

function markPrReady(pr) {
  try {
    gh(['pr', 'ready', `${pr}`]);
    postPrComment(pr, 'Automated: marking this PR ready for review since PR ' + PR + ' completed successfully.');
  } catch (err) {
    console.error('Failed to mark PR ready:', err);
    // post a comment on the source PR for visibility
    postPrComment(PR, `Failed to mark PR ${pr} as ready: ${String(err).substring(0, 2000)}`);
  }
}

function runTargetedTests() {
  console.log('Running targeted Playwright tests: visual-layers, visual-layers-fallback, rbac, inventory-sync');
  const suites = [
    'tests/e2e/visual-layers.spec.ts',
    'tests/e2e/visual-layers-fallback.spec.ts',
    'tests/e2e/rbac.spec.ts',
    'tests/e2e/inventory-sync.spec.ts'
  ];

  const proc = spawnSync('npx', ['playwright', 'test', ...suites, '--project=chromium', '-j', '1'], { encoding: 'utf8' });
  const out = proc.stdout || '';
  const err = proc.stderr || '';
  const status = proc.status === 0 ? 'passed' : 'failed';

  const summary = `Automated CI-failure follow-up: Playwright targeted suites *${status}* for PR #${PR}.

Stdout:\n\n${out.substring(0, 20000)}\n\nStderr:\n\n${err.substring(0, 20000)}`;
  postPrComment(PR, summary);
}

(async function main() {
  try {
    console.log(`Watching PR #${PR} (${OWNER}/${REPO}) for CI failures. Poll interval: ${INTERVAL}ms`);
    const sha = getHeadSha(PR);
    console.log('PR head sha:', sha);
    let acted = false;
    while (!acted) {
      const cr = listCheckRunsForSha(sha);
      if (allCompleted(cr)) {
        if (anyFailures(cr)) {
          console.log('Detected failing checks — running targeted tests');
          postPrComment(PR, 'Detected failing CI checks — automatically running targeted Playwright suites (visual-layers, rbac, inventory-sync, visual-layers-fallback) and will post results.');
          runTargetedTests();
        } else {
          console.log('All checks completed and passed. No action needed.');
          postPrComment(PR, 'CI completed with passing checks — no additional targeted tests executed.');

          // If configured, mark follow-up PRs as ready when this PR's checks pass or it is merged.
          if (READY_PRS.length > 0) {
            for (const p of READY_PRS) {
              try {
                const isDraft = await isPrDraft(p);
                if (isDraft) {
                  markPrReady(p);
                } else {
                  postPrComment(PR, `PR ${p} is not draft; skipping marking as ready.`);
                }
              } catch (err) {
                postPrComment(PR, `Error while attempting to mark PR ${p} ready: ${String(err).substring(0,2000)}`);
              }
            }
          }
        }

        // If the PR was merged, also mark follow-ups ready (best-effort)
        try {
          const merged = await isPrMerged(PR);
          if (merged && READY_PRS.length > 0) {
            for (const p of READY_PRS) {
              try {
                const isDraft = await isPrDraft(p);
                if (isDraft) {
                  markPrReady(p);
                }
              } catch (err) {
                postPrComment(PR, `Error while attempting to mark PR ${p} ready after merge: ${String(err).substring(0,2000)}`);
              }
            }
          }
        } catch (e) {
          // ignore
        }

        acted = true;
        break;
      }
      await new Promise(r => setTimeout(r, INTERVAL));
    }
  } catch (err) {
    console.error('Watcher failed:', err);
    postPrComment(PR, `CI watcher encountered an error: ${String(err).substring(0, 2000)}`);
    process.exit(1);
  }
})();
