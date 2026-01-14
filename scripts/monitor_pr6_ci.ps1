$pr = 6
$repo = "Mattywhewell/ai-mall"
while ($true) {
  $json = gh pr view $pr --repo $repo --json statusCheckRollup 2>$null
  if (-not $json) {
    Write-Host "No checks yet; waiting 15s"
    Start-Sleep -Seconds 15
    continue
  }
  $obj = $json | ConvertFrom-Json
  $checks = $obj.statusCheckRollup.checks
  $inProgress = $false
  foreach ($c in $checks) {
    if ($c.status -ne 'COMPLETED' -or ($c.conclusion -eq $null -or $c.conclusion -eq '')) { $inProgress = $true }
  }
  if (-not $inProgress) { break }
  Write-Host "$(Get-Date -Format o) CI still in progress..."
  Start-Sleep -Seconds 15
}
Write-Host "CI run completed; final check statuses:"
foreach ($c in $checks) {
  $status = if ($c.conclusion -eq $null -or $c.conclusion -eq '') { $c.status } else { $c.conclusion }
  Write-Host "$($c.name) -> $status ($($c.workflowName) : $($c.detailsUrl))"
}
# Download e2e workflow artifacts if present
$e2eJob = $checks | Where-Object { $_.name -eq 'e2e' }
if ($e2eJob) {
  Write-Host "E2E job details: $($e2eJob.detailsUrl)"
}
