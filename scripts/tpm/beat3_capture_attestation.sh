#!/usr/bin/env bash
set -euo pipefail

# Beat 3: Attestation Bundle Capture
# - Re-uses persistent handles from Beat 2 (or defaults)
# - Emits NDJSON lines for ek_public, ak_public, pcr_snapshot, nonce, quote, metadata, and final bundle event

OUTDIR="${OUTDIR:-./tmp}"
mkdir -p "$OUTDIR"
TS=$(date -u +"%Y%m%dT%H%M%SZ")
LOG="$OUTDIR/tpm_attest_$TS.ndjson"

json_escape() {
  python3 - <<'PY'
import json,sys
print(json.dumps(sys.stdin.read()))
PY
}

emit() {
  echo "$1" | tee -a "$LOG"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    emit "{\"action\":\"attestation_bundle\",\"status\":\"failed\",\"step\":\"require_cmd\",\"error\":\"$1 not found\"}"
    exit 2
  fi
}

# Find latest beat2 identity file if present
find_latest_identity_handles() {
  local latest
  latest=$(ls -1t ./tmp/tpm_beat2_*.ndjson 2>/dev/null | head -n1 || true)
  if [ -n "$latest" ]; then
    # try to extract handles from identity_create final line
    local line
    line=$(grep '"step":"identity_create"' "$latest" || true)
    if [ -n "$line" ]; then
      EK_HANDLE=$(printf '%s' "$line" | sed -n 's/.*"ek_handle":"\([^\"]*\)".*/\1/p')
      AK_HANDLE=$(printf '%s' "$line" | sed -n 's/.*"ak_handle":"\([^\"]*\)".*/\1/p')
      SIGN_HANDLE=$(printf '%s' "$line" | sed -n 's/.*"sign_handle":"\([^\"]*\)".*/\1/p')
      echo "$EK_HANDLE $AK_HANDLE $SIGN_HANDLE"
      return 0
    fi
  fi
  return 1
}

# defaults
DEFAULT_EK=0x81010000
DEFAULT_AK=0x81010001
DEFAULT_SIGN=0x81010002

require_cmd tpm2_readpublic
require_cmd tpm2_pcrread
require_cmd tpm2_getrandom
require_cmd tpm2_getcap
require_cmd tpm2_quote

emit "{\"action\":\"attestation_start\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"status\":\"running\"}"

if handles=$(find_latest_identity_handles); then
  read EK_HANDLE AK_HANDLE SIGN_HANDLE <<< "$handles"
  EK_HANDLE=${EK_HANDLE:-$DEFAULT_EK}
  AK_HANDLE=${AK_HANDLE:-$DEFAULT_AK}
  SIGN_HANDLE=${SIGN_HANDLE:-$DEFAULT_SIGN}
else
  EK_HANDLE=$DEFAULT_EK
  AK_HANDLE=$DEFAULT_AK
  SIGN_HANDLE=$DEFAULT_SIGN
fi

# Re-emit public EK
EK_PEM="$OUTDIR/ek_pub.pem"
if tpm2_readpublic -c "$EK_HANDLE" -f pem -o "$EK_PEM" >/dev/null 2>&1; then
  PEM_B64=$(base64 -w0 "$EK_PEM")
  emit "{\"action\":\"ek_public\",\"handle\":\"$EK_HANDLE\",\"pem_b64\":\"$PEM_B64\"}"
else
  emit "{\"action\":\"attestation_bundle\",\"status\":\"failed\",\"step\":\"ek_public\",\"error\":\"tpm2_readpublic failed for $EK_HANDLE\"}"
  exit 1
fi

# Re-emit public AK
AK_PEM="$OUTDIR/ak_pub.pem"
if tpm2_readpublic -c "$AK_HANDLE" -f pem -o "$AK_PEM" >/dev/null 2>&1; then
  PEM_B64=$(base64 -w0 "$AK_PEM")
  emit "{\"action\":\"ak_public\",\"handle\":\"$AK_HANDLE\",\"pem_b64\":\"$PEM_B64\"}"
else
  emit "{\"action\":\"attestation_bundle\",\"status\":\"failed\",\"step\":\"ak_public\",\"error\":\"tpm2_readpublic failed for $AK_HANDLE\"}"
  exit 1
fi

