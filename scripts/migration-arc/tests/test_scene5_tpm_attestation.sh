#!/usr/bin/env bash
# Test TPM attestation flow: simulate TPM, enroll, issue cert bound to TPM device, verify principals & revocation
set -euo pipefail
TEST_ROOT=${TEST_ROOT:-$(mktemp -d)}
export TEST_ROOT
export MIGRATION_LOG=${MIGRATION_LOG:-$TEST_ROOT/migration-arc.ndjson}

echo "Running Scene 5 TPM attestation tests in TEST_ROOT=$TEST_ROOT"

# Prepare CA
mkdir -p "$TEST_ROOT/root"
CA_KEY="$TEST_ROOT/root/ssh_ca"
ssh-keygen -t ed25519 -f "$CA_KEY" -N '' -C 'test-ca' >/dev/null

# Simulate TPM and enroll
mkdir -p "$TEST_ROOT/scene5"
$(dirname "$0")/../scene-5/enroll_tpm.sh test-device-tpm "$TEST_ROOT/scene5"

# Ensure attestation present
ATTEST="$TEST_ROOT/etc/ssh/keys/hardware/attestations/test-device-tpm-attestation.json"
if [ ! -f "$ATTEST" ]; then
  echo "Missing attestation file: $ATTEST"; cat "$MIGRATION_LOG" || true; exit 2
fi

# Issue cert with principal tagging the device
PUBKEY="$TEST_ROOT/userkey.pub"
ssh-keygen -t ed25519 -f "$TEST_ROOT/userkey" -N '' -C 'test-user' >/dev/null
PUBKEY="$TEST_ROOT/userkey.pub"
CA_KEY="$CA_KEY" TEST_ROOT="$TEST_ROOT" DURATION=120 $(dirname "$0")/../issue_cert.sh "$PUBKEY" "tpm:test-device-tpm" "$TEST_ROOT/user-cert.pub"

# Check AuthorizedPrincipals accepts device principal
if $(dirname "$0")/../authorized_principals_command.sh "$TEST_ROOT/user-cert.pub" "$TEST_ROOT/etc/ssh/revoked_cert_serials" > "$TEST_ROOT/scene5_tpm_principals.out" 2>/dev/null; then
  echo "AuthorizedPrincipals returned for tpm-bound cert:"; cat "$TEST_ROOT/scene5_tpm_principals.out"
else
  echo "AuthorizedPrincipals denied tpm-bound cert (unexpected)"; cat "$MIGRATION_LOG" || true; exit 3
fi

# Revoke and ensure denial
$(dirname "$0")/../revoke_cert.sh "$TEST_ROOT/user-cert.pub"
if $(dirname "$0")/../authorized_principals_command.sh "$TEST_ROOT/user-cert.pub" "$TEST_ROOT/etc/ssh/revoked_cert_serials" >/dev/null 2>/dev/null; then
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

rm -rf "$TEST_ROOT"

echo "Scene 5 TPM attestation tests passed"
exit 0
