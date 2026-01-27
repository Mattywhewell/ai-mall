#!/usr/bin/env bash
# Simulated sshd integration test for AuthorizedPrincipalsCommand behavior
set -euo pipefail
TEST_ROOT=${TEST_ROOT:-$(mktemp -d)}
export TEST_ROOT
export MIGRATION_LOG=${TEST_ROOT}/migration-arc.ndjson

echo "Running simulated sshd integration test in TEST_ROOT=$TEST_ROOT"

# Setup test CA
mkdir -p "$TEST_ROOT/root"
CA_KEY="$TEST_ROOT/root/ssh_ca"
ssh-keygen -t ed25519 -f "$CA_KEY" -N '' -C 'test-ca' >/dev/null

# Generate user key and issue cert with principals 'adele,admin'
USER_KEY="$TEST_ROOT/userkey"
ssh-keygen -t ed25519 -f "$USER_KEY" -N '' -C 'test-user' >/dev/null
PUBKEY="$USER_KEY.pub"

# Issue cert valid for 120s with principals 'adele,admin'
CA_KEY="$CA_KEY" TEST_ROOT="$TEST_ROOT" DURATION=120 $(dirname "$0")/../issue_cert.sh "$PUBKEY" "adele,admin" "$TEST_ROOT/user-cert.pub"

CERT="$TEST_ROOT/user-cert.pub"
REVOCATION_LIST="$TEST_ROOT/etc/ssh/revoked_cert_serials"

# Simulate sshd calling AuthorizedPrincipalsCommand (should print principals)
set +e
OUT=$($(dirname "$0")/../authorized_principals_command.sh "$CERT" "$REVOCATION_LIST" 2>/dev/null)
RC=$?
set -e
if [ $RC -ne 0 ]; then
  echo "AuthorizedPrincipalsCommand failed unexpectedly (RC=$RC)"; exit 2
fi
if ! echo "$OUT" | grep -q "adele" || ! echo "$OUT" | grep -q "admin"; then
  echo "Principals missing from AuthorizedPrincipalsCommand output:"; echo "$OUT"; exit 3
fi

echo "AuthorizedPrincipalsCommand allowed principals as expected"

# Now revoke the cert
$(dirname "$0")/../revoke_cert.sh "$CERT"

# Simulate sshd again: command should fail/exit non-zero and produce no principals
set +e
OUT2=$($(dirname "$0")/../authorized_principals_command.sh "$CERT" "$REVOCATION_LIST" 2>/dev/null)
RC2=$?
set -e
if [ $RC2 -eq 0 ]; then
  echo "AuthorizedPrincipalsCommand unexpectedly allowed revoked cert (RC=0). Output: $OUT2"; exit 4
fi

echo "Revoked cert correctly denied by AuthorizedPrincipalsCommand (RC=$RC2)"

# Test behavior with malformed cert
BAD_CERT="$TEST_ROOT/bad-cert.pub"
echo "not-a-cert" > "$BAD_CERT"
set +e
$(dirname "$0")/../authorized_principals_command.sh "$BAD_CERT" "$REVOCATION_LIST" >/dev/null 2>/dev/null
RC3=$?
set -e
if [ $RC3 -eq 0 ]; then
  echo "AuthorizedPrincipalsCommand unexpectedly succeeded on malformed cert"; exit 5
fi

echo "Malformed cert correctly denied (RC=$RC3)"

# Ensure NDJSON logs contain authorized_principals entries for allow and deny
if ! grep -q "authorized_principals" "$MIGRATION_LOG"; then
  echo "Missing authorized_principals log entries"; cat "$MIGRATION_LOG" || true; exit 6
fi

echo "Simulated sshd integration test passed"
exit 0
