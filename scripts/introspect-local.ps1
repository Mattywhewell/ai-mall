# PowerShell convenience wrapper to run introspection locally (no uploads)
# Usage: .\scripts\introspect-local.ps1
param()
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$dotenvPath = $env:DOTENV_PATH; if (-not $dotenvPath) { $dotenvPath = '.env.local' }
if (Test-Path $dotenvPath) { $env:DOTENV_CONFIG_PATH = $dotenvPath; Write-Output "Loaded env from $dotenvPath" } else { Write-Warning "No $dotenvPath found, relying on env vars." }

$timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$logDir = Join-Path (Get-Location) "introspect-logs-$timestamp"
New-Item -ItemType Directory -Path $logDir | Out-Null

Write-Output "🔧 Running DB connect test..."
& node -r dotenv/config (Join-Path $scriptDir 'ci-supabase-dbconnect.js') *> (Join-Path $logDir 'dbconnect.log') 2>&1

Write-Output "🔍 Running Supabase introspection..."
try { & node -r dotenv/config (Join-Path $scriptDir 'ci-supabase-introspect.js') 2>&1 | Tee-Object -FilePath (Join-Path $logDir 'supabase-introspect.log') } catch { Write-Warning "Introspection finished with errors; see logs in $logDir" }

# copy helpful files
Copy-Item -ErrorAction SilentlyContinue (Join-Path $scriptDir '..\supabase-auth-fixes.sql') -Destination $logDir

# Create zip
$zipPath = Join-Path (Get-Location) "supabase-migrations-logs-$timestamp.zip"
try { Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::CreateFromDirectory($logDir, $zipPath); Write-Output "📦 Introspection logs packaged at: $zipPath" } catch { Write-Warning "Failed to create zip: $_" }

Write-Output "Expected outputs (short):"
Write-Output " - $logDir\dbconnect.log    (SSL OK or ETIMEDOUT)"
Write-Output " - $logDir\supabase-introspect.log  (exec_sql available or schema-cache delay)"
Write-Output " - $zipPath"

Write-Output "Done. Share $zipPath with DB team (Issue template: 'Supabase Introspection Artifact Attached')"
exit 0
