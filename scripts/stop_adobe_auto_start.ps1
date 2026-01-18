# Elevated script to stop Adobe node processes and disable Adobe scheduled tasks and services
# Writes a summary to %TEMP%\adobe_stop_result.txt
$outFile = "$env:TEMP\adobe_stop_result.txt"
"Started at: $(Get-Date -Format o)" | Out-File -FilePath $outFile -Encoding utf8

function Log($msg) { "$((Get-Date).ToString('o')) - $msg" | Out-File -FilePath $outFile -Append -Encoding utf8 }

try {
  Log "Looking for Adobe node processes"
  $adobeProcs = Get-CimInstance Win32_Process | Where-Object { ($_.CommandLine -like '*Adobe*') -and ($_.Name -like 'node*') } | Select-Object ProcessId,CommandLine
  if ($adobeProcs) {
    Log "Found Adobe node processes:"
    $adobeProcs | ForEach-Object { Log "PID=$($_.ProcessId) cmd=$($_.CommandLine)" }
    Log "Attempting to stop Adobe node processes"
    $adobeProcs | ForEach-Object { Try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop; Log "Stopped PID=$($_.ProcessId)" } Catch { Log "Failed to stop PID=$($_.ProcessId): $($_.Exception.Message)" } }
  } else {
    Log "No Adobe node processes found"
  }
} Catch {
  Log "Error enumerating/stopping Adobe node processes: $($_.Exception.Message)"
}

try {
  Log "Querying scheduled tasks for Adobe"
  $adobeTasks = Get-ScheduledTask | Where-Object { $_.TaskName -like '*Adobe*' -or $_.TaskName -like '*Creative*' } | Select-Object TaskName,State
  if ($adobeTasks) {
    Log "Found scheduled tasks:"
    $adobeTasks | ForEach-Object { Log "Task=$($_.TaskName) State=$($_.State)" }
    Log "Disabling scheduled tasks"
    $adobeTasks | ForEach-Object { Try { Disable-ScheduledTask -TaskName $_.TaskName -ErrorAction Stop; Log "Disabled task: $($_.TaskName)" } Catch { Log "Failed to disable task $($_.TaskName): $($_.Exception.Message)" } }
  } else {
    Log "No Adobe scheduled tasks found"
  }
} Catch {
  Log "Error enumerating/disabling scheduled tasks: $($_.Exception.Message)"
}

try {
  Log "Enumerating Adobe services"
  $adobeSvcs = Get-Service | Where-Object { $_.DisplayName -like '*Adobe*' -or $_.Name -like '*Adobe*' -or $_.DisplayName -like '*Creative Cloud*' } | Select-Object Name,DisplayName,Status
  if ($adobeSvcs) {
    Log "Found services:"
    $adobeSvcs | ForEach-Object { Log "Service=$($_.Name) Display=$($_.DisplayName) Status=$($_.Status)" }
    Log "Stopping and disabling services"
    $adobeSvcs | ForEach-Object {
      Try {
        if ($_.Status -ne 'Stopped') { Stop-Service -Name $_.Name -Force -ErrorAction Stop; Log "Stopped service: $($_.Name)" }
        Set-Service -Name $_.Name -StartupType Disabled -ErrorAction Stop
        Log "Disabled service: $($_.Name)"
      } Catch {
        Log "Failed to stop/disable service $($_.Name): $($_.Exception.Message)"
      }
    }
  } else {
    Log "No Adobe services found"
  }
} Catch {
  Log "Error enumerating/stopping services: $($_.Exception.Message)"
}

Log "Final process check for Adobe node processes"
Get-CimInstance Win32_Process | Where-Object { ($_.CommandLine -like '*Adobe*') -and ($_.Name -like 'node*') } | Select-Object ProcessId,CommandLine | ForEach-Object { Log "Remaining PID=$($_.ProcessId) cmd=$($_.CommandLine)" }

Log "Completed at: $(Get-Date -Format o)"
Write-Output "Script completed; see $outFile for details"