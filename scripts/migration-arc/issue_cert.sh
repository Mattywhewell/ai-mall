#!/usr/bin/env bash
# Issue a short-lived SSH user certificate for a public key using a CA key
set -euo pipefail
source "$(dirname "$0")/lib/log.sh"

PUBKEY=${1:-}
PRINCIPALS=${2:-adele}
DURATION=${DURATION:-3600}   # seconds
CA_KEY=${CA_KEY:-/root/ssh_ca}
OUT_CERT=${3:-}
TEST_ROOT=${TEST_ROOT:-}

if [ -n "$TEST_ROOT" ]; then
  CA_KEY="$TEST_ROOT/root/ssh_ca"
fi

if [ -z "$PUBKEY" ]; then
  echo "Usage: $0 <pubkey-file> [principals] [out-cert-file]" >&2
  exit 2
fi

if [ ! -f "$PUBKEY" ]; then
  echo "Pubkey not found: $PUBKEY" >&2; exit 3
fi

if [ ! -f "$CA_KEY" ]; then
  echo "CA key not found: $CA_KEY" >&2; exit 4
fi

migration_log "step=issue_cert" "action=start" "pubkey=$PUBKEY" "principals=$PRINCIPALS" "duration_s=$DURATION"

SERIAL=$(date +%s)
START=$(date -u +%Y%m%d%H%M%S)
END=$(date -u -d "@$(( $(date +%s) + DURATION ))" +%Y%m%d%H%M%S)

if [ -z "$OUT_CERT" ]; then
  OUT_CERT="${PUBKEY}-cert.pub"
fi

# Use ssh-keygen -s to sign
ssh-keygen -s "$CA_KEY" -I "alverse-${SERIAL}" -n "$PRINCIPALS" -V "${START}:${END}" -z "$SERIAL" "$PUBKEY"

# ssh-keygen creates <basename>-cert.pub where basename = PUBKEY without trailing .pub
PUB_BASENAME="${PUBKEY%.pub}"
DEFAULT_CERT_PATH="${PUB_BASENAME}-cert.pub"
if [ -f "$DEFAULT_CERT_PATH" ]; then
  if [ "$OUT_CERT" != "$DEFAULT_CERT_PATH" ]; then
    mv "$DEFAULT_CERT_PATH" "$OUT_CERT"
  fi
fi

# Validate certificate exists
if [ ! -f "$OUT_CERT" ]; then
  migration_log "step=issue_cert" "action=failed" "reason=cert_not_written" "expected=$OUT_CERT"
  echo "Cert not created" >&2; exit 5
fi

# Record metadata
CERT_SERIAL="$SERIAL"
# write NDJSON (try jq first, fallback to migration_log)
if command -v jq >/dev/null 2>&1; then
  jq -nc --arg ts "$(date -Iseconds)" --arg step "issue_cert" --arg action "done" --arg pub "$PUBKEY" --arg cert "$OUT_CERT" --arg serial "$CERT_SERIAL" '{ts:$ts,step:$step,action:$action,pubkey:$pub,cert:$cert,serial:$serial}' >> /var/log/migration-arc.ndjson || true
else
  migration_log "step=issue_cert" "action=done" "cert=$OUT_CERT" "serial=$CERT_SERIAL"
fi

echo "Issued cert: $OUT_CERT (serial=$CERT_SERIAL)"
