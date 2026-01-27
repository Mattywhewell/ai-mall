#!/usr/bin/env bash
set -euo pipefail

# Hermetic YubiKey Y2 tests: real cert parsing, chain validation, fingerprint enforcement, slot/label checks
TEST_ROOT=$(mktemp -d)
export TEST_ROOT
DEVICE=test-yubikey
mkdir -p "$TEST_ROOT/etc/ssh/keys/hardware"

# Create a CA and a leaf cert signed by the CA
OPENSSL_SUBJ_CA="/CN=Test Yubi CA"
OPENSSL_SUBJ_LEAF="/CN=YubiKey-Test"

CA_KEY="$TEST_ROOT/ca.key"
CA_CRT="$TEST_ROOT/ca.crt"
LEAF_KEY="$TEST_ROOT/leaf.key"
LEAF_CSR="$TEST_ROOT/leaf.csr"
LEAF_CRT="$TEST_ROOT/leaf.crt"

openssl genrsa -out "$CA_KEY" 2048 >/dev/null 2>&1
openssl req -new -x509 -days 365 -key "$CA_KEY" -subj "$OPENSSL_SUBJ_CA" -out "$CA_CRT" >/dev/null 2>&1
openssl genrsa -out "$LEAF_KEY" 2048 >/dev/null 2>&1
openssl req -new -key "$LEAF_KEY" -subj "$OPENSSL_SUBJ_LEAF" -out "$LEAF_CSR" >/dev/null 2>&1
openssl x509 -req -in "$LEAF_CSR" -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial -out "$LEAF_CRT" -days 365 -sha256 >/dev/null 2>&1

# Compute fingerprint in the expected canonical form: SHA256:<HEX NO COLONS>
FP_HEX=$(openssl x509 -noout -fingerprint -sha256 -in "$LEAF_CRT" | awk -F'=' '{print $NF}' | tr -d ':' | tr -d '\n' | tr '[:lower:]' '[:upper:]')
CERT_FP="SHA256:$FP_HEX"

# Build attest JSON (cert_pem from leaf cert)
cat > "$TEST_ROOT/attest.json" <<EOF
{
  "type": "yubikey",
  "cert_pem": $(jq -Rs . < "$LEAF_CRT"),
  "cert_fingerprint": "$CERT_FP",
  "slot": "9a",
  "label": "YubiKey-Test"
}
EOF

# Copy CA to TEST_ROOT so verifier can find it at TEST_ROOT/yubikey_ca.pem
cp "$CA_CRT" "$TEST_ROOT/yubikey_ca.pem"

# Expected pubkey (not used but keep consistent)
echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCFAKE' > "$TEST_ROOT/${DEVICE}.pub"

# 1) Valid chain + matching fingerprint -> allow
cat > "$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json" <<EOF
{"mode":"strict","fingerprint":"$CERT_FP"}
EOF

if ! scripts/migration-arc/authorized_principals_command.sh "$DEVICE" "$TEST_ROOT/attest.json" "$TEST_ROOT/${DEVICE}.pub"; then
  echo "Valid chain + matching fingerprint: unexpected failure" >&2
  exit 2
fi

echo "Valid chain + matching fingerprint: OK"

# 2) Bad chain (replace CA with a different CA) -> fail with cert_chain_invalid
openssl genrsa -out "$TEST_ROOT/other_ca.key" 2048 >/dev/null 2>&1
openssl req -new -x509 -days 365 -key "$TEST_ROOT/other_ca.key" -subj "/CN=Other CA" -out "$TEST_ROOT/other_ca.crt" >/dev/null 2>&1
mv "$TEST_ROOT/other_ca.crt" "$TEST_ROOT/yubikey_ca.pem"
set +e
OUT=$(scripts/migration-arc/authorized_principals_command.sh "$DEVICE" "$TEST_ROOT/attest.json" "$TEST_ROOT/${DEVICE}.pub" 2>&1)
RC=$?
set -e
if [ $RC -eq 0 ]; then
  echo "Bad chain accepted unexpectedly" >&2
  echo "$OUT" >&2
  exit 3
fi
if ! echo "$OUT" | grep -q 'cert_chain_invalid'; then
  echo "Bad chain did not log cert_chain_invalid" >&2
  echo "$OUT" >&2
  exit 4
fi

echo "Bad chain test: OK"

# Restore good CA
cp "$CA_CRT" "$TEST_ROOT/yubikey_ca.pem"

