#!/usr/bin/env bash
# Revoke a certificate by serial (append to revocation list)
set -euo pipefail
source "$(dirname "$0")/lib/log.sh"

CERT_FILE=${1:-}
REVOCATION_LIST=${REVOCATION_LIST:-/etc/ssh/revoked_cert_serials}
TEST_ROOT=${TEST_ROOT:-}

if [ -n "$TEST_ROOT" ]; then
  REVOCATION_LIST="$TEST_ROOT/etc/ssh/revoked_cert_serials"
  mkdir -p "$(dirname "$REVOCATION_LIST")"
fi

if [ -z "$CERT_FILE" ]; then
  echo "Usage: $0 <cert-file>" >&2; exit 2
fi

if [ ! -f "$CERT_FILE" ]; then
  echo "Cert not found: $CERT_FILE" >&2; exit 3
fi

# Extract serial using ssh-keygen -L
SERIAL=$(ssh-keygen -Lf "$CERT_FILE" | awk '/Serial/ {print $2; exit}') || true
if [ -z "$SERIAL" ]; then
  echo "Could not parse serial from cert: $CERT_FILE" >&2
  exit 4
fi

if grep -q "^${SERIAL}$" "$REVOCATION_LIST" 2>/dev/null; then
  migration_log "step=revoke_cert" "action=exists" "serial=$SERIAL" "cert=$CERT_FILE"
  echo "Serial $SERIAL already revoked"; exit 0
fi

if [ ! -w "$(dirname "$REVOCATION_LIST")" ] 2>/dev/null; then
  migration_log "step=revoke_cert" "action=failed" "reason=no_write" "serial=$SERIAL"
  echo "No write permission to revocation list dir" >&2; exit 5
fi

echo "$SERIAL" >> "$REVOCATION_LIST"
migration_log "step=revoke_cert" "action=revoked" "serial=$SERIAL" "cert=$CERT_FILE"

echo "Revoked serial: $SERIAL"