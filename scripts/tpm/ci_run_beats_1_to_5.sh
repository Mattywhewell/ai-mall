#!/usr/bin/env bash
set -euo pipefail

# CI helper: run Beats 1-5 under swtpm for hermetic E2E validation.
# Intended for CI (GitHub Actions). Expects swtpm and tpm2-tools to be installed.

OUTDIR="${OUTDIR:-./tmp}"
mkdir -p "$OUTDIR"
STATE_DIR="$OUTDIR/swtpm-state"
SOCK="/tmp/swtpm-sock"
CTRL="/tmp/swtpm-ctrl"

rm -rf "$STATE_DIR"
mkdir -p "$STATE_DIR"

# Start swtpm socket (redirect logs)
echo "Ensuring swtpm runtime state dir /var/lib/swtpm exists and is writable"
# Some runner environments do not auto-create /var/lib/swtpm; create and set ownership if possible
sudo mkdir -p /var/lib/swtpm || true
sudo chown swtpm:swtpm /var/lib/swtpm || true

echo "Starting swtpm socket (state dir=$STATE_DIR)"
mkdir -p "$OUTDIR"
swtpm socket --tpmstate dir="$STATE_DIR" --ctrl type=unixio,path=$CTRL --server type=unixio,path=$SOCK --log level=20 > "$OUTDIR/swtpm.log" 2>&1 &
SWTPM_PID=$!

# Wait for socket file to appear (up to ~15s)
for i in {1..30}; do
  if [ -e "$SOCK" ]; then break; fi
  sleep 0.5
done
if [ ! -e "$SOCK" ]; then
  echo "swtpm socket did not create socket at $SOCK" >&2
  echo "--- SWTPM DIAGNOSTICS (socket missing) ---" >&2
  echo "Listing tmp/ and socket path:" >&2; ls -la "$OUTDIR" || true; ls -la "$SOCK" || true
  echo "ps output:" >&2; ps -ef | sed -n '1,200p' >&2 || true
  echo "ss unix sockets:" >&2; ss -lx | sed -n '1,200p' >&2 || true
  echo "Dumping swtpm log ($OUTDIR/swtpm.log):" >&2
  sed -n '1,200p' "$OUTDIR/swtpm.log" >&2 || true
  if ps -p $SWTPM_PID >/dev/null 2>&1; then
    echo "swtpm pid $SWTPM_PID exists (process still running)" >&2
    ps -p $SWTPM_PID -o pid,ppid,etime,cmd >&2 || true
  else
    echo "swtpm pid $SWTPM_PID not running" >&2
  fi
  kill $SWTPM_PID || true
  exit 1
fi

# Quick startup PID check: ensure swtpm launched
if ! ps -p $SWTPM_PID >/dev/null 2>&1; then
  echo "swtpm process $SWTPM_PID not found immediately after launch" >&2
  echo "Dumping swtpm log ($OUTDIR/swtpm.log) and process table for diagnostics:" >&2
  sed -n '1,200p' "$OUTDIR/swtpm.log" >&2 || true
  ps -ef | sed -n '1,200p' >&2 || true
  ss -lx | sed -n '1,200p' >&2 || true
  exit 1
fi

