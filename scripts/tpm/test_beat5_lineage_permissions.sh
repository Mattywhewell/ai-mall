#!/usr/bin/env bash
# Fast unit test: ensure beat5 fails when lineage file is unreadable
set -euo pipefail
OUTDIR=${OUTDIR:-./tmp}
mkdir -p "$OUTDIR" "$OUTDIR/lineage"
TS=$(date -u +"%Y%m%dT%H%M%SZ")
LINEAGE="$OUTDIR/lineage/device_unit_$TS.full.ndjson"
ATTEST="$OUTDIR/tpm_attest_$TS.ndjson"

# create minimal files
cat > "$LINEAGE" <<EOF
{"action":"identity_registered_full","device_id":"unit-device-$TS","ak_pub_b64":"AAA"}
EOF
cat > "$ATTEST" <<EOF
{"action":"ak_public","pem_b64":"AAA"}
EOF

# make lineage unreadable
chmod 000 "$LINEAGE"

# debug diagnostics: show file mode and owner, and the user running the test
ls -la "$LINEAGE" || true
stat -c '%a %U %G' "$LINEAGE" || true
echo "DBG: running as uid=$(id -u) user=$(whoami)" || true

# run verifier and capture output
set +e
OUTPUT=$(./scripts/tpm/beat5_verify_attestation.sh --lineage "$LINEAGE" --attest "$ATTEST" 2>&1 || true)
RC=$?
set -e

if [ $RC -eq 0 ]; then
  echo "beat5 unexpectedly succeeded on unreadable lineage file" >&2
  exit 2
fi

if printf '%s' "$OUTPUT" | grep -q '"step":"lineage_unreadable"'; then
  echo "beat5 correctly failed with lineage_unreadable"
  exit 0
else
  echo "beat5 did not report lineage_unreadable; output:\n$OUTPUT" >&2
  exit 3
fi