# PCR snapshot
PCR_FILE="$OUTDIR/pcrs.$TS.txt"
if tpm2_pcrread sha256:0,1,2,3,4,7 > "$PCR_FILE" 2>/dev/null; then
  # parse lines like 'sha256: 0: 1234...'
  while IFS= read -r line; do
    # Extract bank, index, hex
    # Examples can vary; we'll try to parse 'sha256: 0: <hex>' or 'sha256.': more robust parsing
    if [[ "$line" =~ ([a-z0-9A-Z_-]+):[[:space:]]*([0-9]+):[[:space:]]*([0-9a-fA-F]+) ]]; then
      bank=${BASH_REMATCH[1]}
      index=${BASH_REMATCH[2]}
      value=${BASH_REMATCH[3]}
      emit "{\"action\":\"pcr_snapshot\",\"bank\":\"$bank\",\"index\":$index,\"value\":\"$value\"}"
    fi
  done < "$PCR_FILE"
else
  emit "{\"action\":\"attestation_bundle\",\"status\":\"failed\",\"step\":\"pcrread\",\"error\":\"tpm2_pcrread failed\"}"
  exit 1
fi

# Nonce
NONCE_BIN="$OUTDIR/nonce.$TS.bin"
if tpm2_getrandom 16 > "$NONCE_BIN" 2>/dev/null; then
  NONCE_B64=$(base64 -w0 "$NONCE_BIN")
  emit "{\"action\":\"nonce\",\"bytes\":16,\"value_b64\":\"$NONCE_B64\"}"
else
  emit "{\"action\":\"attestation_bundle\",\"status\":\"failed\",\"step\":\"getrandom\",\"error\":\"tpm2_getrandom failed\"}"
  exit 1
fi

# Produce AK-signed quote
QUOTE_MSG="$OUTDIR/quote.$TS.msg"
QUOTE_SIG="$OUTDIR/quote.$TS.sig"
# Attempt a quote; tpm2_quote expects a key context - persistent handle should work with -c
if tpm2_quote -c "$AK_HANDLE" -l sha256:0,1,2,3,4,7 -q "$NONCE_BIN" -m "$QUOTE_MSG" -s "$QUOTE_SIG" >/dev/null 2>&1; then
  MSG_B64=$(base64 -w0 "$QUOTE_MSG")
  SIG_B64=$(base64 -w0 "$QUOTE_SIG")
  emit "{\"action\":\"quote\",\"pcr_bank\":\"sha256\",\"pcrs\":[0,1,2,3,4,7],\"nonce_b64\":\"$NONCE_B64\",\"message_b64\":\"$MSG_B64\",\"signature_b64\":\"$SIG_B64\"}"
else
  emit "{\"action\":\"attestation_bundle\",\"status\":\"failed\",\"step\":\"quote\",\"error\":\"tpm2_quote failed using $AK_HANDLE\"}"
  exit 1
fi

# Metadata: properties-fixed
PROPF_FIXED_FILE="$OUTDIR/properties_fixed.$TS.txt"
if tpm2_getcap properties-fixed > "$PROPF_FIXED_FILE" 2>/dev/null; then
  ESC=$(python3 -c "import json,sys;print(json.dumps(sys.stdin.read()))" < "$PROPF_FIXED_FILE")
  emit "{\"action\":\"properties_fixed\",\"value\":$ESC}"
else
  emit "{\"action\":\"attestation_bundle\",\"status\":\"failed\",\"step\":\"properties_fixed\",\"error\":\"tpm2_getcap properties-fixed failed\"}"
  exit 1
fi

# Metadata: handles-persistent
HANDLES_FILE="$OUTDIR/handles_persistent.$TS.txt"
if tpm2_getcap handles-persistent > "$HANDLES_FILE" 2>/dev/null; then
  # Try to extract handles as an array of hex strings
  HANDLES_JSON=$(python3 - <<PY
import json
s=open('$HANDLES_FILE').read()
# naive extract of 0x... occurrences
import re
hs=re.findall(r'0x[0-9a-fA-F]+', s)
print(json.dumps(hs))
PY
)
  emit "{\"action\":\"handles_persistent\",\"handles\":$HANDLES_JSON}"
else
  emit "{\"action\":\"attestation_bundle\",\"status\":\"failed\",\"step\":\"handles_persistent\",\"error\":\"tpm2_getcap handles-persistent failed\"}"
  exit 1
fi

# Finish
emit "{\"action\":\"attestation_bundle\",\"status\":\"ok\",\"path\":\"$LOG\"}"

printf "Attestation bundle written to: %s\n" "$LOG" >&2
exit 0
