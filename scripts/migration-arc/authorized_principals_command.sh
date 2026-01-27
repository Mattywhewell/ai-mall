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

# Extract principals robustly (handle case/format variations)
# Try 'Principals:' first (typical ssh-keygen -Lf output), then fallback to 'Valid principals'
PR_LINE=$(ssh-keygen -Lf "$CERT_FILE" | grep -i -E '^\s*Principals:|^\s*Valid principals' -m1 || true)
PRINCIPALS_LINE=""
if [ -n "$PR_LINE" ]; then
  PRINCIPALS_LINE=$(echo "$PR_LINE" | sed -E 's/^[^:]*:[[:space:]]*//')
fi

if [ -z "$PRINCIPALS_LINE" ]; then
  # Debug: capture ssh-keygen -Lf output in log for diagnosis
  SSH_LF_OUT=$(ssh-keygen -Lf "$CERT_FILE" 2>/dev/null || true)
  migration_log "step=authorized_principals" "action=failed" "reason=no_principals_found" "serial=$SERIAL" "ssh_lf_out=$(echo "$SSH_LF_OUT" | tr '\n' ' ' | sed 's/"/\\"/g')"
  exit 1
fi

# Split principals on comma and print each on its own line
printf '%s' "$PRINCIPALS_LINE" | tr ',' '\n' | sed 's/^\s*//;s/\s*$//' | tee /dev/stderr >/dev/stdout
migration_log "step=authorized_principals" "action=done" "serial=$SERIAL" "principals=$PRINCIPALS_LINE"
exit 0
