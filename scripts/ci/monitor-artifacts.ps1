# Poll GitHub Actions for artifacts on branch ci/rtr-temp-pr and download+extract them
$ErrorActionPreference = 'Continue'
mkdir ci-artifacts -Force | Out-Null
Write-Output "Starting CI artifacts monitor for branch ci/rtr-temp-pr"
while ($true) {
  try {
    $headers = @{ 'User-Agent' = 'ci-monitor' }
    if ($env:GITHUB_TOKEN) { $headers['Authorization'] = "token $env:GITHUB_TOKEN" }

    $runs = Invoke-RestMethod -Uri 'https://api.github.com/repos/Mattywhewell/ai-mall/actions/runs?branch=ci/rtr-temp-pr&per_page=20' -Headers $headers
    foreach ($run in $runs.workflow_runs) {
      $runId = $run.id
      try { $artifacts = Invoke-RestMethod -Uri $run.artifacts_url -Headers $headers } catch { if ($_.Exception.Response -and $_.Exception.Response.StatusCode -eq 403) { Write-Output "Rate limit or auth error; backing off for 120s"; Start-Sleep -Seconds 120; continue } else { throw $_ } }
      if ($artifacts.total_count -gt 0) {
        $outdir = Join-Path 'ci-artifacts' ("run-$runId")
        if (-not (Test-Path $outdir)) {
          New-Item -ItemType Directory -Path $outdir | Out-Null
          foreach ($artifact in $artifacts.artifacts) {
            $zipPath = Join-Path $outdir ($artifact.name + '.zip')
            Write-Output ("Downloading artifact " + $artifact.name + " for run " + $runId + "...")
            try {
              Invoke-WebRequest -Uri $artifact.archive_download_url -Headers @{ 'User-Agent' = 'ci-monitor'; 'Accept' = 'application/vnd.github+json' } -OutFile $zipPath -UseBasicParsing -ErrorAction Stop
              Write-Output ("Downloaded " + ${zipPath})
              try {
                Expand-Archive -Path ${zipPath} -DestinationPath (Join-Path $outdir 'trace-extracted') -Force -ErrorAction Stop
                Write-Output ("Extracted " + ${zipPath})
              } catch {
                Write-Output ("Failed to extract " + ${zipPath} + ": $_")
              }
            } catch {
              Write-Output ("Failed to download " + $artifact.archive_download_url + ": $_")
            }
          }
          Write-Output "Artifacts saved to $outdir"
        }
      }
    }
  } catch {
    Write-Output "Monitor error: $_"
  }
  Start-Sleep -Seconds 30
}
