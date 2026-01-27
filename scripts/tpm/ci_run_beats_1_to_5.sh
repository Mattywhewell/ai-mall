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

# Start swtpm socket
echo "Starting swtpm socket (state dir=$STATE_DIR)"
swtpm socket --tpmstate dir="$STATE_DIR" --ctrl type=unixio,path=$CTRL --server type=unixio,path=$SOCK --log level=20 &
SWTPM_PID=$!

# Wait for socket
for i in {1..30}; do
  if [ -e "$SOCK" ]; then break; fi
  sleep 0.5
done
if [ ! -e "$SOCK" ]; then
  echo "swtpm socket did not create socket at $SOCK" >&2
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
