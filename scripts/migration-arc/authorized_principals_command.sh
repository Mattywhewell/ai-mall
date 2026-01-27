#!/usr/bin/env bash
# AuthorizedPrincipalsCommand-style revocation check
# Usage: authorized_principals_command.sh <cert-file> [revocation-list]
set -euo pipefail
source "$(dirname "$0")/lib/log.sh"

CERT_FILE=${1:-}
REVOCATION_LIST=${2:-/etc/ssh/revoked_cert_serials}
TEST_ROOT=${TEST_ROOT:-}

if [ -n "$TEST_ROOT" ]; then
  REVOCATION_LIST="$TEST_ROOT/etc/ssh/revoked_cert_serials"
fi

if [ -z "$CERT_FILE" ]; then
  echo "Usage: $0 <cert-file> [revocation-list]" >&2; exit 2
fi

if [ ! -f "$CERT_FILE" ]; then
  migration_log "step=authorized_principals" "action=failed" "reason=cert_not_found" "cert=$CERT_FILE"
  exit 3
fi

# Extract serial
SERIAL=$(ssh-keygen -Lf "$CERT_FILE" | awk '/Serial/ {print $2; exit}') || true
if [ -z "$SERIAL" ]; then
  migration_log "step=authorized_principals" "action=failed" "reason=serial_parse_failed" "cert=$CERT_FILE"
  exit 4
fi

# Check revocation
if [ -f "$REVOCATION_LIST" ] && grep -q "^${SERIAL}$" "$REVOCATION_LIST"; then
  migration_log "step=authorized_principals" "action=deny" "serial=$SERIAL" "cert=$CERT_FILE"
  # For AuthorizedPrincipalsCommand, failing to output principals denies access.
  exit 1
fi

# Extract principals
PRINCIPALS_LINE=$(ssh-keygen -Lf "$CERT_FILE" | awk -F":" '/Valid principals/ {print $2; exit}') || PRINCIPALS_LINE=""

if [ -z "$PRINCIPALS_LINE" ]; then
  # No principals embedded; default to empty (deny) or could print user arg
  migration_log "step=authorized_principals" "action=done" "serial=$SERIAL" "principals=none"
  exit 1
fi

# Split principals on comma and print each on its own line
echo "$PRINCIPALS_LINE" | tr ',' '\n' | sed 's/^\s*//;s/\s*$//' | tee /dev/stderr >/dev/stdout
migration_log "step=authorized_principals" "action=done" "serial=$SERIAL" "principals=$(echo $PRINCIPALS_LINE)"
exit 0
