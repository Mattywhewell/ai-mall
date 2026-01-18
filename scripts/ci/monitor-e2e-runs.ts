#!/usr/bin/env tsx
/**
 * monitor-e2e-runs.ts
 * Simple watcher that polls GitHub Actions for workflow runs on a branch and
 * downloads Playwright report artifacts for failing runs. Summarizes any
 * `error-context.md` files it finds into tmp-ci-artifacts/<runId>/summary.json
 *
 * Usage:
 *  AUTO_ISSUE=true REPO=owner/repo BRANCH=fix/e2e-cookie-and-sitemap tsx scripts/ci/monitor-e2e-runs.ts
 *
 * Notes: requires `gh` CLI authenticated and `tsx` available (already in repo devDependencies).
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const REPO = process.env.REPO || 'Mattywhewell/ai-mall'
const BRANCH = process.env.BRANCH || 'fix/e2e-cookie-and-sitemap'
const POLL_INTERVAL = Number(process.env.POLL_INTERVAL || 15) * 1000
const AUTO_ISSUE = !!process.env.AUTO_ISSUE

function run(cmd: string) {
  try {
    return execSync(cmd, { encoding: 'utf8' })
  } catch (e: any) {
    return e.stdout || e.message || ''
  }
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

async function main() {
  console.log(`[monitor] watching runs for ${REPO} @ ${BRANCH} (poll ${POLL_INTERVAL}ms)`) 
  while (true) {
    const raw = run(`gh run list --repo ${REPO} --branch ${BRANCH} --limit 10 --json databaseId,status,conclusion,headSha,headBranch`)
    let runs
    try { runs = JSON.parse(raw) } catch (e) { console.warn('[monitor] failed to parse JSON from gh run list'); await sleep(POLL_INTERVAL); continue }
    if (!Array.isArray(runs) || runs.length === 0) { await sleep(POLL_INTERVAL); continue }

    // Find the most recent run
    const latest = runs[0]
    console.log(`[monitor] latest run ${latest.databaseId} status=${latest.status} conclusion=${latest.conclusion}`)

    if (latest.status !== 'completed') {
      await sleep(POLL_INTERVAL)
      continue
    }

    if (latest.conclusion === 'success') {
      console.log('[monitor] latest run succeeded; sleeping until next run')
      await sleep(POLL_INTERVAL)
      continue
    }

    // Failing run - download Playwright report artifact
    const runId = latest.databaseId
    const dest = path.join('tmp-ci-artifacts', String(runId))
    console.log(`[monitor] run ${runId} concluded with ${latest.conclusion}. Downloading artifacts to ${dest}`)

    // Attempt to download playwright-report artifact
    const before = fs.existsSync(dest) ? 'exists' : 'new'
    run(`gh run download --repo ${REPO} ${runId} -n playwright-report -D ${dest}`)
    if (!fs.existsSync(dest)) {
      console.warn(`[monitor] download did not create ${dest} - aborting triage`)
      return
    }

    const resultsDir = path.join(dest, 'test-results')
    if (!fs.existsSync(resultsDir)) {
      console.warn('[monitor] no test-results directory present inside artifact')
      return
    }

    const summary: any = { runId, runSha: latest.headSha, branch: latest.headBranch, problems: [] }

    const items = fs.readdirSync(resultsDir)
    for (const item of items) {
      const itemPath = path.join(resultsDir, item)
      const stat = fs.statSync(itemPath)
      if (!stat.isDirectory()) continue

      const errorFile = path.join(itemPath, 'error-context.md')
      const traceZip = path.join(itemPath, 'trace.zip')
      const obj: any = { test: item, hasErrorContext: fs.existsSync(errorFile), hasTraceZip: fs.existsSync(traceZip) }
      if (obj.hasErrorContext) {
        try {
          const content = fs.readFileSync(errorFile, 'utf8')
          obj.errorSnippet = content.slice(0, 1200)
        } catch (e) {
          obj.errorSnippet = 'failed to read error-context.md'
        }
      }
      summary.problems.push(obj)
    }

    const summaryPath = path.join(dest, 'summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
    console.log(`[monitor] wrote triage summary to ${summaryPath}`)

    // Optionally open a GitHub issue to track the failing run
    if (AUTO_ISSUE) {
      const body = `Automated E2E failure triage for run ${runId} on branch ${BRANCH} (sha ${latest.headSha}).\n\nSummary:\n\n${summary.problems.map(p => `- ${p.test} - errorContext:${p.hasErrorContext} trace:${p.hasTraceZip}`).join('\n')}`
      console.log('[monitor] creating GitHub issue (AUTO_ISSUE=true)')
      const out = run(`gh issue create --repo ${REPO} --title "E2E failures: run ${runId}" --body "${body.replace(/"/g, '\"')}" --label e2e-failure`).trim()
      console.log('[monitor] issue create output:', out)
    }

    // Exit after triage; run periodically via CI or developer's watch process
    return
  }
}

main().catch((e) => { console.error('[monitor] fatal error', e); process.exit(1) })
