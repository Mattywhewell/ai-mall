param(
  [int]$Count = 5,
  [int]$Delay = 8
)

for ($i=1; $i -le $Count; $i++) {
  $msg = "chore(ci-trigger): run $i"
  git commit --allow-empty -m $msg
  git push origin ci/rtr-temp-pr
  Write-Output "Triggered run $i"
  Start-Sleep -Seconds $Delay
}