#!/usr/bin/env bash
# Create a short-lived rollback timer: if /tmp/migration-ok is not present after TIMEOUT seconds, restore backup
set -euo pipefail
source "$(dirname "$0")/lib/log.sh"

SSHD_CONFIG=${SSHD_CONFIG:-/etc/ssh/sshd_config}
BACKUP=${BACKUP:-${SSHD_CONFIG}.bak}
TIMEOUT=${TIMEOUT:-300}
DRY_RUN=${DRY_RUN:-0}

migration_log "step=rollback_timer" "action=start" "timeout=$TIMEOUT" "backup=$BACKUP"

if [ "$DRY_RUN" = "1" ]; then
  echo "[dry-run] would create rollback timer for $TIMEOUT seconds"
  migration_log "step=rollback_timer" "action=dry_run" "timeout=$TIMEOUT"
  exit 0
fi
(
  sleep "$TIMEOUT"
  if [ ! -f /tmp/migration-ok ]; then
    migration_log "step=rollback_timer" "action=rollback" "backup=$BACKUP"
    cp "$BACKUP" "$SSHD_CONFIG" || true
    systemctl restart sshd || true
  else
    migration_log "step=rollback_timer" "action=cancelled"
  fi
)&

echo "Rollback timer started (will trigger in $TIMEOUT seconds unless /tmp/migration-ok is present)"
