#!/usr/bin/env bash
# Atomic install of a public key into a target user's authorized_keys with markers
set -euo pipefail
source "$(dirname "$0")/lib/log.sh"

USER=${USER:-$(whoami)}
PUBKEY_FILE=${PUBKEY_FILE:-/etc/ssh/keys/adele.pub}
MARKER_START="# MIGRATION_ARC: ${USER} START"
MARKER_END="# MIGRATION_ARC: ${USER} END"
TEST_ROOT=${TEST_ROOT:-}
DRY_RUN=${DRY_RUN:-0}

if [ -n "$TEST_ROOT" ]; then
  HOME_DIR="$TEST_ROOT/home/$USER"
else
  HOME_DIR="/home/$USER"
fi

AK="$HOME_DIR/.ssh/authorized_keys"

migration_log "step=install_key" "action=start" "user=$USER" "pubkey=$PUBKEY_FILE"

if [ ! -f "$PUBKEY_FILE" ]; then
  echo "Public key not found: $PUBKEY_FILE"; migration_log "step=install_key" "action=missing_pubkey" "file=$PUBKEY_FILE"; exit 2
fi

mkdir -p "$HOME_DIR/.ssh"
chmod 700 "$HOME_DIR/.ssh"
if [ ! -f "$AK" ]; then
  touch "$AK"; chmod 600 "$AK"; chown "$USER:$USER" "$AK" 2>/dev/null || true
fi

if [ "$DRY_RUN" = "1" ]; then
  echo "[dry-run] would install key to $AK"
  migration_log "step=install_key" "action=dry_run" "target=$AK"
  exit 0
fi

# Remove existing block
awk -v s="$MARKER_START" -v e="$MARKER_END" 'BEGIN{skip=0} { if ($0==s) {skip=1} else if ($0==e) {skip=0; next} else if (!skip) print }' "$AK" > "$AK.tmp" && mv "$AK.tmp" "$AK"
# Append block
cat >> "$AK" <<EOF
$MARKER_START
$(cat "$PUBKEY_FILE")
$MARKER_END
EOF
chmod 600 "$AK"
chown "$USER:$USER" "$AK" 2>/dev/null || true
migration_log "step=install_key" "action=installed" "target=$AK"

echo "Installed key into $AK"