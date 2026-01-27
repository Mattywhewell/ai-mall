#!/usr/bin/env bash
set -euo pipefail

# Test that authorized_principals_command.sh passes per-device policy file and PCR mode to verifier
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="${ROOT_DIR}/tmp_test_authorized"
rm -rf "$TMP_DIR" && mkdir -p "$TMP_DIR/etc/ssh/keys/hardware"

DEVICE="real-device-tpm"
ATTEST_FILE="$TMP_DIR/attest.json"
PUBKEY_FILE="$TMP_DIR/${DEVICE}.pub"
POLICY_FILE="$TMP_DIR/etc/ssh/keys/hardware/${DEVICE}.json"
MOCK_LOG="$TMP_DIR/mock_verify.args"

echo '{"some":"attest"}' > "$ATTEST_FILE"
echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC' > "$PUBKEY_FILE"
echo '{"mode":"permissive"}' > "$POLICY_FILE"

# Create mock verifier
MOCK_VERIFY="$TMP_DIR/mock_verify.sh"
cat > "$MOCK_VERIFY" <<'EOF'
#!/usr/bin/env bash
# write all args to a file for inspection
echo "$@" > "$1".mock_args
# Also write a single line to MOCK_LOG path if provided via MOCK_LOG env
if [ -n "${MOCK_LOG:-}" ]; then
  echo "$@" > "$MOCK_LOG"
fi
exit 0
EOF
chmod +x "$MOCK_VERIFY"

# Run authorized_principals_command.sh with VERIFY_SCRIPT overridden
TEST_ROOT="$TMP_DIR" VERIFY_SCRIPT="$MOCK_VERIFY" MOCK_LOG="$MOCK_LOG" "$ROOT_DIR/authorized_principals_command.sh" "$DEVICE" "$ATTEST_FILE" "$PUBKEY_FILE"

# Inspect mock log
if [ ! -f "$MOCK_LOG" ]; then
  echo "Mock verify was not invoked" >&2
  exit 3
fi

ARGS=$(cat "$MOCK_LOG")

# Expect args: device attest pubkey tpm policy_file permissive
EXPECTED="$DEVICE $ATTEST_FILE $PUBKEY_FILE tpm $POLICY_FILE permissive"

if [ "$ARGS" != "$EXPECTED" ]; then
  echo "Unexpected args from verifier mock: $ARGS" >&2
  echo "Expected: $EXPECTED" >&2
  exit 4
fi

echo "test_authorized_principals_policy.sh: OK"
exit 0
