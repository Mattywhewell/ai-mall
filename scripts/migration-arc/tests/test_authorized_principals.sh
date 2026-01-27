#!/usr/bin/env bash
# Test AuthorizedPrincipalsCommand-style revocation checks
set -euo pipefail
TEST_ROOT=${TEST_ROOT:-$(mktemp -d)}
export TEST_ROOT
export MIGRATION_LOG=${TEST_ROOT}/migration-arc.ndjson

echo "Running authorized principals tests in TEST_ROOT=$TEST_ROOT"

# Setup test CA
mkdir -p "$TEST_ROOT/root"
CA_KEY="$TEST_ROOT/root/ssh_ca"
ssh-keygen -t ed25519 -f "$CA_KEY" -N '' -C 'test-ca' >/dev/null

# Generate user key and issue cert with principals
USER_KEY="$TEST_ROOT/userkey"
ssh-keygen -t ed25519 -f "$USER_KEY" -N '' -C 'test-user' >/dev/null
PUBKEY="$USER_KEY.pub"

# Issue cert valid for 120s with principals 'adele,admin'
CA_KEY="$CA_KEY" TEST_ROOT="$TEST_ROOT" DURATION=120 $(dirname "$0")/../issue_cert.sh "$PUBKEY" "adele,admin" "$TEST_ROOT/user-cert.pub"

# Check authorized principals allows before revoke
if $(dirname "$0")/../authorized_principals_command.sh "$TEST_ROOT/user-cert.pub" "$TEST_ROOT/etc/ssh/revoked_cert_serials" > "$TEST_ROOT/principals.out" 2>/dev/null; then
  echo "AuthorizedPrincipals returned:"; cat "$TEST_ROOT/principals.out"
  if grep -q "adele" "$TEST_ROOT/principals.out" && grep -q "admin" "$TEST_ROOT/principals.out"; then
    echo "Principals present as expected"
  else
    echo "Principals not as expected"; exit 2
  fi
else
  echo "AuthorizedPrincipals denied unexpectedly"; exit 3
fi

# Revoke cert
$(dirname "$0")/../revoke_cert.sh "$TEST_ROOT/user-cert.pub"

# Now the check must fail (no principals)
if $(dirname "$0")/../authorized_principals_command.sh "$TEST_ROOT/user-cert.pub" "$TEST_ROOT/etc/ssh/revoked_cert_serials" > /dev/null 2>/dev/null; then
  echo "AuthorizedPrincipals allowed revoked cert (unexpected)"; exit 4
else
  echo "Revoked cert correctly denied"
fi

# Ensure logs contain entries
if grep -q "authorized_principals" "$MIGRATION_LOG"; then
  echo "Log contains authorized_principals entries"
  exit 0
else
  echo "Missing authorized_principals logs"; cat "$MIGRATION_LOG" || true; exit 5
fi