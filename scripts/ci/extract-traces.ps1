# Extract all trace.zip files under a given run directory
param(
  [string]$RunDir = 'ci-artifacts\run-21031659807'
)
$zips = Get-ChildItem -Path $RunDir -Recurse -Filter 'trace.zip' -File -ErrorAction SilentlyContinue
if (-not $zips -or $zips.Count -eq 0) {
  Write-Output 'No trace.zip files found under ' + $RunDir
  exit 0
}
foreach ($f in $zips) {
  $dest = Join-Path $f.Directory.FullName 'trace-extracted'
  if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }
  try {
    Expand-Archive -Path $f.FullName -DestinationPath $dest -Force
    Write-Output "Extracted: $($f.FullName) -> $dest"
  } catch {
    Write-Output "Failed to extract: $($f.FullName) => $($_.Exception.Message)"
  }
}