# 3) Mismatched fingerprint strict -> deny
cat > "$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json" <<EOF
{"mode":"strict","fingerprint":"SHA256:0000DEADBEEF"}
EOF
set +e
scripts/migration-arc/authorized_principals_command.sh "$DEVICE" "$TEST_ROOT/attest.json" "$TEST_ROOT/${DEVICE}.pub"
RC=$?
set -e
if [ $RC -eq 0 ]; then
  echo "Strict mismatched fingerprint accepted unexpectedly" >&2
  exit 5
fi

echo "Strict mismatched fingerprint: OK"

# 4) Mismatched fingerprint permissive -> warn + allow
cat > "$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json" <<EOF
{"mode":"permissive","fingerprint":"SHA256:0000DEADBEEF"}
EOF
OUT=$(scripts/migration-arc/authorized_principals_command.sh "$DEVICE" "$TEST_ROOT/attest.json" "$TEST_ROOT/${DEVICE}.pub" 2>&1 || true)
if ! echo "$OUT" | grep -q 'fingerprint_mismatch'; then
  echo "Permissive mismatch did not log fingerprint_mismatch" >&2
  echo "$OUT" >&2
  exit 6
fi

echo "Permissive fingerprint mismatch: OK"

# 5) Malformed cert -> malformed_attestation
cat > "$TEST_ROOT/attest.json" <<EOF
{
  "type": "yubikey",
  "cert_pem": "not-a-cert",
  "cert_fingerprint": "SHA256:DEADBEEF",
  "slot": "9a",
  "label": "YubiKey-Test"
}
EOF
set +e
OUT=$(scripts/migration-arc/authorized_principals_command.sh "$DEVICE" "$TEST_ROOT/attest.json" "$TEST_ROOT/${DEVICE}.pub" 2>&1)
RC=$?
set -e
if [ $RC -eq 0 ]; then
  echo "Malformed cert accepted unexpectedly" >&2
  echo "$OUT" >&2
  exit 7
fi
if ! echo "$OUT" | grep -q 'malformed_attestation'; then
  echo "Malformed cert did not log malformed_attestation" >&2
  echo "$OUT" >&2
  exit 8
fi

echo "Malformed cert test: OK"

# 6) Slot/label checks: matching values -> allow
cat > "$TEST_ROOT/attest.json" <<EOF
{
  "type": "yubikey",
  "cert_pem": $(jq -Rs . < "$LEAF_CRT"),
  "cert_fingerprint": "$CERT_FP",
  "slot": "9a",
  "label": "YubiKey-Test"
}
EOF
cat > "$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json" <<EOF
{"mode":"strict","fingerprint":"$CERT_FP","slot":"9a","label":"YubiKey-Test"}
EOF
if ! scripts/migration-arc/authorized_principals_command.sh "$DEVICE" "$TEST_ROOT/attest.json" "$TEST_ROOT/${DEVICE}.pub"; then
  echo "Slot/label matching test failed unexpectedly" >&2
  exit 9
fi

echo "Slot/label matching: OK"

# 7) Slot mismatch strict -> deny
cat > "$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json" <<EOF
{"mode":"strict","fingerprint":"$CERT_FP","slot":"9b"}
EOF
set +e
scripts/migration-arc/authorized_principals_command.sh "$DEVICE" "$TEST_ROOT/attest.json" "$TEST_ROOT/${DEVICE}.pub"
RC=$?
set -e
if [ $RC -eq 0 ]; then
  echo "Slot mismatch (strict) accepted unexpectedly" >&2
  exit 10
fi

echo "Slot mismatch (strict): OK"

# 8) Slot mismatch permissive -> warn + allow
cat > "$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json" <<EOF
{"mode":"permissive","fingerprint":"$CERT_FP","slot":"9b"}
EOF
OUT=$(scripts/migration-arc/authorized_principals_command.sh "$DEVICE" "$TEST_ROOT/attest.json" "$TEST_ROOT/${DEVICE}.pub" 2>&1 || true)
if ! echo "$OUT" | grep -q 'slot_mismatch'; then
  echo "Permissive slot mismatch did not log slot_mismatch" >&2
  echo "$OUT" >&2
  exit 11
fi

echo "Slot mismatch (permissive): OK"

# Cleanup and exit
echo "test_yubikey_attestation_y2.sh: ALL OK"
exit 0
