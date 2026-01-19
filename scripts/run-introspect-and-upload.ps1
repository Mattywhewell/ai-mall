# PowerShell script to run Supabase introspection locally / on a VM and upload logs
# Usage:
#   $env:SUPABASE_DATABASE_URL='...' ; $env:GH_REPO='owner/repo' ; $env:GITHUB_TOKEN='...' ; .\scripts\run-introspect-and-upload.ps1
param()

$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$logDir = Join-Path (Get-Location) "introspect-logs-$timestamp"
New-Item -ItemType Directory -Path $logDir | Out-Null

Write-Output "🔧 Running DB connect test..."
if (Get-Command node -ErrorAction SilentlyContinue) {
  & node -r dotenv/config "$scriptDir/ci-supabase-dbconnect.js" *> (Join-Path $logDir 'dbconnect.log') 2>&1
} else {
  Write-Error 'Node.js not found in PATH. Install Node 18+ and retry.'; exit 2
}

Write-Output "🔍 Running Supabase introspection..."
try {
  & node -r dotenv/config "$scriptDir/ci-supabase-introspect.js" 2>&1 | Tee-Object -FilePath (Join-Path $logDir 'supabase-introspect.log')
} catch {
  Write-Warning "Introspection finished with errors; see logs in $logDir"
}

# Copy useful files
Copy-Item -ErrorAction SilentlyContinue "$scriptDir/..\supabase-auth-fixes.sql" -Destination $logDir

# Create zip
$zipPath = Join-Path $logDir "supabase-migrations-logs-$timestamp.zip"
try {
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [IO.Compression.ZipFile]::CreateFromDirectory($logDir, $zipPath)
  Write-Output "📦 Logs packaged at: $zipPath"
} catch {
  Write-Warning "Failed to create zip: $_"
}

# Upload
if (Get-Command gh -ErrorAction SilentlyContinue -and $env:GH_REPO -and ($env:GITHUB_TOKEN -or $env:GH_TOKEN)) {
  $tag = "introspect-$timestamp"
  Write-Output "🚀 Creating GitHub release $tag in $env:GH_REPO and uploading asset..."
  & gh release create $tag $zipPath --repo $env:GH_REPO -t "Introspection logs $tag" -n "Uploaded by run-introspect-and-upload.ps1 on $timestamp"
  Write-Output "✅ Release created: $tag"
  exit 0
}

if (Get-Command gh -ErrorAction SilentlyContinue -and $env:CREATE_GIST -eq '1' -and ($env:GITHUB_TOKEN -or $env:GH_TOKEN)) {
  Write-Output "📝 Creating gist with logs..."
  & gh gist create (Join-Path $logDir 'supabase-introspect.log') (Join-Path $logDir 'dbconnect.log') (Join-Path $logDir 'supabase-auth-fixes.sql') --public
  Write-Output "✅ Gist created"
  exit 0
}

Write-Output "⚠️ No upload method configured. To upload:
  - Set GH_REPO and GITHUB_TOKEN and install gh, or
  - Set CREATE_GIST=1 and GITHUB_TOKEN and install gh, or
  - Manually upload $zipPath where you want."
exit 0
