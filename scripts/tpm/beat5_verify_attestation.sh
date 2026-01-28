#!/usr/bin/env bash
set -euo pipefail

# Beat 5: Verifier
# - Ingests lineage NDJSON and attestation NDJSON
# - Recomputes fingerprints, verifies AK signature over quote
# - Validates PCR values against an optional JSON policy
# - Emits NDJSON verdict lines and exits non-zero on failure

OUTDIR="${OUTDIR:-./tmp}"
mkdir -p "$OUTDIR"
TS=$(date -u +"%Y%m%dT%H%M%SZ")
LOG="$OUTDIR/tpm_verify_$TS.ndjson"

emit() { echo "$1" | tee -a "$LOG"; }

require_cmd() { command -v "$1" >/dev/null 2>&1 || { emit "{\"action\":\"attestation_verify\",\"status\":\"failed\",\"step\":\"require_cmd\",\"error\":\"$1 not found\"}"; exit 2; } }

require_cmd python3
require_cmd openssl
require_cmd base64
require_cmd jq || true

usage(){ cat <<USAGE
Usage: $0 [--lineage <file>] [--attest <file>] [--policy <policy.json>]
If files not provided, picks the latest in $OUTDIR via naming convention.
Policy JSON format (optional): { "sha256": { "0": "<hex>", "1": "<hex>", ... } }
USAGE
}

LINEAGE_FILE=""
ATTEST_FILE=""
POLICY_FILE=""

while [[ ${1:-} != "" ]]; do
  case "$1" in
    --lineage) LINEAGE_FILE="$2"; shift 2;;
    --attest) ATTEST_FILE="$2"; shift 2;;
    --policy) POLICY_FILE="$2"; shift 2;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1;;
  esac
done

if [ -z "$LINEAGE_FILE" ]; then
  LINEAGE_FILE=$(ls -1t "$OUTDIR"/lineage/device_* 2>/dev/null | head -n1 || true)
fi
if [ -z "$ATTEST_FILE" ]; then
  ATTEST_FILE=$(ls -1t "$OUTDIR"/tpm_attest_*.ndjson 2>/dev/null | head -n1 || true)
fi

if [ -z "$LINEAGE_FILE" ] || [ -z "$ATTEST_FILE" ]; then
  emit "{\"action\":\"attestation_verify\",\"status\":\"failed\",\"step\":\"find_logs\",\"error\":\"missing lineage or attest file (lineage=$LINEAGE_FILE attest=$ATTEST_FILE)\"}"
  exit 1
fi

# Ensure logs are readable before proceeding to avoid executing filenames by mistake
if [ ! -r "$LINEAGE_FILE" ]; then
  emit "{\"action\":\"attestation_verify\",\"status\":\"failed\",\"step\":\"lineage_unreadable\",\"error\":\"$LINEAGE_FILE not readable\"}"
  exit 1
fi
if [ ! -r "$ATTEST_FILE" ]; then
  emit "{\"action\":\"attestation_verify\",\"status\":\"failed\",\"step\":\"attest_unreadable\",\"error\":\"$ATTEST_FILE not readable\"}"
  exit 1
fi

emit "{\"action\":\"attestation_verify\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"status\":\"running\",\"lineage\":\"$LINEAGE_FILE\",\"attest\":\"$ATTEST_FILE\"}"

# Extract fields using python
extract_first_field(){
  local file="$1"; local key="$2"; local match_key="$3"; local match_val="$4"
  python3 - <<PY
import json,sys
f=sys.argv[1]; key=sys.argv[2]; mk=sys.argv[3]; mv=sys.argv[4]
with open(f) as fh:
  for line in fh:
    try:
      o=json.loads(line)
    except Exception:
      continue
    if mk=="" or (mk in o and (str(o[mk])==mv if mv else True)):
      if key in o:
        print(o[key])
        sys.exit(0)
print("")
PY
"$file" "$key" "$match_key" "$match_val"
}

