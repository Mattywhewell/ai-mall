#!/usr/bin/env bash
# Idempotent YubiKey enrollment shim (Scene 4)
set -euo pipefail
source "$(dirname "$0")/lib/log.sh"

DRY_RUN=${DRY_RUN:-0}
TEST_ROOT=${TEST_ROOT:-}
DEVICE_ID=${DEVICE_ID:-"yubikey-$(date +%s)"}
PUBKEY_FILE=${PUBKEY_FILE:-}
DEVICE_KEYS_DIR=${DEVICE_KEYS_DIR:-/etc/ssh/keys/devices}

if [ -n "$TEST_ROOT" ]; then
  DEVICE_KEYS_DIR="$TEST_ROOT/etc/ssh/keys/devices"
  mkdir -p "$TEST_ROOT/etc/ssh/keys"
fi

mkdir -p "$DEVICE_KEYS_DIR"

migration_log "step=enroll_yubikey" "action=start" "device=$DEVICE_ID"

# If PUBKEY_FILE provided, copy it; otherwise in test mode generate a key
if [ -z "${PUBKEY_FILE:-}" ]; then
  if [ "$DRY_RUN" = "1" ] || [ -n "$TEST_ROOT" ]; then
    # Generate a temporary key to simulate device
    TMP_KEY="${TEST_ROOT:-/tmp}/tmp_yubikey_${DEVICE_ID}"
    mkdir -p "$(dirname "$TMP_KEY")"
    ssh-keygen -t ed25519 -f "$TMP_KEY" -N "" -C "$DEVICE_ID" >/dev/null
    PUBKEY_FILE="${TMP_KEY}.pub"
    migration_log "step=enroll_yubikey" "action=simulate_generated_pubkey" "file=$PUBKEY_FILE"
  else
    echo "No PUBKEY_FILE provided and not in TEST_ROOT/DRY_RUN. Please provide PUBKEY_FILE or run with DRY_RUN/TEST_ROOT." >&2
    migration_log "step=enroll_yubikey" "action=failed" "reason=no_pubkey" 
    exit 2
  fi
fi

# Compute fingerprint
FP=$(ssh-keygen -lf "$PUBKEY_FILE" | awk '{print $2}') || FP="unknown"
TARGET_FILE="$DEVICE_KEYS_DIR/${DEVICE_ID}.pub"

# Idempotent write: if fingerprint matches existing file, skip
if [ -f "$TARGET_FILE" ]; then
  EXIST_FP=$(ssh-keygen -lf "$TARGET_FILE" | awk '{print $2}') || EXIST_FP=""
  if [ "$EXIST_FP" = "$FP" ]; then
    migration_log "step=enroll_yubikey" "action=exists" "device=$DEVICE_ID" "fp=$FP" "path=$TARGET_FILE"
    echo "Device already enrolled: $TARGET_FILE (fp=$FP)"
    exit 0
  fi
fi

if [ "$DRY_RUN" = "1" ]; then
  echo "[dry-run] would install pubkey to $TARGET_FILE"
  migration_log "step=enroll_yubikey" "action=dry_run" "device=$DEVICE_ID" "fp=$FP"
  exit 0
fi

cp "$PUBKEY_FILE" "$TARGET_FILE"
chmod 644 "$TARGET_FILE"
migration_log "step=enroll_yubikey" "action=installed" "device=$DEVICE_ID" "fp=$FP" "path=$TARGET_FILE"

echo "Enrolled device: $TARGET_FILE (fp=$FP)"