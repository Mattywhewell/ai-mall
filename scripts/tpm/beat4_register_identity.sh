#!/usr/bin/env bash
set -euo pipefail

# Beat 4: Register identity into NDJSON lineage
# - Reads latest Beat 2 and Beat 3 NDJSON logs
# - Extracts EK/AK public PEMs and handles
# - Computes SHA256 fingerprints (DER canonicalized)
# - Assigns a stable device id (AK fingerprint)
# - Writes a canonical lineage entry to ./tmp/lineage/identity_<deviceid>_<timestamp>.ndjson

OUTDIR="${OUTDIR:-./tmp}"
LINEAGE_DIR="$OUTDIR/lineage"
mkdir -p "$OUTDIR" "$LINEAGE_DIR"
TS=$(date -u +"%Y%m%dT%H%M%SZ")
LOG="$LINEAGE_DIR/identity_$TS.ndjson"

emit() {
  echo "$1" | tee -a "$LOG"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command '$1' not found" >&2
    exit 2
  fi
}

require_cmd python3
require_cmd openssl
require_cmd base64
require_cmd jq || true # optional

# Find latest beat2 (identity create) and beat3 (attest) files
BEAT2_FILE=$(ls -1t "$OUTDIR"/tpm_beat2_*.ndjson 2>/dev/null | head -n1 || true)
BEAT3_FILE=$(ls -1t "$OUTDIR"/tpm_attest_*.ndjson 2>/dev/null | head -n1 || true)

if [ -z "$BEAT2_FILE" ] && [ -z "$BEAT3_FILE" ]; then
  emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"identity_register\",\"status\":\"failed\",\"step\":\"find_logs\",\"error\":\"no beat2 or beat3 logs found in $OUTDIR\"}"
  exit 1
fi

# Helper to extract the first matching JSON line's field value using python
extract_field_from_ndjson() {
  local file="$1"; local key="$2"; local match_key="$3"; local match_val="$4"
  python3 - <<PY
import json,sys
f=sys.argv[1]
key=sys.argv[2]
mk=sys.argv[3]
mv=sys.argv[4]
with open(f) as fh:
  for line in fh:
    try:
      o=json.loads(line)
    except Exception:
      continue
    if mk=="" or (mk in o and str(o[mk])==mv):
      if key in o:
        print(o[key])
        sys.exit(0)
print("")
PY
"$file" "$key" "$match_key" "$match_val"
}

# Prefer ek_public/ak_public entries from beat3 (attest) but fall back to beat2 entries
EK_B64=""
AK_B64=""
EK_HANDLE=""
AK_HANDLE=""
SIGN_HANDLE=""

if [ -n "$BEAT3_FILE" ]; then
  EK_B64=$(extract_field_from_ndjson "$BEAT3_FILE" "pem_b64" "action" "ek_public" )
  AK_B64=$(extract_field_from_ndjson "$BEAT3_FILE" "pem_b64" "action" "ak_public" )
fi

if [ -z "$EK_B64" ] && [ -n "$BEAT2_FILE" ]; then
  EK_B64=$(extract_field_from_ndjson "$BEAT2_FILE" "pub_pem" "key_type" "EK" )
fi
if [ -z "$AK_B64" ] && [ -n "$BEAT2_FILE" ]; then
  AK_B64=$(extract_field_from_ndjson "$BEAT2_FILE" "pub_pem" "key_type" "AK" )
fi

EK_HANDLE=$(extract_field_from_ndjson "$BEAT2_FILE" "ek_handle" "step" "identity_create" || true)
AK_HANDLE=$(extract_field_from_ndjson "$BEAT2_FILE" "ak_handle" "step" "identity_create" || true)
SIGN_HANDLE=$(extract_field_from_ndjson "$BEAT2_FILE" "sign_handle" "step" "identity_create" || true)

