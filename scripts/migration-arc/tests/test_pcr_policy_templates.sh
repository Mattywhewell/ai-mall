#!/usr/bin/env bash
set -euo pipefail

# Automated test: canonical policy templates + strict/permissive behavior
TEST_ROOT=$(mktemp -d)
export TEST_ROOT

DEVICE="test-device"
mkdir -p "$TEST_ROOT/etc/ssh/keys/hardware" "$TEST_ROOT/bin"

# Simple pubkey and attestation with pcrs
PUBKEY="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC"
echo "$PUBKEY" > "$TEST_ROOT/${DEVICE}.pub"

ATT_JSON=$(cat <<EOF
{
  "pubkey": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC",
  "type": "tpm",
  "attestation": "$(echo -n quote | base64 -w0)",
  "signature": "$(echo -n sig | base64 -w0)",
  "pcrs": {"0":"1111","1":"2222"},
  "ak_pub_pem": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----"
}
EOF
)
# No envsubst needed; heredoc expanded subshells already
echo "$ATT_JSON" > "$TEST_ROOT/attest.json"

# Create a fake tpm2_checkquote that always succeeds
cat > "$TEST_ROOT/bin/tpm2_checkquote" <<'EOF'
#!/usr/bin/env bash
# Fake verifier for tests - accept arguments and succeed
exit 0
EOF
chmod +x "$TEST_ROOT/bin/tpm2_checkquote"
export PATH="$TEST_ROOT/bin:$PATH"

# 1) Strict prod policy: matching PCRs -> allow
cp scripts/migration-arc/policies/prod.json "$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json"
if ! scripts/migration-arc/authorized_principals_command.sh "$DEVICE" "$TEST_ROOT/attest.json" "$TEST_ROOT/${DEVICE}.pub"; then
  echo "Strict prod policy failed unexpectedly" >&2
  exit 2
fi

echo "Strict prod policy with matching PCRs: OK"

# 2) Strict prod policy: tampered PCR in policy -> deny
cat > "$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json" <<'EOF'
{
  "mode": "strict",
  "pcrs": {"0": "1111", "1": "deadbeef"}
}
EOF
set +e
scripts/migration-arc/authorized_principals_command.sh "$DEVICE" "$TEST_ROOT/attest.json" "$TEST_ROOT/${DEVICE}.pub"
RC=$?
set -e
if [ $RC -eq 0 ]; then
  echo "Strict policy accepted tampered PCRs" >&2
  exit 3
fi

echo "Strict policy rejected tampered PCRs: OK"

# 3) Permissive policy: tampered PCRs -> warn + allow
cp scripts/migration-arc/policies/dev.json "$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json"
# But create a permissive policy that includes a mismatch on PCR 1
cat > "$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json" <<'EOF'
{
  "mode": "permissive",
  "pcrs": {"0": "1111", "1": "deadbeef"}
}
EOF
# Capture stderr to inspect for warning
set +e
OUT=$(scripts/migration-arc/authorized_principals_command.sh "$DEVICE" "$TEST_ROOT/attest.json" "$TEST_ROOT/${DEVICE}.pub" 2>&1)
RC=$?
set -e
if [ $RC -ne 0 ]; then
  echo "Permissive policy unexpectedly denied tampered PCRs" >&2
  echo "$OUT" >&2
  exit 4
fi
if ! echo "$OUT" | grep -q 'pcr_policy_mismatch'; then
  echo "Permissive policy did not log pcr_policy_mismatch warning" >&2
  echo "$OUT" >&2
  exit 5
fi

echo "Permissive policy logged mismatch and allowed access: OK"

# 4) Malformed policy -> verify should fail with malformed_expected_pcrs
echo '{ invalid json' > "$TEST_ROOT/etc/ssh/keys/hardware/${DEVICE}.json"
set +e
OUT=$(scripts/migration-arc/authorized_principals_command.sh "$DEVICE" "$TEST_ROOT/attest.json" "$TEST_ROOT/${DEVICE}.pub" 2>&1)
RC=$?
set -e
if [ $RC -eq 0 ]; then
  echo "Malformed policy did not cause verifier to fail" >&2
  exit 6
fi
if ! echo "$OUT" | grep -q 'malformed_expected_pcrs'; then
  echo "Malformed policy did not emit malformed_expected_pcrs NDJSON" >&2
  echo "$OUT" >&2
  exit 7
fi

echo "Malformed policy detected and verifier failed with NDJSON event: OK"

echo "test_pcr_policy_templates.sh: ALL OK"
exit 0
