$jobId = 61294564238
while ($true) {
  $info = gh api repos/Mattywhewell/ai-mall/actions/jobs/$jobId -H "Accept: application/vnd.github+json" --jq '.status + " " + (.conclusion // "null") + " started=" + (.started_at // "null") + " completed=" + (.completed_at // "null")'
  Write-Output "$(Get-Date -Format o) - $info"
  # Print any DIAG lines that look interesting
  gh run view --job=$jobId --repo Mattywhewell/ai-mall --log | Select-String -Pattern 'DIAG: AuthContext|commitRole|watcher skip commit|commitRole {source: server-marker|TimeoutError|Expected: "null"|Received:' -SimpleMatch -Context 0,0 | ForEach-Object { Write-Output $_.Line }
  $status = gh api repos/Mattywhewell/ai-mall/actions/jobs/$jobId -H "Accept: application/vnd.github+json" --jq '.status'
  if ($status -eq 'completed') {
    Write-Output "JOB_COMPLETED"
    break
  }
  Start-Sleep -Seconds 20
}
Write-Output "poll script exiting"