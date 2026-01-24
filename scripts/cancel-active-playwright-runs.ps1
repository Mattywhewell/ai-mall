$runs = gh run list --repo Mattywhewell/ai-mall --limit 250 --json headSha,databaseId,workflowName,status,conclusion,createdAt | ConvertFrom-Json
$active = $runs | Where-Object { $_.workflowName -match 'Playwright' -and $_.status -ne 'completed' -and $_.status -ne 'skipped' }
if (-not $active -or $active.Count -eq 0) {
  Write-Host 'No active Playwright runs found'
  exit 0
}
Write-Host 'Active Playwright runs to cancel:'
$active | Format-Table databaseId,workflowName,status,headSha,createdAt -AutoSize
foreach ($r in $active) {
  Write-Host "Cancelling run $($r.databaseId) ..."
  gh run cancel $r.databaseId --repo Mattywhewell/ai-mall | Out-Null
  Write-Host "Cancelled: $($r.databaseId)"
}
Write-Host 'Verifying...'
Start-Sleep -s 2
$remaining = gh run list --repo Mattywhewell/ai-mall --limit 250 --json headSha,databaseId,workflowName,status | ConvertFrom-Json | Where-Object { $_.workflowName -match 'Playwright' -and $_.status -ne 'completed' -and $_.status -ne 'skipped' }
if (-not $remaining -or $remaining.Count -eq 0) {
  Write-Host 'No active Playwright runs remain'
} else {
  $remaining | Format-Table databaseId,workflowName,status,headSha -AutoSize
}