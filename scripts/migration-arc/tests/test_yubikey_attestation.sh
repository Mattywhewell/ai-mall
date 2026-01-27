#!/usr/bin/env bash
set -euo pipefail

# Hermetic YubiKey attestation tests (fake cert + fingerprint)
TEST_ROOT=$(mktemp -d)
export TEST_ROOT
DEVICE=test-yubikey
mkdir -p "$TEST_ROOT/etc/ssh/keys/hardware"

# Create a minimal CA and leaf cert (hermetic) and derive fingerprint
CA_KEY="$TEST_ROOT/ca.key"
CA_CRT="$TEST_ROOT/ca.crt"
LEAF_KEY="$TEST_ROOT/leaf.key"
LEAF_CSR="$TEST_ROOT/leaf.csr"
LEAF_CRT="$TEST_ROOT/leaf.crt"

openssl genrsa -out "$CA_KEY" 2048 >/dev/null 2>&1
openssl req -new -x509 -days 365 -key "$CA_KEY" -subj "/CN=Test Yubi CA" -out "$CA_CRT" >/dev/null 2>&1
openssl genrsa -out "$LEAF_KEY" 2048 >/dev/null 2>&1
openssl req -new -key "$LEAF_KEY" -subj "/CN=YubiKey-Test" -out "$LEAF_CSR" >/dev/null 2>&1
openssl x509 -req -in "$LEAF_CSR" -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial -out "$LEAF_CRT" -days 365 -sha256 >/dev/null 2>&1

FAKE_CERT="$LEAF_CRT"
FP_HEX=$(openssl x509 -noout -fingerprint -sha256 -in "$LEAF_CRT" | awk -F'=' '{print $NF}' | tr -d ':' | tr -d '\n' | tr '[:lower:]' '[:upper:]')
FAKE_FP="SHA256:$FP_HEX"

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
