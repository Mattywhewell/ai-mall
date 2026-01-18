# Wrapper to run monitor-artifacts.ps1 with an authenticated token
param(
  [string]$Token
)
if (-not $Token) {
  Write-Error "Token parameter required"
  exit 1
}
$env:GITHUB_TOKEN = $Token
Write-Output "Starting authenticated monitor with provided GITHUB_TOKEN"
& "$(Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)\monitor-artifacts.ps1"
