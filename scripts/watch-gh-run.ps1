param(
  [string]$sha = '4189c810567cd88afccb1055ceb07a72f575c4af'
)

Write-Host "watch-gh-run: polling for runs with headSha=$sha (branch: feat/rbac-ssr-cookie-fallback)"
while ($true) {
  # Use PowerShell JSON parsing to avoid complex quoting
  $json = gh run list --repo Mattywhewell/ai-mall --branch feat/rbac-ssr-cookie-fallback --limit 50 --json headSha,databaseId,conclusion
  $runs = $null
  try { $runs = $json | ConvertFrom-Json } catch { $runs = $null }
  if ($runs) {
    $match = $runs | Where-Object { $_.headSha -eq $sha } | Select-Object -First 1
    if ($match) {
      $id = $match.databaseId
      Write-Host "Found run $id (headSha $sha)"
      gh run view $id --repo Mattywhewell/ai-mall --log
      break
    }
  }
  Start-Sleep -Seconds 10
}
