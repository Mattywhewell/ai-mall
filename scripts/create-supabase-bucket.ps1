# PowerShell wrapper for Windows users
# Usage (PowerShell):
#   $env:NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co"
#   $env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
#   .\scripts\create-supabase-bucket.ps1 -Public

param(
  [switch]$Public
)

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is required for this script. Please install Node and try again."
  exit 1
}

$flag = ''
if ($Public) { $flag = '--public' }

Write-Host "Running node scripts/supabase-create-bucket.js $flag"
node .\scripts\supabase-create-bucket.js $flag
