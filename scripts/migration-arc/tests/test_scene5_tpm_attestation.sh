#!/usr/bin/env bash
# Test TPM attestation flow: simulate TPM, enroll, issue cert bound to TPM device, verify principals & revocation
set -euo pipefail
TEST_ROOT=${TEST_ROOT:-$(mktemp -d)}
export TEST_ROOT
export MIGRATION_LOG=${MIGRATION_LOG:-$TEST_ROOT/migration-arc.ndjson}

echo "Running Scene 5 TPM attestation tests in TEST_ROOT=$TEST_ROOT"
# Skip if jq not present (local dev environments may not have it). CI runners provide jq.
if ! command -v jq >/dev/null 2>&1; then
  echo "jq not found; skipping TPM attestation tests (install jq to run locally)"
  exit 0
fi

# Prepare CA
mkdir -p "$TEST_ROOT/root"
CA_KEY="$TEST_ROOT/root/ssh_ca"
ssh-keygen -t ed25519 -f "$CA_KEY" -N '' -C 'test-ca' >/dev/null

# Simulate TPM and enroll
mkdir -p "$TEST_ROOT/scene5"
$(dirname "$0")/../scene-5/enroll_tpm.sh test-device-tpm "$TEST_ROOT/scene5"
ENROLL_RC=$?
echo "ENROLL TPM rc=$ENROLL_RC"

# Ensure attestation present
ATTEST="$TEST_ROOT/etc/ssh/keys/hardware/attestations/test-device-tpm-attestation.json"
if [ ! -f "$ATTEST" ]; then
  echo "Missing attestation file: $ATTEST"; ls -l "$(dirname "$ATTEST")" || true; cat "$MIGRATION_LOG" || true; exit 2
fi

echo "ATTEST file exists: $ATTEST"
echo "ATTEST head:"; head -n 5 "$ATTEST" || true
PUBKEY="$TEST_ROOT/etc/ssh/keys/hardware/test-device-tpm.pub"
echo "PUBKEY path: $PUBKEY"; ls -l "$PUBKEY" || true

# Issue cert with principal tagging the device
PUBKEY="$TEST_ROOT/userkey.pub"
ssh-keygen -t ed25519 -f "$TEST_ROOT/userkey" -N '' -C 'test-user' >/dev/null
PUBKEY="$TEST_ROOT/userkey.pub"
CA_KEY="$CA_KEY" TEST_ROOT="$TEST_ROOT" DURATION=120 $(dirname "$0")/../issue_cert.sh "$PUBKEY" "tpm:test-device-tpm" "$TEST_ROOT/user-cert.pub"

# Check AuthorizedPrincipals accepts device principal
$(dirname "$0")/../authorized_principals_command.sh "$TEST_ROOT/user-cert.pub" "$TEST_ROOT/etc/ssh/revoked_cert_serials" > "$TEST_ROOT/scene5_tpm_principals.out" 2> "$TEST_ROOT/scene5_tpm_principals.err"
AP_RC=$?
echo "authorized_principals rc=$AP_RC"
echo "authorized_principals stdout:"; cat "$TEST_ROOT/scene5_tpm_principals.out" || true
echo "authorized_principals stderr:"; cat "$TEST_ROOT/scene5_tpm_principals.err" || true
if [ $AP_RC -eq 0 ]; then
  echo "AuthorizedPrincipals returned for tpm-bound cert:"; cat "$TEST_ROOT/scene5_tpm_principals.out"
else
  echo "AuthorizedPrincipals denied tpm-bound cert (unexpected)"; cat "$MIGRATION_LOG" || true; exit 3
fi

# Negative test: tamper attestation pubkey -> should be denied
ATTEST="$TEST_ROOT/etc/ssh/keys/hardware/attestations/test-device-tpm-attestation.json"
if [ -f "$ATTEST" ]; then
  jq '.pubkey = "CORRUPTED_PUBKEY"' "$ATTEST" > "$ATTEST.tmp" && mv "$ATTEST.tmp" "$ATTEST"
  echo "Tampered ATTEST head:"; head -n 5 "$ATTEST" || true
  echo "About to run authorized_principals (after tamper) as a protected command"
  echo "CMD: $(dirname "$0")/../authorized_principals_command.sh \"$TEST_ROOT/user-cert.pub\" \"$TEST_ROOT/etc/ssh/revoked_cert_serials\""
  # Protect the outer test script from set -e by temporarily disabling it while we run the expected-to-fail command
  set +e
  $(dirname "$0")/../authorized_principals_command.sh "$TEST_ROOT/user-cert.pub" "$TEST_ROOT/etc/ssh/revoked_cert_serials" > "$TEST_ROOT/scene5_tpm_principals_after_tamper.out" 2> "$TEST_ROOT/scene5_tpm_principals_after_tamper.err"
  AP_TAMPER_RC=$?
  set -e
  echo "authorized_principals after tamper rc=$AP_TAMPER_RC"
  echo "stdout after tamper:"; cat "$TEST_ROOT/scene5_tpm_principals_after_tamper.out" || true
  echo "stderr after tamper:"; cat "$TEST_ROOT/scene5_tpm_principals_after_tamper.err" || true
  if [ $AP_TAMPER_RC -eq 0 ]; then
    echo "AuthorizedPrincipals allowed cert with corrupted attestation (unexpected)"; exit 6
  else
    echo "Corrupted attestation correctly denied"
  fi
