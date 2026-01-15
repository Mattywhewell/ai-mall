param(
  [string]$RunDir = 'ci-artifacts\run-21031659807'
)
$dest = Join-Path $RunDir 'trace-extracted'
if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }
$dirs = Get-ChildItem -Path $RunDir -Recurse -Directory -Filter 'trace-extracted' -ErrorAction SilentlyContinue
if (-not $dirs) { Write-Output "No per-test trace-extracted dirs found under $RunDir"; exit 0 }
foreach ($d in $dirs) {
  Write-Output "Merging $($d.FullName) -> $dest"
  Get-ChildItem -Path $d.FullName -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($d.FullName.Length).TrimStart('\')
    $out = Join-Path $dest $rel
    $outDir = Split-Path $out -Parent
    if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
    Copy-Item -Path $_.FullName -Destination $out -Force
  }
}
Write-Output "Merged files count: " + (Get-ChildItem -Path $dest -Recurse -File | Measure-Object).Count
