param(
  [string]$TokenArg
)
if ($TokenArg) {
  $token = $TokenArg
} elseif ($env:GH_PAT) {
  $token = $env:GH_PAT
} else {
  Write-Host 'GH_PAT environment variable not set and no token argument provided' ; exit 1
}
Set-Location 'C:\Users\cupca\Documents\ai-mall'
$artifactsDir = Join-Path (Get-Location) 'artifacts'
New-Item -ItemType Directory -Force -Path $artifactsDir | Out-Null
$response = Invoke-RestMethod -Uri 'https://api.github.com/repos/Mattywhewell/ai-mall/actions/runs/21067429305/artifacts' -Headers @{ Authorization = "token $token"; 'User-Agent'='Copilot' }
$artifact = $response.artifacts | Where-Object { $_.name -eq 'playwright-report' }
if (-not $artifact) { Write-Host 'artifact not found'; exit 1 }
$downloadUrl = $artifact.archive_download_url
Write-Host "Downloading artifact id $($artifact.id) ..."
Invoke-WebRequest -Uri $downloadUrl -Headers @{ Authorization = "token $token"; 'User-Agent'='Copilot' } -OutFile (Join-Path $artifactsDir 'playwright-report.zip') -UseBasicParsing
$extractDir = Join-Path $artifactsDir 'playwright-report'
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $extractDir
Expand-Archive -Path (Join-Path $artifactsDir 'playwright-report.zip') -DestinationPath $extractDir -Force
$traces = Get-ChildItem -Path $extractDir -Recurse -Filter '*trace.zip'
Write-Host "Found $($traces.Count) trace zip(s)"
$tracesDir = Join-Path $artifactsDir 'traces'
New-Item -ItemType Directory -Force -Path $tracesDir | Out-Null
foreach ($t in $traces) {
  $dest = Join-Path $tracesDir $t.BaseName
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  Expand-Archive -Path $t.FullName -DestinationPath $dest -Force
}
Write-Host "Extracted traces to $tracesDir"