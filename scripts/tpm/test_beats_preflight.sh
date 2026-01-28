#!/usr/bin/env bash
set -euo pipefail

# Preflight guard: ensure beat scripts exist, are executable, and parse as valid shell scripts.
# Meant to run at repo root (same as CI). This is a quick, fast early-warning check.

ROOT=$(pwd)
if [ ! -d ".git" ] && [ ! -d "scripts" ]; then
  echo "Warning: not at repo root (no .git or scripts/ found), continuing but checks may fail." >&2
fi

OUTDIR="${OUTDIR:-./tmp}"
mkdir -p "$OUTDIR"

SCRIPTS=(
  "scripts/tpm/beat1_check.sh"
  "scripts/tpm/beat2_create_identity.sh"
  "scripts/tpm/beat3_capture_attestation.sh"
  "scripts/tpm/beat4_register_identity.sh"
  "scripts/tpm/beat5_verify_attestation.sh"
  "scripts/tpm/ci_run_beats_1_to_5.sh"
)

echo "Preflight: checking existence and executability of TPM beat scripts"
failed=0
for s in "${SCRIPTS[@]}"; do
  if [ -f "$s" ]; then
    ls -l "$s"
    if [ -x "$s" ]; then
      echo "OK: $s exists and is executable"
    else
      echo "WARN: $s exists but is not executable" >&2
      chmod +x "$s" || true
      echo "Attempted to chmod +x $s"
    fi
    # syntax check (bash -n)
    if bash -n "$s" 2>/dev/null; then
      echo "Syntax: $s OK"
    else
      echo "ERROR: syntax check failed for $s" >&2
      bash -n "$s" || true
      failed=1
    fi
  else
    echo "ERROR: missing script: $s" >&2
    failed=1
  fi
done

# Quick check: ensure ci_run_beats_1_to_5.sh invokes the expected relative paths
if [ -f "scripts/tpm/ci_run_beats_1_to_5.sh" ]; then
  missing_invocations=0
  for beat in "beat1_check.sh" "beat2_create_identity.sh" "beat3_capture_attestation.sh" "beat4_register_identity.sh" "beat5_verify_attestation.sh"; do
    if ! grep -q "$beat" scripts/tpm/ci_run_beats_1_to_5.sh; then
      echo "WARN: ci_run_beats_1_to_5.sh does not mention $beat" >&2
      missing_invocations=1
    fi
  done
  if [ $missing_invocations -eq 0 ]; then
    echo "ci_run_beats_1_to_5.sh appears to invoke all expected beat scripts"
  fi
fi

if [ "$failed" -ne 0 ]; then
  echo "Preflight failed: see errors above" >&2
  exit 1
fi

echo "Preflight completed: all checks passed"
exit 0
