#!/usr/bin/env bash
# Manual/gated test for real TPM attestation PoC
set -euo pipefail
TEST_ROOT=${TEST_ROOT:-$(mktemp -d)}
export TEST_ROOT

if ! command -v tpm2_getcap >/dev/null 2>&1; then
  echo "tpm2-tools not found; skipping real TPM test"; exit 0
fi

echo "Running real TPM attestation PoC in TEST_ROOT=$TEST_ROOT"
mkdir -p "$TEST_ROOT/scene5"
./scripts/migration-arc/scene-5/enroll_tpm_real.sh "$TEST_ROOT" "real-device-tpm"

ATTEST="$TEST_ROOT/etc/ssh/keys/hardware/attestations/real-device-tpm-attestation.json"
PUBKEY="$TEST_ROOT/etc/ssh/keys/hardware/real-device-tpm.pub"

if [ ! -f "$ATTEST" ]; then
  echo "Missing attestation file: $ATTEST"; exit 2
fi

echo "Produced attestation:"; jq '.' "$ATTEST" || true

echo "Manual PoC complete. Use the attestation to exercise verify_attestation.sh and authorized_principals_command.sh in a gated runner." 
