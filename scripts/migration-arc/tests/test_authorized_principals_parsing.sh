#!/usr/bin/env bash
# Test AuthorizedPrincipalsCommand parsing variants (single-line, block, wrapped)
set -euo pipefail
TEST_ROOT=${TEST_ROOT:-$(mktemp -d)}
export TEST_ROOT
export MIGRATION_LOG=${MIGRATION_LOG:-$TEST_ROOT/migration-arc.ndjson}

echo "Running authorized principals parsing-variant tests in TEST_ROOT=$TEST_ROOT"

run_case() {
  local case_name=$1
  local ssl_out_file="${TEST_ROOT}/${case_name}.pub"
  touch "$ssl_out_file"

  # Create stub ssh-keygen that outputs the chosen variant when called with -Lf <file>
  STUB_BIN=$(mktemp -d)
  cat > "$STUB_BIN/ssh-keygen" <<'SH'
#!/usr/bin/env bash
# Simple stub: find the argument after -Lf
ARGS=()
for a in "$@"; do ARGS+=("$a"); done
FILE=""
for i in "${!ARGS[@]}"; do
  if [ "${ARGS[$i]}" = "-Lf" ] && [ $((i+1)) -le ${#ARGS[@]} ]; then
    FILE="${ARGS[$((i+1))]}"
    break
  fi
done
BASE=$(basename "$FILE")
case "$BASE" in
  case_single.pub)
    # single-line summary + Serial line
    echo "Signed user key $FILE: id \"alverse-1001\" serial 1001 for adele,admin valid from ... to ..."
    echo "Serial: 1001"
    ;;
  case_block.pub)
    # Block-style output (Principals on indented lines)
    echo "$FILE:"
    echo "        Type: ssh-ed25519-cert-v01@openssh.com user certificate"
    echo "        Serial: 1002"
    echo "        Principals:"
    echo "                adele"
    echo "                admin"
    ;;
  case_wrapped.pub)
    # Wrapped 'for ...' split across lines
    echo "Signed user key $FILE: id \"alverse-1003\" serial 1003 for adele,"
    echo " valid from ... to ..."
    echo "Serial: 1003"
    ;;
  *)
    # default fallback: mimic a minimal -Lf
    echo "$FILE:"
    echo "        Serial: 9999"
    echo "        Principals: adele,admin"
    ;;
esac
SH
  chmod +x "$STUB_BIN/ssh-keygen"

  # Run the check using the stubbed ssh-keygen
  PATH="$STUB_BIN:$PATH" \
    $(dirname "$0")/../authorized_principals_command.sh "$ssl_out_file" "$TEST_ROOT/etc/ssh/revoked_cert_serials" > "$TEST_ROOT/${case_name}.out" 2>/dev/null

  echo "Case $case_name output:"; cat "$TEST_ROOT/${case_name}.out"

  if ! grep -q "adele" "$TEST_ROOT/${case_name}.out" || ! grep -q "admin" "$TEST_ROOT/${case_name}.out"; then
    echo "Principals not extracted as expected for $case_name"; exit 2
  fi

  # Now revoke and assert it's denied
  echo "$(awk '/Serial/ {print $2; exit}' <("$STUB_BIN/ssh-keygen" -Lf "$ssl_out_file" 2>/dev/null))" > "$TEST_ROOT/etc/ssh/revoked_cert_serials"
  if PATH="$STUB_BIN:$PATH" \
       $(dirname "$0")/../authorized_principals_command.sh "$ssl_out_file" "$TEST_ROOT/etc/ssh/revoked_cert_serials" > /dev/null 2>/dev/null; then
    echo "AuthorizedPrincipals allowed revoked cert for $case_name (unexpected)"; exit 3
  else
    echo "Revoked cert correctly denied for $case_name"
  fi

  # ensure log entry exists
  if ! grep -q "authorized_principals" "$MIGRATION_LOG"; then
    echo "Missing authorized_principals log for $case_name"; cat "$MIGRATION_LOG" || true; exit 4
  fi

  # cleanup stub
  rm -rf "$STUB_BIN"
}

mkdir -p "$TEST_ROOT/etc/ssh"
run_case case_single
run_case case_block
run_case case_wrapped

echo "Parsing-variant tests passed"
exit 0
