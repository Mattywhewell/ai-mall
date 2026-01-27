#!/usr/bin/env bash
set -euo pipefail

# Beat 2: EK/AK/Signing Key Creation (identity birth ritual)
# - Creates an EK-like primary (persistent)
# - Creates an Attestation Key (AK) and makes it persistent
# - Creates a TPM-resident signing key (for SSH cert issuance) and makes it persistent
# - Captures public portions and emits NDJSON lineage entries to ./tmp/

OUTDIR="${OUTDIR:-./tmp}"
mkdir -p "$OUTDIR"
LOG="$OUTDIR/tpm_beat2_$(date -u +"%Y%m%dT%H%M%SZ").ndjson"

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
    echo "ERROR: required command '$1' not found" >&2
    exit 2
  fi
}

# helpers to pick a free persistent handle starting at base
find_free_persistent_handle() {
  local base=0x81010000
  local occupied
  occupied=$(tpm2_getcap handles-persistent 2>/dev/null || true)
  for ((i=0;i<256;i++)); do
    local cand=$((base + i))
    # format hex like 0x81010001
    local hex=$(printf "0x%08X" "$cand")
    if ! printf "%s" "$occupied" | grep -q "$hex"; then
      printf "%s" "$hex"
      return 0
    fi
  done
  return 1
}

# Emit a fail event and exit
fail() {
  local msg="$1"
  emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"step\":\"identity_create\",\"action\":\"failed\",\"msg\":$(printf '%s' "$msg" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))') }"
  exit 1
}

# Ensure tools
require_cmd tpm2_getcap
require_cmd tpm2_createprimary
require_cmd tpm2_readpublic
require_cmd tpm2_evictcontrol
require_cmd tpm2_create
require_cmd tpm2_load
require_cmd python3

emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"step\":\"identity_create\",\"action\":\"start\",\"msg\":\"Beat 2 identity creation starting\"}"

# Create EK-like primary
EK_CTX="$OUTDIR/ek.ctx"
EK_PUB_PEM="$OUTDIR/ek.pub.pem"
EK_HANDLE=$(find_free_persistent_handle) || fail "No free persistent handle available for EK"

if tpm2_createprimary -C e -c "$EK_CTX" -g sha256 -G rsa >/dev/null 2>&1; then
  tpm2_readpublic -c "$EK_CTX" -f pem -o "$EK_PUB_PEM"
  if tpm2_evictcontrol -C o -c "$EK_CTX" "$EK_HANDLE" >/dev/null 2>&1; then
    PUB=$(cat "$EK_PUB_PEM" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')
    emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"step\":\"identity_create\",\"key_type\":\"EK\",\"action\":\"created\",\"handle\":\"$EK_HANDLE\",\"pub_pem\":$PUB}"
    EK_CREATED_HANDLE="$EK_HANDLE"
  else
    fail "Failed to make EK persistent (evictcontrol)"
  fi
else
  fail "Failed to create EK-like primary"
fi

# Create AK (Attestation Key)
AK_PRIV="$OUTDIR/ak.priv"
AK_PUB="$OUTDIR/ak.pub"
AK_CTX="$OUTDIR/ak.ctx"
AK_PUB_PEM="$OUTDIR/ak.pub.pem"
AK_HANDLE=$(find_free_persistent_handle) || fail "No free persistent handle available for AK"

if tpm2_create -C "$EK_CTX" -G rsa -u "$AK_PUB" -r "$AK_PRIV" -s rsassa >/dev/null 2>&1; then
  if tpm2_load -C "$EK_CTX" -u "$AK_PUB" -r "$AK_PRIV" -c "$AK_CTX" >/dev/null 2>&1; then
    tpm2_readpublic -c "$AK_CTX" -f pem -o "$AK_PUB_PEM"
    if tpm2_evictcontrol -C o -c "$AK_CTX" "$AK_HANDLE" >/dev/null 2>&1; then
      PUB=$(cat "$AK_PUB_PEM" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')
      emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"step\":\"identity_create\",\"key_type\":\"AK\",\"action\":\"created\",\"handle\":\"$AK_HANDLE\",\"pub_pem\":$PUB}"
      AK_CREATED_HANDLE="$AK_HANDLE"
    else
      fail "Failed to persist AK (evictcontrol)"
    fi
  else
    fail "Failed to load AK after creation"
  fi
else
  fail "Failed to create AK under EK context"
fi

# Create Signing Key (for SSH cert issuance)
SIGN_PRIV="$OUTDIR/sign.priv"
SIGN_PUB="$OUTDIR/sign.pub"
SIGN_CTX="$OUTDIR/sign.ctx"
SIGN_PUB_PEM="$OUTDIR/sign.pub.pem"
SIGN_HANDLE=$(find_free_persistent_handle) || fail "No free persistent handle available for signing key"

# Create with signing attributes where possible
if tpm2_create -C "$EK_CTX" -G rsa -u "$SIGN_PUB" -r "$SIGN_PRIV" -s rsassa >/dev/null 2>&1; then
  if tpm2_load -C "$EK_CTX" -u "$SIGN_PUB" -r "$SIGN_PRIV" -c "$SIGN_CTX" >/dev/null 2>&1; then
    tpm2_readpublic -c "$SIGN_CTX" -f pem -o "$SIGN_PUB_PEM"
    if tpm2_evictcontrol -C o -c "$SIGN_CTX" "$SIGN_HANDLE" >/dev/null 2>&1; then
      PUB=$(cat "$SIGN_PUB_PEM" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')
      emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"step\":\"identity_create\",\"key_type\":\"SIGNING\",\"action\":\"created\",\"handle\":\"$SIGN_HANDLE\",\"pub_pem\":$PUB}"
      SIGN_CREATED_HANDLE="$SIGN_HANDLE"
    else
      fail "Failed to persist signing key"
    fi
  else
    fail "Failed to load signing key after creation"
  fi
else
  fail "Failed to create signing key under EK context"
fi

# Final lineage entry
emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"step\":\"identity_create\",\"action\":\"done\",\"msg\":\"Identity created\",\"ek_handle\":\"$EK_CREATED_HANDLE\",\"ak_handle\":\"$AK_CREATED_HANDLE\",\"sign_handle\":\"$SIGN_CREATED_HANDLE\"}"

printf "Identity creation complete. Logs written to: %s\n" "$LOG" >&2
exit 0
