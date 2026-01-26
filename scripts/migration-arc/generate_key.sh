#!/usr/bin/env bash
# Idempotent key generation for Migration Arc
set -euo pipefail
source "$(dirname "$0")/lib/log.sh"

KEY_PATH=${KEY_PATH:-$HOME/.ssh/adele_ed25519}
COMMENT=${COMMENT:-"adele@device"}
DRY_RUN=${DRY_RUN:-0}

migration_log "step=generate_key" "action=start" "key_path=$KEY_PATH"

if [ -f "$KEY_PATH" ]; then
  migration_log "step=generate_key" "action=exists" "path=$KEY_PATH"
  ssh-keygen -lf "${KEY_PATH}.pub" || true
  exit 0
fi

if [ "$DRY_RUN" = "1" ]; then
  echo "[dry-run] would generate key at $KEY_PATH"
  migration_log "step=generate_key" "action=dry_run" "path=$KEY_PATH"
  exit 0
fi

mkdir -p "$(dirname "$KEY_PATH")"
ssh-keygen -t ed25519 -a 100 -f "$KEY_PATH" -C "$COMMENT" -N "" >/dev/null
chmod 600 "$KEY_PATH" "$KEY_PATH.pub"
ssh-keygen -lf "${KEY_PATH}.pub"
migration_log "step=generate_key" "action=generated" "path=$KEY_PATH"

echo "Key generated: $KEY_PATH"