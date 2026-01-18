param(
  [Parameter(Mandatory=$true)] [long]$RunId,
  [int]$IntervalSeconds = 15,
  [int]$MaxAttempts = 40
)
for ($i=0; $i -lt $MaxAttempts; $i++) {
  $r = gh run view $RunId --repo Mattywhewell/ai-mall --json status,conclusion,startedAt,updatedAt | ConvertFrom-Json
  Write-Output ("$(Get-Date -Format o) - attempt $($i+1)/$MaxAttempts - status=$($r.status) conclusion=$($r.conclusion) updatedAt=$($r.updatedAt)")
  if ($r.status -eq 'completed') { exit 0 }
  Start-Sleep -Seconds $IntervalSeconds
}
Write-Output "Timed out waiting for run $RunId to complete"
exit 2
