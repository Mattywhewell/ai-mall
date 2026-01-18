# Aggressive kill of all processes that reference Adobe in their command line
$outFile = "$env:TEMP\adobe_stop_result.txt"
function Log($msg) { "$((Get-Date).ToString('o')) - $msg" | Out-File -FilePath $outFile -Append -Encoding utf8 }

Log "--- Kill-All Adobe processes start ---"
try {
  $procs = Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -and ($_.CommandLine -like '*Adobe*' -or $_.CommandLine -like '*Creative*') }
  if ($procs) {
    Log "Found $($procs.Count) Adobe processes to kill"
    foreach ($p in $procs) {
      Try { Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop; Log "Killed PID=$($p.ProcessId) cmd=$($p.CommandLine)" } Catch { Log "Failed to kill PID=$($p.ProcessId): $($_.Exception.Message)" }
    }
  } else {
    Log "No Adobe processes found to kill"
  }
} Catch { Log "Error during kill-all: $($_.Exception.Message)" }

# Final check
Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -and ($_.CommandLine -like '*Adobe*' -or $_.CommandLine -like '*Creative*') } | ForEach-Object { Log "Remaining PID=$($_.ProcessId) cmd=$($_.CommandLine)" }
Log "--- Kill-All complete ---"