else
  echo "No attestation file to tamper with"; exit 7
fi

# Restore real attestation by re-enrolling (regenerates attestation)
set -x
echo "About to reenroll (protected): $(dirname "$0")/../scene-5/enroll_tpm.sh test-device-tpm \"$TEST_ROOT/scene5\""
# Temporarily disable errexit to protect against unexpected non-zero from reenroll
set +e
$(dirname "$0")/../scene-5/enroll_tpm.sh test-device-tpm "$TEST_ROOT/scene5" > "$TEST_ROOT/scene5_reenroll.out" 2> "$TEST_ROOT/scene5_reenroll.err"
REENROLL_RC=$?
set -e
echo "reenroll rc=$REENROLL_RC"
echo "reenroll stdout:"; cat "$TEST_ROOT/scene5_reenroll.out" || true
echo "reenroll stderr:"; cat "$TEST_ROOT/scene5_reenroll.err" || true
echo "ATTEST head after reenroll:"; head -n 5 "$ATTEST" || true

# Negative test: wrong type -> should be denied
jq '.type = "not-tpm"' "$ATTEST" > "$ATTEST.tmp" && mv "$ATTEST.tmp" "$ATTEST"
echo "ATTEST after wrong-type injection head:"; head -n 5 "$ATTEST" || true
echo "About to run authorized_principals (wrong-type) as a protected command"
# Temporarily disable errexit to protect against the expected non-zero exit
set +e
$(dirname "$0")/../authorized_principals_command.sh "$TEST_ROOT/user-cert.pub" "$TEST_ROOT/etc/ssh/revoked_cert_serials" > "$TEST_ROOT/scene5_tpm_principals_wrong_type.out" 2> "$TEST_ROOT/scene5_tpm_principals_wrong_type.err"
AP_WRONG_RC=$?
set -e
echo "authorized_principals wrong_type rc=$AP_WRONG_RC"
echo "stdout wrong_type:"; cat "$TEST_ROOT/scene5_tpm_principals_wrong_type.out" || true
echo "stderr wrong_type:"; cat "$TEST_ROOT/scene5_tpm_principals_wrong_type.err" || true
if [ $AP_WRONG_RC -eq 0 ]; then
  echo "AuthorizedPrincipals allowed cert with wrong attestation type (unexpected)"; exit 8
else
  echo "Wrong attestation type correctly denied"
fi

# Revoke and ensure denial
$(dirname "$0")/../revoke_cert.sh "$TEST_ROOT/user-cert.pub"
REVOKE_RC=$?
echo "revoke_cert rc=$REVOKE_RC"
echo "About to run authorized_principals (revoked) as a protected command"
set +e
$(dirname "$0")/../authorized_principals_command.sh "$TEST_ROOT/user-cert.pub" "$TEST_ROOT/etc/ssh/revoked_cert_serials" > "$TEST_ROOT/scene5_tpm_principals_revoked.out" 2> "$TEST_ROOT/scene5_tpm_principals_revoked.err"
AP_REVOKED_RC=$?
set -e
echo "authorized_principals revoked rc=$AP_REVOKED_RC"
echo "stdout revoked:"; cat "$TEST_ROOT/scene5_tpm_principals_revoked.out" || true
echo "stderr revoked:"; cat "$TEST_ROOT/scene5_tpm_principals_revoked.err" || true
if [ $AP_REVOKED_RC -eq 0 ]; then
  echo "AuthorizedPrincipals allowed revoked tpm cert (unexpected)"; exit 4
else
  echo "Revoked tpm cert correctly denied"
fi

# Ensure attestation log present
if grep -q "scene5_tpm_sim" "$MIGRATION_LOG"; then
  echo "Migration log contains TPM simulation events"
else
  echo "Missing TPM simulation log"; cat "$MIGRATION_LOG" || true; exit 5
fi
set +x

rm -rf "$TEST_ROOT"

echo "Scene 5 TPM attestation tests passed"
exit 0
