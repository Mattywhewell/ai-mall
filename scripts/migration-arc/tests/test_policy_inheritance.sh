#!/usr/bin/env bash
set -euo pipefail

# Tests policy selection and inheritance rules for authorized_principals_command.sh
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="${ROOT_DIR}/tmp_test_policy_inheritance"
rm -rf "$TMP_DIR" && mkdir -p "$TMP_DIR/etc/ssh/keys/hardware"

DEVICE="foo-device"
PUBKEY="$TMP_DIR/${DEVICE}.pub"
ATTEST_FILE="$TMP_DIR/attest.json"
MOCK_LOG="$TMP_DIR/mock_verify.args"
MOCK_POLICY_COPY="$TMP_DIR/mock_policy.json"

# Create a synthetic attestation for tpm with PCRs 0 and 1
cat > "$ATTEST_FILE" <<'EOF'
{
  "pubkey": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC",
  "type": "tpm",
  "attestation": "cXVvdGU=",
  "signature": "c2ln",
  "pcrs": {"0":"1111","1":"2222"},
  "ak_pub_pem": "-----BEGIN PUBLIC KEY-----\nMIIBIj...\n-----END PUBLIC KEY-----"
}
EOF

echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC' > "$PUBKEY"

# Mock verifier that records args and copies the policy file
cat > "$TMP_DIR/mock_verify.sh" <<'EOF'
#!/usr/bin/env bash
# args: device attest pubkey type [policy-file] [mode]
echo "$@" > "$1".mock_args
# Copy policy to a fixed location provided by MOCK_POLICY_COPY env
if [ -n "$5" ] && [ -f "$5" ] && [ -n "${MOCK_POLICY_COPY:-}" ]; then
  cp "$5" "$MOCK_POLICY_COPY" || true
fi
exit 0
EOF
chmod +x "$TMP_DIR/mock_verify.sh"

# Utility to run with an injected VERIFY_SCRIPT and return parsed policy
run_and_get_policy() {
  TEST_ROOT="$TMP_DIR" VERIFY_SCRIPT="$TMP_DIR/mock_verify.sh" MOCK_LOG="$MOCK_LOG" MOCK_POLICY_COPY="$MOCK_POLICY_COPY" "$ROOT_DIR/authorized_principals_command.sh" "$DEVICE" "$ATTEST_FILE" "$PUBKEY" || true
  # Read the mock args file
  if [ -f "$TMP_DIR/$DEVICE.mock_args" ]; then
    ARGS=$(cat "$TMP_DIR/$DEVICE.mock_args")
  else
    ARGS=""
  fi
  if [ -f "$MOCK_POLICY_COPY" ]; then
    POLJSON=$(cat "$MOCK_POLICY_COPY")
  else
    POLJSON=""
  fi
}

# Case 1: repo-level prod policy should apply when no device policy exists
POL_DIR="$(dirname "$ROOT_DIR")/scripts/migration-arc/policies"
mkdir -p "$POL_DIR"
cat > "$POL_DIR/prod.json" <<'EOF'
{"mode":"strict","pcrs":{"0":"AAAA","1":"BBBB"}}
EOF

rm -f "$TMP_DIR/etc/ssh/keys/hardware/${DEVICE}.json" "$TMP_DIR/etc/ssh/keys/hardware/${DEVICE}.tpm.json" "$MOCK_POLICY_COPY"
TEST_ENV=prod run_and_get_policy
if ! echo "$POLJSON" | jq -e '.mode == "strict"' >/dev/null 2>&1; then
  echo "Case 1: expected repo-level prod policy to be used (mode=strict) but got: $POLJSON" >&2
  exit 2
fi

echo "Case 1: repo-level prod policy chosen: OK"

# Case 2: device-specific overrides repo-level
cat > "$TMP_DIR/etc/ssh/keys/hardware/${DEVICE}.json" <<'EOF'
{"mode":"permissive","pcrs":{"0":"1111"}}
EOF
TEST_ENV=prod run_and_get_policy
# Expect permissive mode used by device file
if ! echo "$POLJSON" | jq -e '.mode == "permissive"' >/dev/null 2>&1; then
  echo "Device-specific policy did not override prod (got: $POLJSON)" >&2
  exit 3
fi

echo "Case 2: device-specific policy overrides prod: OK"

# Case 3: device+type file overrides device.json
cat > "$TMP_DIR/etc/ssh/keys/hardware/${DEVICE}.tpm.json" <<'EOF'
{"mode":"strict","pcrs":{"0":"1111","1":"deadbeef"}}
EOF
TEST_ENV=prod run_and_get_policy
if ! echo "$POLJSON" | jq -e '.mode == "strict"' >/dev/null 2>&1; then
  echo "Device+type policy did not override device.json (got: $POLJSON)" >&2
  exit 4
fi

echo "Case 3: device+type overrides device: OK"

# Case 4: inheritance merging - device.json augments prod.json (device only overrides keys it specifies)
# Create prod with both PCRs, device only sets 1 to a new value; effective should have 0 from prod and 1 from device
cat > "$POL_DIR/prod.json" <<'EOF'
{"mode":"strict","pcrs":{"0":"AAAA","1":"BBBB"}}
EOF
cat > "$TMP_DIR/etc/ssh/keys/hardware/${DEVICE}.json" <<'EOF'
{"pcrs":{"1":"CCCC"}}
EOF
# remove device+type override so device.json participates
rm -f "$TMP_DIR/etc/ssh/keys/hardware/${DEVICE}.tpm.json" "$MOCK_POLICY_COPY"
TEST_ENV=prod run_and_get_policy
# merged policy should have pcr 0 from prod and pcr 1 overridden by device
MERGED=$(jq -s 'reduce .[] as $item ({}; . * $item)' "$POL_DIR/prod.json" "$TMP_DIR/etc/ssh/keys/hardware/${DEVICE}.json")
if ! echo "$MERGED" | jq -e '.pcrs["0"] == "AAAA" and .pcrs["1"] == "CCCC"' >/dev/null 2>&1; then
  echo "Case 4: inheritance merging failed (merged policy: $MERGED)" >&2
  exit 5
fi

echo "Case 4: inheritance merging OK"