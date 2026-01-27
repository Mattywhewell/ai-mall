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

# helper logging (prefer external `migration_log` command; otherwise fallback to stderr)
migration_log() {
  # `type -t migration_log` returns 'file' when an external binary is present
  if [ "$(type -t migration_log 2>/dev/null)" = "file" ]; then
    # Use `command` to bypass shell function lookup and invoke external binary
    command migration_log "$@"
  else
    # Fallback: print NDJSON-ish line to stderr for visibility
    echo "$*" >&2
  fi
}

if [ ! -f "$ATTEST_FILE" ] || [ ! -f "$EXPECTED_PUBKEY_FILE" ]; then
  migration_log "step=authorized_principals" "action=deny" "device=$DEVICE" "reason=attestation_missing_or_pub_missing"
  exit 1
fi

# Determine policy file set and PCR mode via inheritance/matching rules
# Inheritance precedence (highest -> lowest):
#   1) device+type override (e.g., device.tpm.json in TEST_ROOT)
#   2) device-specific (device.json in TEST_ROOT)
#   3) repo-level device+type (scripts/migration-arc/policies/device.type.json)
#   4) repo-level environment (scripts/migration-arc/policies/${ENV}.json)
#   5) repo-level hardware-type default (scripts/migration-arc/policies/${TYPE}.json)
#   6) repo-level global (scripts/migration-arc/policies/global.json)
# If multiple files are present they are merged with higher-precedence files overriding lower.
POLICY_FILE=""
PCR_MODE="strict"
ENV="${TEST_ENV:-dev}"
ATTEST_TYPE=""
# Try to infer attestation type from the attestation JSON
if command -v jq >/dev/null 2>&1; then
  ATTEST_TYPE=$(jq -r '.type // empty' "$ATTEST_FILE" 2>/dev/null || echo "")
fi
if [ -z "$ATTEST_TYPE" ]; then
  ATTEST_TYPE="tpm"
fi

candidates=()
# Candidate paths (low -> high precedence for merging)
# repo-level global and environment defaults
if [ -f "$(dirname "$0")/policies/global.json" ]; then
  candidates+=("$(dirname "$0")/policies/global.json")
fi
if [ -f "$(dirname "$0")/policies/${ATTEST_TYPE}.json" ]; then
  candidates+=("$(dirname "$0")/policies/${ATTEST_TYPE}.json")
fi
if [ -f "$(dirname "$0")/policies/${ENV}.json" ]; then
  candidates+=("$(dirname "$0")/policies/${ENV}.json")
fi
# repo-level device policies
if [ -f "$(dirname "$0")/policies/${DEVICE}.${ATTEST_TYPE}.json" ]; then
  candidates+=("$(dirname "$0")/policies/${DEVICE}.${ATTEST_TYPE}.json")
fi
if [ -f "$(dirname "$0")/policies/${DEVICE}.json" ]; then
  candidates+=("$(dirname "$0")/policies/${DEVICE}.json")
fi
# user/test-level device policies under TEST_ROOT (higher precedence)
if [ -n "${TEST_ROOT:-}" ]; then
  if [ -f "$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json" ]; then
    candidates+=("$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json")
  fi
  if [ -f "$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.${ATTEST_TYPE}.json" ]; then
    candidates+=("$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.${ATTEST_TYPE}.json")
  fi
fi

# If we found multiple candidate files, merge them into a temp policy file (low->high so last wins)
if [ ${#candidates[@]} -gt 0 ]; then
  TMPDIR=$(mktemp -d)
  MERGED="$TMPDIR/merged_policy.json"
  # Log candidate files for debugging
  migration_log "step=authorized_principals" "candidates=${candidates[*]}"
  # Use jq -s to slurp all candidate files into an array and reduce them (later files override earlier)
  # This avoids jq features that may not be available on all distributions.
  if ! jq -s 'reduce .[] as $item ({}; . * $item)' "${candidates[@]}" > "$MERGED" 2>/dev/null; then
    migration_log "step=authorized_principals" "action=failed" "device=$DEVICE" "reason=policy_merge_failed"
    echo "Failed to merge policy files: ${candidates[*]}" >&2
    exit 1
  fi
  # Log merged policy for visibility
  migration_log "step=authorized_principals" "merged_policy=$(jq -c '.' "$MERGED" 2>/dev/null || echo '{}')"
  # Validate and extract mode
  if jq -e '.mode' "$MERGED" >/dev/null 2>&1; then
    PCR_MODE=$(jq -r '.mode' "$MERGED" 2>/dev/null || echo "strict")
  fi
  # Write merged to POLICY_FILE path for verifier consumption
  POLICY_FILE="$MERGED"
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
