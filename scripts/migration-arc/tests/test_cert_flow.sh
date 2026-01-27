#!/usr/bin/env bash
# End-to-end (sandboxed) test of enroll -> issue cert -> revoke
set -euo pipefail
TEST_ROOT=${TEST_ROOT:-$(mktemp -d)}
export TEST_ROOT
export MIGRATION_LOG=${TEST_ROOT}/migration-arc.ndjson

echo "Running cert flow tests in TEST_ROOT=$TEST_ROOT"

# Setup test CA
mkdir -p "$TEST_ROOT/root"
CA_KEY="$TEST_ROOT/root/ssh_ca"
ssh-keygen -t ed25519 -f "$CA_KEY" -N '' -C 'test-ca' >/dev/null

# Generate a user key simulating YubiKey pub
USER_KEY="$TEST_ROOT/userkey"
ssh-keygen -t ed25519 -f "$USER_KEY" -N '' -C 'test-user' >/dev/null
PUBKEY="$USER_KEY.pub"

# Enroll device (should write to TEST_ROOT/etc/ssh/keys/devices)
DEVICE_ID=test-yubikey-1
PUBKEY_FILE="$PUBKEY" TEST_ROOT="$TEST_ROOT" DEVICE_ID="$DEVICE_ID" $(dirname "$0")/../enroll_yubikey.sh

# Issue cert
CA_KEY="$CA_KEY" TEST_ROOT="$TEST_ROOT" DURATION=60 $(dirname "$0")/../issue_cert.sh "$PUBKEY" "test-user" "$TEST_ROOT/user-cert.pub"

# Validate cert exists and check serial
if [ ! -f "$TEST_ROOT/user-cert.pub" ]; then
  echo "Certificate not created"; exit 2
fi

SERIAL=$(ssh-keygen -Lf "$TEST_ROOT/user-cert.pub" | awk '/Serial/ {print $2; exit}')
if [ -z "$SERIAL" ]; then
  echo "Certificate serial not found"; exit 3
fi

echo "Certificate issued with serial: $SERIAL"

# Revoke cert
TEST_ROOT="$TEST_ROOT" REVOCATION_LIST="$TEST_ROOT/etc/ssh/revoked_cert_serials" $(dirname "$0")/../revoke_cert.sh "$TEST_ROOT/user-cert.pub"

# Check revoked list
if ! grep -q "^$SERIAL$" "$TEST_ROOT/etc/ssh/revoked_cert_serials"; then
  echo "Revocation not recorded"; exit 4
fi

echo "Revocation recorded: $SERIAL"

# Check NDJSON log contains entries for steps
if grep -q "issue_cert" "$MIGRATION_LOG" && grep -q "revoke_cert" "$MIGRATION_LOG" && grep -q "enroll_yubikey" "$MIGRATION_LOG"; then
  echo "Cert flow logs present"
  exit 0
else
  echo "Missing expected log entries"
  cat "$MIGRATION_LOG" || true
  exit 5
fi