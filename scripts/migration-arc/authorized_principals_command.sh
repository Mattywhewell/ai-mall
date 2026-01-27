#!/usr/bin/env bash
set -euo pipefail

# Usage: authorized_principals_command.sh <device> <attestation-file> <pubkey-file>
# This script validates TPM attestations by delegating to scene-5/verify_attestation.sh.
# It will look for a per-device PCR policy at $TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json (if TEST_ROOT is set).

DEVICE=${1:-}
ATTEST_FILE=${2:-}
EXPECTED_PUBKEY_FILE=${3:-}

if [ -z "$DEVICE" ] || [ -z "$ATTEST_FILE" ] || [ -z "$EXPECTED_PUBKEY_FILE" ]; then
  echo "Usage: $0 <device> <attestation-file> <pubkey-file>" >&2
  exit 2
fi

# helper logging (no-op if migration_log isn't available)
migration_log() {
  if command -v migration_log >/dev/null 2>&1; then
    migration_log "$@"
  else
    # Fallback: print NDJSON-ish line to stderr for visibility
    echo "$*" >&2
  fi
}

if [ ! -f "$ATTEST_FILE" ] || [ ! -f "$EXPECTED_PUBKEY_FILE" ]; then
  migration_log "step=authorized_principals" "action=deny" "device=$DEVICE" "reason=attestation_missing_or_pub_missing"
  exit 1
fi

# Determine policy file and PCR mode
POLICY_FILE=""
PCR_MODE="strict"
if [ -n "${TEST_ROOT:-}" ]; then
  CANDIDATE="$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json"
  if [ -f "$CANDIDATE" ]; then
    POLICY_FILE="$CANDIDATE"
    if command -v jq >/dev/null 2>&1; then
      PCR_MODE=$(jq -r '.mode // "strict"' "$POLICY_FILE" 2>/dev/null || echo "strict")
    fi
  fi
fi

# Allow overriding verifier path for tests
VERIFY_SCRIPT="${VERIFY_SCRIPT:-$(dirname "$0")/scene-5/verify_attestation.sh}"

# Call verifier: args are <device> <attest-file> <expected-pubkey-file> <type> [expected-pcrs-file] [pcr-mode]
if ! "$VERIFY_SCRIPT" "$DEVICE" "$ATTEST_FILE" "$EXPECTED_PUBKEY_FILE" "tpm" "$POLICY_FILE" "$PCR_MODE"; then
  migration_log "step=authorized_principals" "action=deny" "device=$DEVICE" "reason=attestation_invalid"
  exit 1
fi

migration_log "step=authorized_principals" "action=allow" "device=$DEVICE"
exit 0
