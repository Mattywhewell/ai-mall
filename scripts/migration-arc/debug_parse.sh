#!/usr/bin/env bash
set -euo pipefail
TEST_ROOT=${TEST_ROOT:-/tmp/debug-test-$$}
rm -rf "$TEST_ROOT"
mkdir -p "$TEST_ROOT/root"
CA_KEY="$TEST_ROOT/root/ssh_ca"
ssh-keygen -t ed25519 -f "$CA_KEY" -N '' -C 'test-ca' >/dev/null
USER_KEY="$TEST_ROOT/userkey"
ssh-keygen -t ed25519 -f "$USER_KEY" -N '' -C 'test-user' >/dev/null
PUBKEY="$USER_KEY.pub"
export MIGRATION_LOG="$TEST_ROOT/migration-arc.ndjson"
CA_KEY="$CA_KEY" TEST_ROOT="$TEST_ROOT" DURATION=120 ./issue_cert.sh "$PUBKEY" "adele,admin" "$TEST_ROOT/user-cert.pub"
CERT="$TEST_ROOT/user-cert.pub"
SSH_LF_OUT=$(ssh-keygen -Lf "$CERT" 2>/dev/null || true)
echo "--- SSH_LF_OUT START ---"
echo "$SSH_LF_OUT"
echo "--- SSH_LF_OUT END ---"
# Run extraction steps
PR_LINE=$(echo "$SSH_LF_OUT" | grep -i -E '^\s*Principals:|^\s*Valid principals' -m1 || true)
echo "PR_LINE=[$PR_LINE]"
PRINCIPALS_LINE=$(echo "$PR_LINE" | sed -E 's/^[^:]*:[[:space:]]*//' || true)
echo "PRINCIPALS_LINE_AFTER_PR_LINE=[$PRINCIPALS_LINE]"
PRINCIPALS_LINE2=$(echo "$SSH_LF_OUT" | sed -nE 's/.* for ([^ ]+(, *[^ ]+)*) valid.*/\1/p' || true)
echo "PRINCIPALS_LINE2=[$PRINCIPALS_LINE2]"
# Attempt block-style extraction (indented list after 'Principals:')
PRINCIPALS_LINE_AWK=$(echo "$SSH_LF_OUT" | awk '/^[[:space:]]*Principals:/{p=1; next} p && /^[[:space:]]+[^[:space:]]/ && $0 !~ /:/{gsub(/^[[:space:]]+/,"",$0); print $0; next} p{exit}' | paste -sd ',' - || true)
echo "PRINCIPALS_LINE_AWK=[$PRINCIPALS_LINE_AWK]"
SSH_LF_ONE_LINE=$(echo "$SSH_LF_OUT" | tr '\n' ' ')
echo "SSH_LF_ONE_LINE=[$SSH_LF_ONE_LINE]"
PRINCIPALS_LINE3=$(echo "$SSH_LF_ONE_LINE" | sed -nE 's/.* for ([^ ]+(, *[^ ]+)*) valid.*/\1/p' || true)
echo "PRINCIPALS_LINE3=[$PRINCIPALS_LINE3]"
PRINCIPALS_LINE4=$(echo "$SSH_LF_ONE_LINE" | awk 'match($0,/ for ([^ ]+(, *[^ ]+)*) valid/,a){print a[1]}' || true)
echo "PRINCIPALS_LINE4=[$PRINCIPALS_LINE4]"
PRINCIPALS_LINE5=$(echo "$SSH_LF_OUT" | awk 'BEGIN{found=0} {for(i=1;i<=NF;i++){if(found){ if($i=="valid"){found=0; exit} printf "%s ",$i} if($i=="for"){found=1}}} END{if(found)print ""}' | sed 's/ $//' || true)
echo "PRINCIPALS_LINE5=[$PRINCIPALS_LINE5]"

echo "Migration log contents:"
cat "$TEST_ROOT/migration-arc.ndjson" || true
rm -rf "$TEST_ROOT"
exit 0
