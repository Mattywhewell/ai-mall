#!/usr/bin/env bash
# Verify a simulated TPM attestation.
# Usage: verify_attestation.sh <device-id> <attestation-file> <expected-pubkey-file> [expected-type]
set -euo pipefail
source "$(dirname "$0")/../lib/log.sh"

DEVICE=${1:-}
ATTEST_FILE=${2:-}
EXPECTED_PUBKEY_FILE=${3:-}
EXPECTED_TYPE=${4:-tpm-sim}

if [ -z "$DEVICE" ] || [ -z "$ATTEST_FILE" ] || [ -z "$EXPECTED_PUBKEY_FILE" ]; then
  echo "Usage: $0 <device-id> <attestation-file> <expected-pubkey-file> [expected-type]" >&2
  exit 2
fi

# Ensure jq availability
if ! command -v jq >/dev/null 2>&1; then
  migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=jq_missing"
  echo "jq is required to verify attestation" >&2
  exit 9
fi

if [ ! -f "$ATTEST_FILE" ]; then
  migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=attestation_missing" "attest_file=$ATTEST_FILE"
  exit 3
fi

# Parse attestation JSON for 'pubkey' and 'type'
ATT_PUB=$(jq -r '.pubkey // empty' "$ATTEST_FILE" 2>/dev/null || true)
ATT_TYPE=$(jq -r '.type // empty' "$ATTEST_FILE" 2>/dev/null || true)
if [ -z "$ATT_PUB" ] || [ -z "$ATT_TYPE" ]; then
  migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=invalid_attestation_json" "attest_file=$ATTEST_FILE"
  exit 4
fi

# Check type matches
if [ "$ATT_TYPE" != "$EXPECTED_TYPE" ]; then
  migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=type_mismatch" "expected=$EXPECTED_TYPE" "got=$ATT_TYPE"
  exit 5
fi

# Read expected pubkey
if [ ! -f "$EXPECTED_PUBKEY_FILE" ]; then
  migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=expected_pubkey_missing" "pubkey_file=$EXPECTED_PUBKEY_FILE"
  exit 6
fi
EXPECTED_PUB=$(cat "$EXPECTED_PUBKEY_FILE" || true)

if [ "$ATT_PUB" != "$EXPECTED_PUB" ]; then
  migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=pubkey_mismatch" "attest_file=$ATTEST_FILE" "pubkey_file=$EXPECTED_PUBKEY_FILE"
  exit 7
fi

migration_log "step=attestation_verify" "action=done" "device=$DEVICE" "attest_file=$ATTEST_FILE" "pubkey_file=$EXPECTED_PUBKEY_FILE"
exit 0