# Verify swtpm is responsive by running tpm2_getrandom in a retry loop
# Enhanced: check PID liveliness each attempt; longer window (12 attempts)
# Ensure tpm2-tools talks to this swtpm instance via socket for the responsive check
export TPM2TOOLS_TCTI="swtpm:socket=$SOCK"
export TCTI="swtpm:socket=$SOCK"
echo "Checking swtpm responsiveness with tpm2_getrandom (up to 12 attempts)..."
responsive=0
max_attempts=12
for attempt in $(seq 1 $max_attempts); do
  # Check process liveness
  if ! ps -p $SWTPM_PID >/dev/null 2>&1; then
    echo "swtpm process $SWTPM_PID died before socket became responsive (attempt $attempt)" >&2
    # Try to fetch the exit code if possible
    if wait $SWTPM_PID 2>/dev/null; then
      exit_code=$?
      echo "swtpm exited with code $exit_code" >&2
    else
      echo "swtpm exit code unavailable; process may have been reaped" >&2
    fi
    echo "--- SWTPM DIAGNOSTICS (process died) ---" >&2
    echo "Dumping swtpm log ($OUTDIR/swtpm.log):" >&2; sed -n '1,200p' "$OUTDIR/swtpm.log" >&2 || true
    echo "ps output:" >&2; ps -ef | sed -n '1,200p' >&2 || true
    echo "ss unix sockets:" >&2; ss -lx | sed -n '1,200p' >&2 || true
    exit 1
  fi

  OUTFILE="$OUTDIR/tpm2_getrandom_attempt_${attempt}.out"
  # Run tpm2_getrandom explicitly against the swtpm socket and capture output for diagnostics
  if tpm2_getrandom -T "swtpm:socket=$SOCK" 8 >"$OUTFILE" 2>&1; then
    rc=0
  else
    rc=$?
  fi
  if [ $rc -eq 0 ]; then
    echo "swtpm responsive (tpm2_getrandom succeeded on attempt $attempt)"
    responsive=1
    echo "tpm2_getrandom output (first 200 lines):"
    sed -n '1,200p' "$OUTFILE" || true
    break
  else
    echo "tpm2_getrandom failed (attempt $attempt/$max_attempts), rc=$rc; captured $OUTFILE"
    sed -n '1,200p' "$OUTFILE" || true
    sleep 1
  fi
done
if [ "$responsive" -ne 1 ]; then
  echo "swtpm did not become responsive after $max_attempts attempts" >&2
  echo "--- SWTPM DIAGNOSTICS (unresponsive) ---" >&2
  echo "Dumping swtpm log ($OUTDIR/swtpm.log):" >&2; sed -n '1,400p' "$OUTDIR/swtpm.log" >&2 || true
  echo "ps output:" >&2; ps -ef | sed -n '1,200p' >&2 || true
  echo "ss unix sockets:" >&2; ss -lx | sed -n '1,200p' >&2 || true
  # Try to capture exit code if process died just now
  if ! ps -p $SWTPM_PID >/dev/null 2>&1; then
    if wait $SWTPM_PID 2>/dev/null; then
      echo "swtpm exited with code $?" >&2
    else
      echo "swtpm exit code unavailable (may have been reaped)" >&2
    fi
  fi
  kill $SWTPM_PID || true
  exit 1
fi

# Export tcti for tpm2-tools; many tpm2 tools respect TPM2TOOLS_TCTI
export TPM2TOOLS_TCTI="swtpm:socket=$SOCK"
export TCTI="swtpm:socket=$SOCK"

echo "Running Beat 1: heartbeat check"
./scripts/tpm/beat1_check.sh || { echo 'Beat1 failed' >&2; kill $SWTPM_PID || true; exit 1; }

echo "Running Beat 2: create identity"
./scripts/tpm/beat2_create_identity.sh || { echo 'Beat2 failed' >&2; kill $SWTPM_PID || true; exit 1; }

echo "Running Beat 3: capture attestation"
./scripts/tpm/beat3_capture_attestation.sh || { echo 'Beat3 failed' >&2; kill $SWTPM_PID || true; exit 1; }

echo "Running Beat 4: register identity"
./scripts/tpm/beat4_register_identity.sh || { echo 'Beat4 failed' >&2; kill $SWTPM_PID || true; exit 1; }

echo "Running Beat 5: verify attestation (no policy)"
./scripts/tpm/beat5_verify_attestation.sh || { echo 'Beat5 failed' >&2; kill $SWTPM_PID || true; exit 1; }

# Stop swtpm
kill $SWTPM_PID || true

# List produced artifacts
echo "Artifacts in $OUTDIR:"
ls -l "$OUTDIR" || true

# Upload artifacts handled by GitHub Actions workflow
echo "CI Beats 1-5 completed successfully"
exit 0
