#!/usr/bin/env bash
# Enroll a simulated TPM device by generating a key + attestation and registering the pubkey
# Usage: enroll_tpm.sh <device-id> <out-dir>
set -euo pipefail
source "$(dirname "$0")/../lib/log.sh"

DEVICE_ID=${1:-}
OUT_DIR=${2:-/tmp}
TEST_ROOT=${TEST_ROOT:-}

if [ -z "$DEVICE_ID" ]; then
  echo "Usage: $0 <device-id> [out-dir]" >&2
  exit 2
fi

SIM_OUT="$("$(dirname "$0")/tpm_simulator.sh" "$DEVICE_ID" "$OUT_DIR")"
read -r KEY_FILE PUB_FILE ATTEST_FILE <<< "$SIM_OUT"

# Register pubkey into TEST_ROOT hardware keydir (if TEST_ROOT provided) or /etc/ssh/keys/hardware
TARGET_DIR="${TEST_ROOT:-/tmp}/etc/ssh/keys/hardware"
mkdir -p "$TARGET_DIR"

if [ ! -f "$PUB_FILE" ]; then
  echo "Pubkey file not found: $PUB_FILE" >&2
  exit 1
fi
cp "$PUB_FILE" "$TARGET_DIR/${DEVICE_ID}.pub"

# Save attestation alongside pubkey for later verification
mkdir -p "${TARGET_DIR}/attestations"
if [ ! -f "$ATTEST_FILE" ]; then
  echo "Attestation file not found: $ATTEST_FILE" >&2
  exit 1
fi
cp "$ATTEST_FILE" "$TARGET_DIR/attestations/${DEVICE_ID}-attestation.json"

migration_log "step=scene5_enroll_tpm" "action=done" "device=$DEVICE_ID" "pubkey=${TARGET_DIR}/${DEVICE_ID}.pub" "attestation=${TARGET_DIR}/attestations/${DEVICE_ID}-attestation.json"

echo "Enrolled simulated TPM device: $DEVICE_ID"
exit 0
