param(
  [int]$IntervalSeconds = 20,
  [string]$Branch = 'ci/rtr-temp-pr',
  [int]$Limit = 200
)

Set-StrictMode -Version Latest

$processedFile = Join-Path 'ci-artifacts' 'processed-runs.json'
if (-not (Test-Path 'ci-artifacts')) { New-Item -ItemType Directory -Path 'ci-artifacts' | Out-Null }
if (-not (Test-Path $processedFile)) { @() | ConvertTo-Json | Out-File -FilePath $processedFile -Encoding utf8 }

function Get-Processed {
  try { return (Get-Content $processedFile -Raw | ConvertFrom-Json) } catch { return @() }
}

function Mark-Processed($runId) {
  $arr = Get-Processed
  $arr += $runId
  $arr | ConvertTo-Json | Out-File -FilePath $processedFile -Encoding utf8
}

Write-Output "[ci-monitor] watching branch '$Branch' (interval ${IntervalSeconds}s)"

while ($true) {
  try {
    $runs = gh run list --branch $Branch --limit $Limit --json databaseId,name,status,conclusion,createdAt | ConvertFrom-Json
    if (-not $runs) { Start-Sleep -Seconds $IntervalSeconds; continue }

    $processed = Get-Processed

    foreach ($r in $runs) {
      $id = $r.databaseId
      if ($processed -contains $id) { continue }

      if ($r.status -eq 'completed') {
        Write-Output "[ci-monitor] Found completed run $id ($($r.name)) - processing..."

        # Prepare outdir
        $outdir = Join-Path 'ci-artifacts' "run-$id"
        if (-not (Test-Path $outdir)) { New-Item -ItemType Directory -Path $outdir | Out-Null }

        # Download playwright-report artifact (best-effort)
        try {
          Write-Output "[ci-monitor] Downloading artifact for run $id"
          gh run download $id --name playwright-report --dir $outdir 2>$null
          Write-Output "[ci-monitor] Download complete for run $id"
        } catch {
          Write-Output "[ci-monitor] artifact download failed for run $id: $_"
        }

        # Extract traces
        try {
          & pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/ci/extract-traces.ps1 -RunDir $outdir
          & pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/ci/merge-traces.ps1 -RunDir $outdir
          Write-Output "[ci-monitor] Extract & merge complete for run $id"
        } catch {
          Write-Output "[ci-monitor] extract/merge failed for run $id: $_"
        }

        # Run sweep
        try {
          node scripts/ci/rtr-sweep.js run-$id
          # Capture latest sweep summary for aggregation
          $sweepPath = Join-Path 'ci-artifacts' 'ci-rtr-sweep.json'
          if (Test-Path $sweepPath) {
            $summary = Get-Content $sweepPath -Raw | ConvertFrom-Json
            $aggPath = Join-Path 'ci-artifacts' 'ci-rtr-sweep-aggregate.json'
            $agg = @()
            if (Test-Path $aggPath) { try { $agg = Get-Content $aggPath -Raw | ConvertFrom-Json } catch {} }
            $agg += $summary
            $agg | ConvertTo-Json -Depth 5 | Out-File -FilePath $aggPath -Encoding utf8
            Write-Output "[ci-monitor] sweeps aggregated for run $id"
          }
        } catch {
          Write-Output "[ci-monitor] sweep failed for run $id: $_"
        }

        Mark-Processed $id
        Write-Output "[ci-monitor] Processing complete for run $id"
      }
    }
  } catch {
    Write-Output "[ci-monitor] monitor error: $_"
  }

  Start-Sleep -Seconds $IntervalSeconds
}