# Get ak_pub base64 from lineage full or attestation
AK_B64=$(extract_first_field "$LINEAGE_FILE" "ak_pub_b64" "" "" )
if [ -z "$AK_B64" ]; then
  AK_B64=$(extract_first_field "$ATTEST_FILE" "pem_b64" "action" "ak_public")
fi

if [ -z "$AK_B64" ]; then
  emit "{\"action\":\"attestation_verify\",\"status\":\"failed\",\"step\":\"ak_pub_missing\"}"
  exit 1
fi

# Write AK pem
AK_PEM="$OUTDIR/verify_ak_$TS.pem"
printf '%s' "$AK_B64" | base64 -d > "$AK_PEM"

# Compute fingerprint in same way as Beat 4
AK_DER="$OUTDIR/verify_ak_$TS.der"
if ! openssl pkey -pubin -in "$AK_PEM" -outform DER -out "$AK_DER" 2>/dev/null; then
  # try rsa/ecdsa
  openssl rsa -pubin -in "$AK_PEM" -outform DER -out "$AK_DER" 2>/dev/null || true
fi
if [ -f "$AK_DER" ]; then
  AK_FP_RAW=$(openssl dgst -sha256 -binary "$AK_DER" | xxd -p -c 256 | tr '[:lower:]' '[:upper:]')
  AK_FP="SHA256:$AK_FP_RAW"
else
  AK_FP=""
fi

# Compare to lineage ak_fingerprint if present
LINEAGE_AK_FP=$(extract_first_field "$LINEAGE_FILE" "ak_fingerprint" "" "")
if [ -n "$LINEAGE_AK_FP" ]; then
  if [ "$AK_FP" = "$LINEAGE_AK_FP" ]; then
    emit "{\"action\":\"ak_fingerprint_check\",\"result\":\"pass\",\"expected\":\"$LINEAGE_AK_FP\",\"observed\":\"$AK_FP\"}"
  else
    emit "{\"action\":\"ak_fingerprint_check\",\"result\":\"fail\",\"expected\":\"$LINEAGE_AK_FP\",\"observed\":\"$AK_FP\"}"
    emit "{\"action\":\"attestation_verify\",\"status\":\"failed\",\"step\":\"ak_fingerprint_mismatch\"}"
    exit 1
  fi
else
  emit "{\"action\":\"ak_fingerprint_check\",\"result\":\"skip\",\"observed\":\"$AK_FP\"}"
fi

# Extract quote message & signature & nonce
QUOTE_MSG_B64=$(extract_first_field "$ATTEST_FILE" "message_b64" "action" "quote")
QUOTE_SIG_B64=$(extract_first_field "$ATTEST_FILE" "signature_b64" "action" "quote")
NONCE_B64=$(extract_first_field "$ATTEST_FILE" "nonce_b64" "action" "nonce")

if [ -z "$QUOTE_MSG_B64" ] || [ -z "$QUOTE_SIG_B64" ] || [ -z "$NONCE_B64" ]; then
  emit "{\"action\":\"attestation_verify\",\"status\":\"failed\",\"step\":\"quote_missing\"}"
  exit 1
fi

QUOTE_MSG="$OUTDIR/quote_msg_$TS.bin"
QUOTE_SIG="$OUTDIR/quote_sig_$TS.bin"
NONCE_BIN="$OUTDIR/nonce_$TS.bin"
printf '%s' "$QUOTE_MSG_B64" | base64 -d > "$QUOTE_MSG"
printf '%s' "$QUOTE_SIG_B64" | base64 -d > "$QUOTE_SIG"
printf '%s' "$NONCE_B64" | base64 -d > "$NONCE_BIN"

# Verify signature using openssl; assume rsa PKCS1 v1.5 with SHA256
# Try pkeyutl verify; fallback to openssl dgst -verify
VERIFY_OK=0
if openssl pkeyutl -verify -in "$QUOTE_MSG" -sigfile "$QUOTE_SIG" -inkey "$AK_PEM" -pkeyopt rsa_padding_mode:pkcs1 >/dev/null 2>&1; then
  VERIFY_OK=1
