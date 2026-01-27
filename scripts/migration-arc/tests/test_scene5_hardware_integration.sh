#!/usr/bin/env bash
# Scene 5 hardware integration test (opt-in). Defaults to stubs; opt-in real hardware with CI_RUN_SCENE5=true
set -euo pipefail
TEST_ROOT=${TEST_ROOT:-$(mktemp -d)}
export TEST_ROOT
export MIGRATION_LOG=${MIGRATION_LOG:-$TEST_ROOT/migration-arc.ndjson}

if [ "${CI_RUN_SCENE5:-false}" != "true" ]; then
  echo "Scene 5 hardware tests skipped (set CI_RUN_SCENE5=true to enable real hardware tests)"
  exit 0
fi

# Simulated flow (for now): enroll fake hardware pubkey, issue cert tied to device, verify AuthorizedPrincipals accepts it
mkdir -p "$TEST_ROOT/etc/ssh/keys/hardware"
# create a fake hardware key
ssh-keygen -t ed25519 -f "$TEST_ROOT/hwkey" -N '' -C 'hw-device' >/dev/null
cp "$TEST_ROOT/hwkey.pub" "$TEST_ROOT/etc/ssh/keys/hardware/test-device-1.pub"

# Enroll (simulation)
$(dirname "$0")/../scene-5/enroll_hardware.sh test-device-1 --type=yubikey --pubkey-file "$TEST_ROOT/etc/ssh/keys/hardware/test-device-1.pub"

# Issue cert bound to that 'hardware' key (principals include device marker)
CA_KEY="$TEST_ROOT/root/ssh_ca"
mkdir -p "$TEST_ROOT/root"
ssh-keygen -t ed25519 -f "$CA_KEY" -N '' -C 'test-ca' >/dev/null

# Use existing issue_cert.sh with 'device:test-device-1' principal to mark hardware binding
PUBKEY="$TEST_ROOT/userkey.pub"
ssh-keygen -t ed25519 -f "$TEST_ROOT/userkey" -N '' -C 'test-user' >/dev/null
PUBKEY="$TEST_ROOT/userkey.pub"
CA_KEY="$CA_KEY" TEST_ROOT="$TEST_ROOT" DURATION=120 $(dirname "$0")/../issue_cert.sh "$PUBKEY" "test-device-1" "$TEST_ROOT/user-cert.pub"

# Check AuthorizedPrincipals accepts the device principal
if $(dirname "$0")/../authorized_principals_command.sh "$TEST_ROOT/user-cert.pub" "$TEST_ROOT/etc/ssh/revoked_cert_serials" > "$TEST_ROOT/scene5_principals.out" 2>/dev/null; then
  echo "AuthorizedPrincipals returned for hardware-bound cert:"; cat "$TEST_ROOT/scene5_principals.out"
else
  echo "AuthorizedPrincipals denied hardware-bound cert (unexpected)"; exit 2
fi

# Clean up
rm -rf "$TEST_ROOT"

echo "Scene 5 (hardware simulation) tests passed"
exit 0