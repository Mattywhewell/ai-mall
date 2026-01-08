<#
PowerShell helper: Run the rls-fix-top5.sql migration (dry-run & real run) and capture logs.
Usage:
  # Set PGPASSWORD env var (recommended)
  $env:PGPASSWORD = "your_password_here"
  # Dry-run only
  ./scripts/run-rls-top5.ps1 -Host db.host -Port 5432 -User postgres -Db mydb -Mode dryrun
  # Real run
  ./scripts/run-rls-top5.ps1 -Host db.host -Port 5432 -User postgres -Db mydb -Mode run

The script writes logs to the workspace root: dry_run.log and migration_run.log
It exits with psql's exit code for the real run.
#>
param(
  [Parameter(Mandatory=$true)][string]$Host,
  [Parameter(Mandatory=$false)][int]$Port = 5432,
  [Parameter(Mandatory=$true)][string]$User,
  [Parameter(Mandatory=$true)][string]$Db,
  [Parameter(Mandatory=$false)][ValidateSet('dryrun','run')][string]$Mode = 'dryrun',
  [Parameter(Mandatory=$false)][string]$SqlFile = "migrations/rls-fix-top5.sql"
)

if (-not $env:PGPASSWORD) {
  Write-Host "PGPASSWORD not set. Set it with: $env:PGPASSWORD = 'your_password'" -ForegroundColor Yellow
  exit 2
}

# Build connection string
$psqlConn = "host=$Host port=$Port user=$User dbname=$Db sslmode=require"

if ($Mode -eq 'dryrun') {
  Write-Host "Running dry-run (BEGIN; ... ROLLBACK;) against $Host/$Db"
  psql $psqlConn -c "BEGIN; \i $SqlFile; ROLLBACK;" > dry_run.log 2>&1
  Write-Host "Dry-run complete — tail of dry_run.log: "
  Get-Content .\dry_run.log -Tail 200
  exit 0
}

Write-Host "Running REAL migration against $Host/$Db — logs: migration_run.log"
psql $psqlConn -f $SqlFile > migration_run.log 2>&1
$rc = $LASTEXITCODE
Write-Host "--- tail of migration_run.log ---"
Get-Content .\migration_run.log -Tail 300
Write-Host "psql exit code: $rc"
exit $rc