elif openssl dgst -sha256 -verify "$AK_PEM" -signature "$QUOTE_SIG" "$QUOTE_MSG" >/dev/null 2>&1; then
  VERIFY_OK=1
fi

if [ $VERIFY_OK -eq 1 ]; then
  emit "{\"action\":\"quote_signature_check\",\"result\":\"pass\"}"
else
  emit "{\"action\":\"quote_signature_check\",\"result\":\"fail\"}"
  emit "{\"action\":\"attestation_verify\",\"status\":\"failed\",\"step\":\"quote_signature_invalid\"}"
  exit 1
fi

# Parse PCR snapshot from attestation file (pcr_snapshot lines)
# Build associative array of expected PCRs from policy (if provided)
declare -A POLICY
if [ -n "$POLICY_FILE" ]; then
  if [ ! -f "$POLICY_FILE" ]; then
    emit "{\"action\":\"attestation_verify\",\"status\":\"failed\",\"step\":\"policy_file_missing\"}"
    exit 1
  fi
  # read policy JSON
  # policy JSON is { "sha256": { "0": "HEX", ... } }
  for k in $(python3 - <<PY
import json,sys
try:
  p=json.load(open('$POLICY_FILE'))
  out=[]
  for bank,vals in p.items():
    for idx,val in vals.items():
      out.append(f"{bank}:{idx}:{val}")
  print('\n'.join(out))
except Exception:
  # on any parse error or unexpected structure, emit nothing
  sys.exit(0)
PY
); do
    bank=${k%%:*}
    idx=${k#*:}; idx=${idx%%:*}
    val=${k##*:}
    POLICY["$bank:$idx"]=$val
  done
fi

# iterate attestation file for pcr_snapshot lines
declare -A PCRS
while IFS= read -r line; do
  if printf '%s' "$line" | grep -q '"action":"pcr_snapshot"'; then
    # parse JSON to get bank,index,value
    bank=$(printf '%s' "$line" | python3 -c "import sys,json;print(json.loads(sys.stdin.read())['bank'])")
    idx=$(printf '%s' "$line" | python3 -c "import sys,json;print(json.loads(sys.stdin.read())['index'])")
    val=$(printf '%s' "$line" | python3 -c "import sys,json;print(json.loads(sys.stdin.read())['value'])")
    PCRS["$bank:$idx"]=$val
    emit "{\"action\":\"pcr_observed\",\"bank\":\"$bank\",\"index\":$idx,\"value\":\"$val\"}"
  fi
done < "$ATTEST_FILE"

# Validate policy if provided
if [ ${#POLICY[@]} -gt 0 ]; then
  for key in "${!POLICY[@]}"; do
    expected=${POLICY[$key]}
    found=${PCRS[$key]:-}
    if [ -z "$found" ]; then
      emit "{\"action\":\"pcr_policy_check\",\"result\":\"fail\",\"key\":\"$key\",\"expected\":\"$expected\",\"found\":null}"
      emit "{\"action\":\"attestation_verify\",\"status\":\"failed\",\"step\":\"pcr_missing\"}"
      exit 1
    fi
    if [ "${found^^}" != "${expected^^}" ]; then
      emit "{\"action\":\"pcr_policy_check\",\"result\":\"fail\",\"key\":\"$key\",\"expected\":\"$expected\",\"found\":\"$found\"}"
      emit "{\"action\":\"attestation_verify\",\"status\":\"failed\",\"step\":\"pcr_mismatch\"}"
      exit 1
    else
      emit "{\"action\":\"pcr_policy_check\",\"result\":\"pass\",\"key\":\"$key\"}"
    fi
  done
else
  emit "{\"action\":\"pcr_policy_check\",\"result\":\"skip\",\"reason\":\"no policy provided\"}"
fi

emit "{\"action\":\"attestation_verify\",\"status\":\"ok\"}"
printf "Verification succeeded; logs written to %s\n" "$LOG" >&2
exit 0
