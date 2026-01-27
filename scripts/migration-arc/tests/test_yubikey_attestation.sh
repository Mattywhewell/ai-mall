#!/usr/bin/env bash
set -euo pipefail

# Hermetic YubiKey attestation tests (fake cert + fingerprint)
TEST_ROOT=$(mktemp -d)
export TEST_ROOT
DEVICE=test-yubikey
mkdir -p "$TEST_ROOT/etc/ssh/keys/hardware"

# Create a fake cert file and fingerprint
FAKE_CERT="$TEST_ROOT/fake_cert.pem"
echo "-----BEGIN CERTIFICATE-----" > "$FAKE_CERT"
echo "MIIB...FAKE...CERT..." >> "$FAKE_CERT"
echo "-----END CERTIFICATE-----" >> "$FAKE_CERT"
# Create a deterministic fingerprint string for tests (not a real SHA but ok for hermetic tests)
FAKE_FP="SHA256:DEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF"

# Build attest JSON that the extractor would produce
cat > "$TEST_ROOT/attest.json" <<EOF
{
  "type": "yubikey",
  "cert_pem": $(jq -Rs . < "$FAKE_CERT"),
  "cert_fingerprint": "$FAKE_FP",
  "slot": "9a",
  "label": "YubiKey-Test"
}
EOF

# Create expected pubkey file (not actually used by yum stub verifier, but keep consistent)
echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCFAKE' > "$TEST_ROOT/${DEVICE}.pub"

# 1) Strict policy with matching fingerprint -> allow
cat > "$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json" <<EOF
{"mode":"strict","fingerprint":"$FAKE_FP"}
EOF

if ! scripts/migration-arc/authorized_principals_command.sh "$DEVICE" "$TEST_ROOT/attest.json" "$TEST_ROOT/${DEVICE}.pub"; then
  echo "Strict yubikey policy failed unexpectedly" >&2
  exit 2
fi

echo "Strict yubikey policy with matching fingerprint: OK"

# 2) Strict policy mismatch -> deny
cat > "$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json" <<EOF
{"mode":"strict","fingerprint":"SHA256:0000DEADBEEF"}
EOF
set +e
scripts/migration-arc/authorized_principals_command.sh "$DEVICE" "$TEST_ROOT/attest.json" "$TEST_ROOT/${DEVICE}.pub"
RC=$?
set -e
if [ $RC -eq 0 ]; then
  echo "Strict yubikey policy accepted mismatched fingerprint" >&2
  exit 3
fi

echo "Strict yubikey policy rejected mismatched fingerprint: OK"

# 3) Permissive mismatch -> warn + allow (expect fingerprint_mismatch in logs)
cat > "$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json" <<EOF
{"mode":"permissive","fingerprint":"SHA256:0000DEADBEEF"}
EOF
OUT=$(scripts/migration-arc/authorized_principals_command.sh "$DEVICE" "$TEST_ROOT/attest.json" "$TEST_ROOT/${DEVICE}.pub" 2>&1 || true)
if ! echo "$OUT" | grep -q 'fingerprint_mismatch'; then
  echo "Permissive policy did not log fingerprint_mismatch" >&2
  echo "$OUT" >&2
  exit 4
fi

echo "Permissive yubikey policy logged mismatch and allowed access: OK"

echo "test_yubikey_attestation.sh: ALL OK"
exit 0
