#!/usr/bin/env bash
set -euo pipefail

# Beat 1: TPM Heartbeat check — run basic checks to ensure TPM is alive and reachable.
# Emits NDJSON lines into ./tmp/tpm_beat1_<timestamp>.ndjson for auditability.

OUTDIR="${OUTDIR:-./tmp}"
mkdir -p "$OUTDIR"
LOG="$OUTDIR/tpm_beat1_$(date -u +"%Y%m%dT%H%M%SZ").ndjson"

json_escape() {
  # Requires python3 to be available on the node (very common). Reads stdin and prints a JSON string.
  python3 - <<'PY'
import json,sys
print(json.dumps(sys.stdin.read()))
PY
}

emit() {
  # $1: JSON object (already escaped values inserted)
  echo "$1" | tee -a "$LOG"
}

run_check() {
  local name="$1"
  local cmd=("${@:2}")

  local output
  if output="$("${cmd[@]}" 2>&1)"; then
    local esc
    esc=$(printf '%s' "$output" | json_escape)
    emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"step\":\"tpm_heartbeat\",\"check\":\"$name\",\"action\":\"info\",\"ok\":true,\"output\":$esc}"
    return 0
  else
    local rc=$?
    local esc
    esc=$(printf '%s' "$output" | json_escape || true)
    emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"step\":\"tpm_heartbeat\",\"check\":\"$name\",\"action\":\"failed\",\"ok\":false,\"rc\":$rc,\"output\":$esc}"
    return $rc
  fi
}

# Require sudo for commands that need it, but try without first
if ! command -v tpm2_getrandom >/dev/null 2>&1; then
  echo "ERROR: 'tpm2_getrandom' not found. Install 'tpm2-tools' and ensure it is in PATH." >&2
  exit 2
fi

emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"step\":\"tpm_heartbeat\",\"action\":\"start\",\"msg\":\"Running Beat 1 checks\"}"

# 1) tpm2_getrandom 8
run_check "tpm2_getrandom" tpm2_getrandom 8

# 2) properties-fixed (firmware-ish properties)
run_check "properties-fixed" tpm2_getcap properties-fixed

# 3) handles-persistent (list persistent handles)
run_check "handles-persistent" tpm2_getcap handles-persistent

emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"step\":\"tpm_heartbeat\",\"action\":\"done\",\"msg\":\"Beat 1 complete\",\"log\":\"$LOG\"}"

printf "Beat 1 checks written to: %s\n" "$LOG" >&2
exit 0
