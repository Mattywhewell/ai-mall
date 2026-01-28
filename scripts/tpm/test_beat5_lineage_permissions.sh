#!/usr/bin/env bash
# Fast unit test: ensure beat5 fails when lineage file is unreadable
set -euo pipefail
OUTDIR=${OUTDIR:-./tmp}
mkdir -p "$OUTDIR" "$OUTDIR/lineage"
TS=$(date -u +"%Y%m%dT%H%M%SZ")
LINEAGE="$OUTDIR/lineage/device_unit_$TS.full.ndjson"
ATTEST="$OUTDIR/tpm_attest_$TS.ndjson"

# ensure we clean up the unreadable artifact on exit so other tests are not affected
trap 'chmod 644 "$LINEAGE" 2>/dev/null || true; rm -f "$LINEAGE" 2>/dev/null || true; rm -f "$ATTEST" 2>/dev/null || true' EXIT

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
OUTPUT=$(./scripts/tpm/beat5_verify_attestation.sh --lineage "$LINEAGE" --attest "$ATTEST" 2>&1)
RC=$?
set -e

if [ $RC -eq 0 ]; then
  echo "beat5 unexpectedly succeeded on unreadable lineage file" >&2
  echo "DEBUG: listing $OUTDIR and lineage directory:" >&2
  ls -la "$OUTDIR" || true
  ls -la "$OUTDIR"/lineage || true
  echo "DEBUG: tpm_verify logs if any:" >&2
  ls -la "$OUTDIR"/tpm_verify_* 2>/dev/null || true
  for f in "$OUTDIR"/tpm_verify_*; do
    if [ -f "$f" ]; then
      echo "=== $f ===" >&2
      sed -n '1,200p' "$f" >&2 || true
    fi
  done
  echo "DEBUG: re-running under bash -x to capture trace" >&2
  set +e
  bash -x ./scripts/tpm/beat5_verify_attestation.sh --lineage "$LINEAGE" --attest "$ATTEST" 2>&1 || true
  set -e
  exit 2
fi

if printf '%s' "$OUTPUT" | grep -q '"step":"lineage_unreadable"'; then
  echo "beat5 correctly failed with lineage_unreadable"
  exit 0
else
  echo "beat5 did not report lineage_unreadable; output:\n$OUTPUT" >&2
  exit 3
fi