# Helper to write b64 pem to file and compute SHA256 fingerprint of DER-formatted public key
compute_fingerprint() {
  local b64="$1"; local outpem="$2"; local outder="$3"
  if [ -z "$b64" ]; then
    echo ""; return 0
  fi
  printf '%s' "$b64" | base64 -d > "$outpem"
  # Convert to DER; try openssl pkey, if fails try rsa or ec
  if openssl pkey -pubin -in "$outpem" -outform DER -out "$outder" 2>/dev/null; then
    :
  elif openssl rsa -pubin -in "$outpem" -outform DER -out "$outder" 2>/dev/null; then
    :
  elif openssl ec -pubin -in "$outpem" -outform DER -out "$outder" 2>/dev/null; then
    :
  else
    # fallback: base64-derive from PEM body (best-effort)
    awk '/^-----BEGIN /{flag=1;next}/^-----END /{flag=0}flag' "$outpem" | tr -d '\n' | base64 -d > "$outder" 2>/dev/null || true
  fi
  if [ -f "$outder" ]; then
    # compute sha256 hex uppercase
    local hex
    hex=$(openssl dgst -sha256 -binary "$outder" | xxd -p -c 256 | tr '[:lower:]' '[:upper:]')
    echo "SHA256:$hex"
  else
    echo ""
  fi
}

EK_PEM_FILE="$OUTDIR/ek_extracted_$TS.pem"
EK_DER_FILE="$OUTDIR/ek_extracted_$TS.der"
AK_PEM_FILE="$OUTDIR/ak_extracted_$TS.pem"
AK_DER_FILE="$OUTDIR/ak_extracted_$TS.der"

EK_FP=$(compute_fingerprint "$EK_B64" "$EK_PEM_FILE" "$EK_DER_FILE")
AK_FP=$(compute_fingerprint "$AK_B64" "$AK_PEM_FILE" "$AK_DER_FILE")

if [ -z "$AK_FP" ] && [ -n "$EK_FP" ]; then
  DEVICE_ID=$(echo "$EK_FP" | sed 's/^SHA256://;s/://g' | cut -c1-16)
else
  DEVICE_ID=$(echo "$AK_FP" | sed 's/^SHA256://;s/://g' | cut -c1-16)
fi

# Create canonical lineage entry
LINEAGE_FILE="$LINEAGE_DIR/device_${DEVICE_ID}_$TS.ndjson"

emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"identity_registered\",\"device_id\":\"$DEVICE_ID\",\"ek_handle\":\"$EK_HANDLE\",\"ak_handle\":\"$AK_HANDLE\",\"sign_handle\":\"$SIGN_HANDLE\",\"ek_fingerprint\":\"$EK_FP\",\"ak_fingerprint\":\"$AK_FP\",\"beat2_log\":\"$BEAT2_FILE\",\"beat3_log\":\"$BEAT3_FILE\"}"

# Also write a full artifact with embedded PEMs/base64 for archival
ARTFILE="$LINEAGE_DIR/device_${DEVICE_ID}_$TS.full.ndjson"
emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"identity_registered_full\",\"device_id\":\"$DEVICE_ID\",\"ek_handle\":\"$EK_HANDLE\",\"ak_handle\":\"$AK_HANDLE\",\"sign_handle\":\"$SIGN_HANDLE\",\"ek_pub_b64\":$(printf '%s' "$EK_B64" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))'),\"ak_pub_b64\":$(printf '%s' "$AK_B64" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))'),\"ek_fingerprint\":\"$EK_FP\",\"ak_fingerprint\":\"$AK_FP\",\"beat2_log\":\"$BEAT2_FILE\",\"beat3_log\":\"$BEAT3_FILE\"}"

# Final completion event
emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"identity_registered\",\"device_id\":\"$DEVICE_ID\",\"status\":\"ok\",\"path\":\"$LINEAGE_FILE\"}"

printf "Identity lineage registered: device_id=%s path=%s\n" "$DEVICE_ID" "$LINEAGE_FILE" >&2
exit 0
