# Aggressive follow-up: repeatedly kill Adobe processes and remove startup entries
$outFile = "$env:TEMP\adobe_stop_result.txt"
function Log($msg) { "$((Get-Date).ToString('o')) - $msg" | Out-File -FilePath $outFile -Append -Encoding utf8 }

Log "--- Phase 2 start ---"
try {
  # Kill any process with Adobe in command line (repeat to handle respawns)
  for ($i=0; $i -lt 6; $i++) {
    $procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*Adobe*' }
    if (-not $procs) { Log "No Adobe processes found on iteration $i"; break }
    Log "Iteration $i: Found $($procs.Count) Adobe processes"
    $procs | ForEach-Object { Try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop; Log "Stopped PID=$($_.ProcessId)" } Catch { Log "Failed to stop PID=$($_.ProcessId): $($_.Exception.Message)" } }
    Start-Sleep -Seconds 1
  }
} Catch { Log "Error killing processes: $($_.Exception.Message)" }

try {
  # Remove Adobe entries from HKCU Run
  $runKeys = Get-ItemProperty -Path HKCU:\Software\Microsoft\Windows\CurrentVersion\Run -ErrorAction SilentlyContinue
  if ($runKeys) {
    $names = $runKeys.PSObject.Properties | Where-Object { $_.Name -like '*Adobe*' -or $_.Name -like '*Creative*' } | Select-Object -ExpandProperty Name
    if ($names) {
      foreach ($n in $names) { Try { Remove-ItemProperty -Path HKCU:\Software\Microsoft\Windows\CurrentVersion\Run -Name $n -ErrorAction Stop; Log "Removed Run key HKCU:$n" } Catch { Log "Failed to remove Run key $n: $($_.Exception.Message)" } }
    } else { Log "No HKCU Run keys matching Adobe/Creative*" }
  }
} Catch { Log "Error removing Run keys: $($_.Exception.Message)" }

try {
  # Also check HKLM Run (requires elevation)
  $runKeysLM = Get-ItemProperty -Path HKLM:\Software\Microsoft\Windows\CurrentVersion\Run -ErrorAction SilentlyContinue
  if ($runKeysLM) {
    $namesLM = $runKeysLM.PSObject.Properties | Where-Object { $_.Name -like '*Adobe*' -or $_.Name -like '*Creative*' } | Select-Object -ExpandProperty Name
    if ($namesLM) {
      foreach ($n in $namesLM) { Try { Remove-ItemProperty -Path HKLM:\Software\Microsoft\Windows\CurrentVersion\Run -Name $n -ErrorAction Stop; Log "Removed HKLM Run key $n" } Catch { Log "Failed to remove HKLM Run key $n: $($_.Exception.Message)" } }
    } else { Log "No HKLM Run keys matching Adobe/Creative*" }
  }
} Catch { Log "Error removing HKLM Run keys: $($_.Exception.Message)" }

try {
  # Re-check scheduled tasks and ensure they are disabled
  $adobeTasks = Get-ScheduledTask | Where-Object { $_.TaskName -like '*Adobe*' -or $_.TaskName -like '*Creative*' }
  if ($adobeTasks) {
    foreach ($t in $adobeTasks) {
      Try { Disable-ScheduledTask -TaskName $t.TaskName -ErrorAction Stop; Log "Disabled scheduled task $($t.TaskName)" } Catch { Log "Failed to disable scheduled task $($t.TaskName): $($_.Exception.Message)" }
    }
  } else { Log "No Adobe scheduled tasks found in phase 2" }
} Catch { Log "Error managing scheduled tasks: $($_.Exception.Message)" }

try {
  # Re-check services and disable
  $adobeSvcs = Get-Service | Where-Object { $_.DisplayName -like '*Adobe*' -or $_.Name -like '*Adobe*' -or $_.DisplayName -like '*Creative Cloud*' }
  if ($adobeSvcs) {
    foreach ($s in $adobeSvcs) {
      Try { if ($s.Status -ne 'Stopped') { Stop-Service -Name $s.Name -Force -ErrorAction Stop; Log "Stopped service $($s.Name)" } Set-Service -Name $s.Name -StartupType Disabled -ErrorAction Stop; Log "Disabled service $($s.Name)" } Catch { Log "Failed to stop/disable service $($s.Name): $($_.Exception.Message)" }
    }
  } else { Log "No Adobe services found in phase 2" }
} Catch { Log "Error with services in phase 2: $($_.Exception.Message)" }

# Final listing
Log "--- Phase 2 final check ---"
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*Adobe*' } | Select-Object ProcessId,CommandLine | ForEach-Object { Log "Remaining PID=$($_.ProcessId) cmd=$($_.CommandLine)" }
Log "Listing remaining Adobe-related scheduled tasks"
Get-ScheduledTask | Where-Object { $_.TaskName -like '*Adobe*' -or $_.TaskName -like '*Creative*' } | ForEach-Object { Log "Task=$($_.TaskName) State=$($_.State)" }
Log "Listing remaining Adobe services"
Get-Service | Where-Object { $_.DisplayName -like '*Adobe*' -or $_.Name -like '*Adobe*' -or $_.DisplayName -like '*Creative Cloud*' } | ForEach-Object { Log "Service=$($_.Name) Display=$($_.DisplayName) Status=$($_.Status)" }
Log "--- Phase 2 complete ---"