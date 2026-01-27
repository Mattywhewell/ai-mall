#!/usr/bin/env bash
# Enroll a hardware-backed key (TPM/YubiKey) into the migration system
# Usage: enroll_hardware.sh <device-id> [--type=tpm|yubikey] [--pubkey-file <file>]
set -euo pipefail
source "$(dirname "$0")/../lib/log.sh"

DEVICE_ID=${1:-}
TYPE=tpmsim
PUBKEY_FILE=${3:-}
TEST_ROOT=${TEST_ROOT:-}

if [ -z "${DEVICE_ID}" ]; then
  echo "Usage: $0 <device-id> [--type=tpm|yubikey] [--pubkey-file <file>]" >&2
  exit 2
fi

# For now: accept a provided public key (simulation mode)
if [ -n "${PUBKEY_FILE}" ] && [ -f "${PUBKEY_FILE}" ]; then
  mkdir -p "${TEST_ROOT:-/tmp}/etc/ssh/keys/hardware"
  cp "${PUBKEY_FILE}" "${TEST_ROOT:-/tmp}/etc/ssh/keys/hardware/${DEVICE_ID}.pub"
  migration_log "step=scene5_enroll" "action=done" "device=${DEVICE_ID}" "type=${TYPE}" "pubkey=${PUBKEY_FILE}"
  echo "Enrolled hardware device (simulated): ${DEVICE_ID}"
  exit 0
fi

migration_log "step=scene5_enroll" "action=skipped" "device=${DEVICE_ID}" "reason=no_pubkey_provided"
echo "No pubkey provided; enrollment stub skipped (supply --pubkey-file to enroll)"
exit 0