param(
  [string]$sha = '4189c810567cd88afccb1055ceb07a72f575c4af',
  [int]$pollSeconds = 10
)

Write-Host "watch-playwright: polling for Playwright runs with headSha=$sha (branch: feat/rbac-ssr-cookie-fallback) every $pollSeconds s"
while ($true) {
  try {
    $raw = gh run list --repo Mattywhewell/ai-mall --limit 250 --json headSha,databaseId,workflowName,conclusion
    $runs = $raw | ConvertFrom-Json
  } catch {
    Write-Host "watch-playwright: gh call failed, retrying..."
    Start-Sleep -Seconds 5
    continue
  }

  $ps = $runs | Where-Object { $_.headSha -eq $sha -and ($_.workflowName -match 'Playwright' -or $_.workflowName -match 'Playwright E2E' -or $_.workflowName -match 'Playwright E2E Tests') }
  if ($ps) {
    foreach ($r in $ps) {
      if ($r.conclusion -ne $null -and $r.conclusion -ne '') {
        Write-Host "FOUND completed Playwright run $($r.databaseId) status=$($r.conclusion)"
        Write-Host "Fetching logs for run $($r.databaseId)..."
        gh run view $r.databaseId --repo Mattywhewell/ai-mall --log
        exit 0
      } else {
        Write-Host "Detected Playwright run $($r.databaseId) not completed yet (queued/in_progress)"
      }
    }
  } else {
    Write-Host "No Playwright runs yet for commit $sha"
  }

  Start-Sleep -Seconds $pollSeconds
}
