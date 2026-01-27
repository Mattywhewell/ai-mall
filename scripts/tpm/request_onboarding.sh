#!/usr/bin/env bash
set -euo pipefail

# Request onboarding: package latest attest & lineage references into a request JSON
OUTDIR="${OUTDIR:-./tmp}"
mkdir -p "$OUTDIR"
TS=$(date -u +"%Y%m%dT%H%M%SZ")
REQ_FILE="$OUTDIR/onboarding_request_$TS.json"
LOG="$OUTDIR/onboarding_request_$TS.ndjson"

emit(){ echo "$1" | tee -a "$LOG"; }

# Find latest attest and lineage
ATTEST=$(ls -1t "$OUTDIR"/tpm_attest_*.ndjson 2>/dev/null | head -n1 || true)
LINEAGE=$(ls -1t "$OUTDIR"/lineage/device_*.full.ndjson 2>/dev/null | head -n1 || true)

if [ -z "$ATTEST" ] || [ -z "$LINEAGE" ]; then
  emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"onboarding_request\",\"status\":\"failed\",\"reason\":\"missing attest or lineage\"}"
  exit 1
fi

DEVICE_ID=$(python3 - <<PY
import json,sys
f='$LINEAGE'
with open(f) as fh:
  for line in fh:
    try:
      o=json.loads(line)
    except Exception:
      continue
    if o.get('action') in ('identity_registered','identity_registered_full'):
      print(o.get('device_id',''))
      sys.exit(0)
print('')
PY
)

if [ -z "$DEVICE_ID" ]; then DEVICE_ID="unknown-$TS"; fi

cat > "$REQ_FILE" <<EOF
{
  "ts": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "action": "onboarding_request",
  "device_id": "$DEVICE_ID",
  "attest_log": "$ATTEST",
  "lineage_log": "$LINEAGE"
}
EOF

emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"onboarding_request\",\"device_id\":\"$DEVICE_ID\",\"request_file\":\"$REQ_FILE\",\"status\":\"created\"}"

printf "%s\n" "$REQ_FILE"
exit 0
