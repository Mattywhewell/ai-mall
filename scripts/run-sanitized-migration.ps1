# PowerShell script to safely run sanitized SQL migration
# Usage (PowerShell):
#   $env:PGHOST='localhost'; $env:PGUSER='postgres'; $env:PGPASSWORD='password'; $env:PGDATABASE='your_db'; .\scripts\run-sanitized-migration.ps1

$scriptPath = Join-Path $PSScriptRoot '..\migrations\supabase-new-features-migration-sanitized.sql'
if (-not (Test-Path $scriptPath)) {
  Write-Error "Migration file not found: $scriptPath"
  exit 1
}

# Quick safety checks: ensure the file is SQL and does not contain TypeScript/JS markers
$content = Get-Content $scriptPath -Raw
if ($content -match "^\s*export\b" -or $content -match "^\s*//") {
  Write-Error "Migration file contains non-SQL content. Aborting."
  exit 1
}

# Run using psql (ensure psql is available in PATH and env vars set)
$psql = "psql"
$env:PGPASSWORD = $env:PGPASSWORD
$cmd = "$psql --set ON_ERROR_STOP=on -h $env:PGHOST -U $env:PGUSER -d $env:PGDATABASE -f `"$scriptPath`""
Write-Host "Running migration: $scriptPath"
Invoke-Expression $cmd

if ($LASTEXITCODE -ne 0) {
  Write-Error "Migration failed with exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}
Write-Host "Migration finished successfully."