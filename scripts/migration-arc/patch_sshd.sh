#!/usr/bin/env bash
# Safe, idempotent sshd_config patch + validation
set -euo pipefail
source "$(dirname "$0")/lib/log.sh"

DRY_RUN=${DRY_RUN:-0}
SSHD_CONFIG=${SSHD_CONFIG:-/etc/ssh/sshd_config}
BACKUP="${SSHD_CONFIG}.bak.$(date +%s)"

apply_kv(){
  key=$1; val=$2; file="$SSHD_CONFIG"
  if grep -q "^\s*${key}\s" "$file"; then
    sed -i "s|^\s*${key}\s.*|${key} ${val}|" "$file"
  else
    echo "${key} ${val}" >> "$file"
  fi
}

migration_log "step=patch_sshd" "action=start" "config=$SSHD_CONFIG"

if [ "$DRY_RUN" = "1" ]; then
  echo "[dry-run] would backup $SSHD_CONFIG -> $BACKUP and apply hardening"
  migration_log "step=patch_sshd" "action=dry_run" "config=$SSHD_CONFIG"
  exit 0
fi

cp "$SSHD_CONFIG" "$BACKUP"
apply_kv PermitRootLogin no
apply_kv PasswordAuthentication no
apply_kv ChallengeResponseAuthentication no
apply_kv PubkeyAuthentication yes
apply_kv AuthorizedKeysFile .ssh/authorized_keys

if ! sshd -t; then
  migration_log "step=patch_sshd" "action=invalid_config" "backup=$BACKUP"
  mv "$BACKUP" "$SSHD_CONFIG"
  exit 1
fi

systemctl restart sshd
sleep 1
if ! systemctl is-active --quiet sshd; then
  migration_log "step=patch_sshd" "action=sshd_restart_failed" "backup=$BACKUP"
  mv "$BACKUP" "$SSHD_CONFIG"
  systemctl restart sshd
  exit 2
fi
migration_log "step=patch_sshd" "action=applied" "backup=$BACKUP"

echo "sshd config patched and service restarted"