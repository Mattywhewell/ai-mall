#!/usr/bin/env bash
set -euo pipefail

# Issue a short-lived SSH certificate whose subject key is the TPM-resident signing key's public key.
# Uses a local ephemeral CA (in tmp/) for signing in CI.
# Emits an NDJSON issuance line to tmp/ with cert path and device id.

OUTDIR="${OUTDIR:-./tmp}"
mkdir -p "$OUTDIR"
TS=$(date -u +"%Y%m%dT%H%M%SZ")
LOG="$OUTDIR/ssh_issuance_$TS.ndjson"

emit(){ echo "$1" | tee -a "$LOG"; }

# Find signing key public pem from Beat2 or lineage full
BEAT2_FILE=$(ls -1t "$OUTDIR"/tpm_beat2_*.ndjson 2>/dev/null | head -n1 || true)
LINEAGE_FULL=$(ls -1t "$OUTDIR"/lineage/device_*.full.ndjson 2>/dev/null | head -n1 || true)

SIGN_PEM_B64=""
DEVICE_ID=""

if [ -n "$BEAT2_FILE" ]; then
  SIGN_PEM_B64=$(python3 - <<PY
import json,sys
f='$BEAT2_FILE'
with open(f) as fh:
  for line in fh:
    try:
      o=json.loads(line)
    except Exception:
      continue
    if o.get('key_type')=='SIGNING':
      print(o.get('pub_pem',''))
      sys.exit(0)
print('')
PY
)
fi

if [ -z "$SIGN_PEM_B64" ] && [ -n "$LINEAGE_FULL" ]; then
  SIGN_PEM_B64=$(python3 - <<PY
import json,sys
f='$LINEAGE_FULL'
with open(f) as fh:
  for line in fh:
    try:
      o=json.loads(line)
    except Exception:
      continue
    if o.get('action')=='identity_registered_full':
      print(o.get('sign_pub_b64',''))
      sys.exit(0)
print('')
PY
)
fi

if [ -z "$SIGN_PEM_B64" ]; then
  emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"ssh_issuance\",\"status\":\"failed\",\"step\":\"sign_pub_missing\"}"
  exit 1
fi

SIGN_PEM="$OUTDIR/sign_pub_for_ssh_$TS.pem"
printf '%s' "$SIGN_PEM_B64" > "$SIGN_PEM"

# Convert PEM to OpenSSH pubkey
SSH_PUB_FILE="$OUTDIR/sign_ssh_pub_$TS.pub"
if ssh-keygen -i -m PKCS8 -f "$SIGN_PEM" > "$SSH_PUB_FILE" 2>/dev/null; then
  :
else
  # Try fallback exact format: openssh may accept the PEM directly when -i fails for rsa
  ssh-keygen -y -f "$SIGN_PEM" > "$SSH_PUB_FILE" 2>/dev/null || true
fi

if [ ! -s "$SSH_PUB_FILE" ]; then
  # Try converting via openssl to RSA PUB and then to ssh format
  if openssl pkey -pubin -in "$SIGN_PEM" -outform PEM -out "$OUTDIR/tmp_pub.pem" 2>/dev/null; then
    ssh-keygen -f "$OUTDIR/tmp_pub.pem" -i -m PKCS8 > "$SSH_PUB_FILE" 2>/dev/null || true
  fi
fi

if [ ! -s "$SSH_PUB_FILE" ]; then
  emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"ssh_issuance\",\"status\":\"failed\",\"step\":\"pub_conversion_failed\"}"
  exit 1
fi

# Ensure ephemeral CA exists
CA_KEY="$OUTDIR/ci_ssh_ca"
if [ ! -f "$CA_KEY" ]; then
  ssh-keygen -t rsa -b 4096 -f "$CA_KEY" -N "" -C "ci-ssh-ca" >/dev/null 2>&1
fi

# Device id from lineage if available
DEVICE_ID=$(python3 - <<PY
import json,sys
f='$LINEAGE_FULL'
if f:
  with open(f) as fh:
    for line in fh:
      try:
        o=json.loads(line)
      except Exception:
        continue
      if o.get('action')=='identity_registered':
        print(o.get('device_id',''))
        sys.exit(0)
print('')
PY
)

if [ -z "$DEVICE_ID" ]; then DEVICE_ID="dev-$TS"; fi

# Sign certificate: subject is SSH_PUB_FILE
CERT_FILE="$OUTDIR/sign_ssh_cert_$TS-cert.pub"
# TTL: default 15 minutes
TTL="+15m"
ssh-keygen -s "$CA_KEY" -I "$DEVICE_ID" -V "$TTL" -n "tpm-device" -z 1 -f "$SSH_PUB_FILE" || true

if [ ! -f "$CERT_FILE" ]; then
  # ssh-keygen will create <SSH_PUB_FILE>-cert.pub; try to find it
  if [ -f "$SSH_PUB_FILE-cert.pub" ]; then
    mv "$SSH_PUB_FILE-cert.pub" "$CERT_FILE"
  fi
fi

if [ ! -f "$CERT_FILE" ]; then
  emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"ssh_issuance\",\"status\":\"failed\",\"step\":\"cert_create\"}"
  exit 1
fi

# Emit issuance NDJSON
emit "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"ssh_issuance\",\"device_id\":\"$DEVICE_ID\",\"cert\":\"$CERT_FILE\",\"ssh_pub\":\"$SSH_PUB_FILE\",\"ttl\":\"$TTL\"}"

printf "Issued SSH cert: %s (device=%s)\n" "$CERT_FILE" "$DEVICE_ID" >&2
exit 0
