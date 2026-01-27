#!/usr/bin/env bash
# Manual/gated verification test: produce a real attestation and verify it using verify_attestation.sh
set -euo pipefail
TEST_ROOT=${TEST_ROOT:-$(mktemp -d)}
export TEST_ROOT

if ! command -v tpm2_getcap >/dev/null 2>&1; then
  echo "tpm2-tools not found; skipping verify real TPM test"; exit 0
fi

echo "Running enroll PoC to generate attestation artifacts in TEST_ROOT=$TEST_ROOT"
./scripts/migration-arc/scene-5/enroll_tpm_real.sh "$TEST_ROOT" "real-device-tpm"

ATTEST="$TEST_ROOT/etc/ssh/keys/hardware/attestations/real-device-tpm-attestation.json"
AK_PEM="$TEST_ROOT/etc/ssh/keys/hardware/real-device-tpm.pub" # note: enroll may create .pem variant

if [ ! -f "$ATTEST" ]; then
  echo "Missing attestation file: $ATTEST"; exit 2
fi

# Try to find an AK PEM: enroll script saves ak PEM inside the attestation as ak_pub_pem; verifier will handle it
./scripts/migration-arc/scene-5/verify_attestation.sh "real-device-tpm" "$ATTEST" "$AK_PEM" "tpm"
RC=$?
echo "verify_attestation.sh exited with rc=$RC"
if [ $RC -eq 0 ]; then
  echo "Real TPM attestation verified successfully"
else
  echo "Real TPM attestation verification failed (rc=$RC)"; exit $RC
fi
