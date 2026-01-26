#!/usr/bin/env bash
# Validate SSH access locally and optionally remotely
set -euo pipefail
source "$(dirname "$0")/lib/log.sh"

KEY_PATH=${KEY_PATH:-$HOME/.ssh/adele_ed25519}
USER=${USER:-$(whoami)}
PORT=${PORT:-22}
TARGET_HOST=${TARGET_HOST:-localhost}
DRY_RUN=${DRY_RUN:-0}

migration_log "step=validate_ssh" "action=start" "target=$TARGET_HOST" "user=$USER"

if [ "$DRY_RUN" = "1" ]; then
  echo "[dry-run] would attempt SSH auth to $USER@$TARGET_HOST:$PORT using $KEY_PATH"
  migration_log "step=validate_ssh" "action=dry_run" "target=$TARGET_HOST"
  exit 0
fi

ssh -o BatchMode=yes -i "$KEY_PATH" -p "$PORT" "$USER@$TARGET_HOST" 'echo SSH_OK' >/tmp/migration-ssh.out 2>/tmp/migration-ssh.err || true
if grep -q "SSH_OK" /tmp/migration-ssh.out 2>/dev/null; then
  migration_log "step=validate_ssh" "action=success" "target=$TARGET_HOST"
  echo "SSH validation succeeded to $TARGET_HOST"
  exit 0
else
  migration_log "step=validate_ssh" "action=failure" "target=$TARGET_HOST" "err=$(head -n 1 /tmp/migration-ssh.err 2>/dev/null || true)"
  echo "SSH validation failed; see /tmp/migration-ssh.err"
  cat /tmp/migration-ssh.err
  exit 2
fi