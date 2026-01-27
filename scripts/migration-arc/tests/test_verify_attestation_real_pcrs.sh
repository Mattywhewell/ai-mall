#!/usr/bin/env bash
# Manual/gated test: verify PCR policy enforcement (strict vs permissive)
set -euo pipefail
TEST_ROOT=${TEST_ROOT:-$(mktemp -d)}
export TEST_ROOT

if ! command -v tpm2_getcap >/dev/null 2>&1; then
  echo "tpm2-tools not found; skipping PCR policy tests"; exit 0
fi

echo "Running enroll PoC to generate attestation artifacts in TEST_ROOT=$TEST_ROOT"
./scripts/migration-arc/scene-5/enroll_tpm_real.sh "$TEST_ROOT" "real-device-tpm"
ATTEST="$TEST_ROOT/etc/ssh/keys/hardware/attestations/real-device-tpm-attestation.json"

if [ ! -f "$ATTEST" ]; then
  echo "Missing attestation file: $ATTEST"; exit 2
fi

# Extract PCRs from attestation and write to expected file
jq '.pcrs' "$ATTEST" > "$TEST_ROOT/expected_pcrs.json"

echo "Running verifier with correct PCRs (strict mode) - should pass"
./scripts/migration-arc/scene-5/verify_attestation.sh "real-device-tpm" "$ATTEST" "$TEST_ROOT/etc/ssh/keys/hardware/real-device-tpm.pub" "tpm" "$TEST_ROOT/expected_pcrs.json" strict
RC=$?
if [ $RC -ne 0 ]; then echo "Verifier failed unexpectedly (rc=$RC)"; exit $RC; fi

echo "Now test strict mode with a tampered expected PCR (should fail)"
# Tamper the first key
FIRST_PCR=$(jq -r 'keys[0]' "$TEST_ROOT/expected_pcrs.json")
jq --arg k "$FIRST_PCR" '.[$k] = "deadbeef"' "$TEST_ROOT/expected_pcrs.json" > "$TEST_ROOT/expected_pcrs_tampered.json"
set +e
./scripts/migration-arc/scene-5/verify_attestation.sh "real-device-tpm" "$ATTEST" "$TEST_ROOT/etc/ssh/keys/hardware/real-device-tpm.pub" "tpm" "$TEST_ROOT/expected_pcrs_tampered.json" strict
RC=$?
set -e
if [ $RC -eq 0 ]; then echo "Verifier incorrectly accepted tampered PCRs in strict mode"; exit 5; else echo "Strict mode correctly rejected tampered PCRs (rc=$RC)"; fi

# Permissive mode should warn but pass
echo "Now test permissive mode with tampered PCRs (should warn but succeed)"
./scripts/migration-arc/scene-5/verify_attestation.sh "real-device-tpm" "$ATTEST" "$TEST_ROOT/etc/ssh/keys/hardware/real-device-tpm.pub" "tpm" "$TEST_ROOT/expected_pcrs_tampered.json" permissive
RC=$?
if [ $RC -ne 0 ]; then echo "Verifier failed in permissive mode (rc=$RC)"; exit $RC; fi

echo "PCR policy tests passed (strict rejects, permissive warns)"
