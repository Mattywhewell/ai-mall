#!/usr/bin/env bash
# Simulated TPM attestation and key generation
# Usage: tpm_simulator.sh <device-id> <out-dir>
set -euo pipefail
source "$(dirname "$0")/../lib/log.sh"

DEVICE_ID=${1:-}
OUT_DIR=${2:-}

if [ -z "$DEVICE_ID" ] || [ -z "$OUT_DIR" ]; then
  echo "Usage: $0 <device-id> <out-dir>" >&2
  exit 2
fi

mkdir -p "$OUT_DIR"
KEY_FILE="$OUT_DIR/${DEVICE_ID}-tpm-key"
PUB_FILE="$KEY_FILE.pub"
ATTEST_FILE="$OUT_DIR/${DEVICE_ID}-attestation.json"

# Simulate TPM-backed keypair (generate an ed25519 keypair, mark as 'tpm')
ssh-keygen -t ed25519 -f "$KEY_FILE" -N '' -C "tpm-${DEVICE_ID}" >/dev/null

# Mock attestation blob (in a real TPM, this would be a quote + signed statement)
PUBKEY_CONTENT=$(cat "$PUB_FILE")
# Ensure jq available for attestation JSON creation
if ! command -v jq >/dev/null 2>&1; then
  migration_log "step=scene5_tpm_sim" "action=failed" "device=$DEVICE_ID" "reason=jq_missing"
  echo "jq is required to build attestation JSON" >&2
  exit 2
fi

ATTEST_JSON=$(jq -n --arg dev "$DEVICE_ID" --arg pub "$PUBKEY_CONTENT" '{device:$dev, type:"tpm-sim", pubkey:$pub, attestation:"SIMULATED_TPM_QUOTE_BASE64"}')

echo "$ATTEST_JSON" > "$ATTEST_FILE"
migration_log "step=scene5_tpm_sim" "action=done" "device=$DEVICE_ID" "attest_file=$ATTEST_FILE" "pubkey=$PUB_FILE"

# Output key and attestation file paths
echo "$KEY_FILE" "$PUB_FILE" "$ATTEST_FILE"
exit 0
