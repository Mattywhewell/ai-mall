#!/usr/bin/env bash
# Verify a simulated TPM attestation.
# Usage: verify_attestation.sh <device-id> <attestation-file> <expected-pubkey-file> [expected-type]
set -euo pipefail
# Prefer external migration_log helper when available
if [ -f "$(dirname "$0")/../lib/log.sh" ]; then
  # shellcheck disable=SC1091
  source "$(dirname "$0")/../lib/log.sh"
else
  migration_log() {
    if [ "$(type -t migration_log 2>/dev/null)" = "file" ]; then
      command migration_log "$@"
    else
      echo "$*" >&2
    fi
  }
fi

DEVICE=${1:-}
ATTEST_FILE=${2:-}
EXPECTED_PUBKEY_FILE=${3:-}
EXPECTED_TYPE=${4:-tpm-sim}
# Optional: expected PCRs file (JSON) and PCR mode: 'strict' (default) or 'permissive'
EXPECTED_PCRS_FILE=${5:-}
PCR_MODE=${6:-strict}

if [ -z "$DEVICE" ] || [ -z "$ATTEST_FILE" ] || [ -z "$EXPECTED_PUBKEY_FILE" ]; then
  echo "Usage: $0 <device-id> <attestation-file> <expected-pubkey-file> [expected-type]" >&2
  exit 2
fi

# Ensure jq availability
if ! command -v jq >/dev/null 2>&1; then
  migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=jq_missing"
  echo "jq is required to verify attestation" >&2
  exit 9
fi

if [ ! -f "$ATTEST_FILE" ]; then
  migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=attestation_missing" "attest_file=$ATTEST_FILE"
  exit 3
fi

# Parse attestation JSON for 'pubkey' and 'type'
ATT_PUB=$(jq -r '.pubkey // empty' "$ATTEST_FILE" 2>/dev/null || true)
ATT_TYPE=$(jq -r '.type // empty' "$ATTEST_FILE" 2>/dev/null || true)
if [ -z "$ATT_PUB" ] || [ -z "$ATT_TYPE" ]; then
  migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=invalid_attestation_json" "attest_file=$ATTEST_FILE"
  exit 4
fi

# Check type matches
if [ "$ATT_TYPE" != "$EXPECTED_TYPE" ]; then
  migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=type_mismatch" "expected=$EXPECTED_TYPE" "got=$ATT_TYPE"
  exit 5
fi

# If this is a real TPM attestation, perform a quote signature check using tpm2_checkquote
if [ "$ATT_TYPE" = "tpm" ]; then
  # Ensure tpm2_checkquote available
  if ! command -v tpm2_checkquote >/dev/null 2>&1; then
    migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=tpm2_checkquote_missing"
    echo "tpm2_checkquote is required to verify real TPM attestations" >&2
    exit 10
  fi

  ATT_QUOTE_B64=$(jq -r '.attestation // empty' "$ATTEST_FILE" || true)
  ATT_SIG_B64=$(jq -r '.signature // empty' "$ATTEST_FILE" || true)
  AK_PUB_PEM=$(jq -r '.ak_pub_pem // empty' "$ATTEST_FILE" || true)

  if [ -z "$ATT_QUOTE_B64" ] || [ -z "$ATT_SIG_B64" ]; then
    migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=missing_quote_or_signature"
    exit 11
  fi

  TMPDIR=$(mktemp -d)
  echo "$ATT_QUOTE_B64" | tr -d '\n' | base64 -d > "$TMPDIR/quote.bin"
  echo "$ATT_SIG_B64" | tr -d '\n' | base64 -d > "$TMPDIR/sig.bin"

  # Prefer AK pub provided in attestation (PEM). Otherwise try converting the expected pubkey file.
  AK_PEM_FILE="$TMPDIR/ak.pub.pem"
  if [ -n "$AK_PUB_PEM" ]; then
    # jq -r will output real newlines; write it directly
    jq -r '.ak_pub_pem' "$ATTEST_FILE" > "$AK_PEM_FILE" || true
  else
    # Try convert expected pubkey (ssh) to PEM (PKCS8)
    if ssh-keygen -f "$EXPECTED_PUBKEY_FILE" -e -m PKCS8 > "$AK_PEM_FILE" 2>/dev/null; then
      echo "Converted expected pubkey to PEM for AK verification"
    else
      migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=ak_pub_missing"
      exit 12
    fi
  fi

  # Run tpm2_checkquote against AK pub, quote, and signature
  if tpm2_checkquote -u "$AK_PEM_FILE" -m "$TMPDIR/quote.bin" -s "$TMPDIR/sig.bin" >/dev/null 2>&1; then
    migration_log "step=attestation_verify" "action=done" "device=$DEVICE" "method=real_tpm" "attest_file=$ATTEST_FILE"
    echo "TPM quote signature verified"

    # If an expected PCRs file is provided, validate PCRs according to mode
    if [ -n "$EXPECTED_PCRS_FILE" ]; then
      if [ ! -f "$EXPECTED_PCRS_FILE" ]; then
        migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=expected_pcrs_missing" "file=$EXPECTED_PCRS_FILE"
        echo "Expected PCRs file not found: $EXPECTED_PCRS_FILE" >&2
        exit 15
      fi
      # Ensure expected PCRs JSON is valid
      if ! jq -e '.' "$EXPECTED_PCRS_FILE" >/dev/null 2>&1; then
        migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=malformed_expected_pcrs" "file=$EXPECTED_PCRS_FILE"
        echo "Expected PCRs file is not valid JSON: $EXPECTED_PCRS_FILE" >&2
        exit 16
      fi
      # Read expected and actual PCR JSON objects
      # If the provided expected file is a full policy object with a 'pcrs' key, extract it.
      if jq -e '.pcrs' "$EXPECTED_PCRS_FILE" >/dev/null 2>&1; then
        EXPECTED_PCR_JSON=$(jq -c '.pcrs' "$EXPECTED_PCRS_FILE" 2>/dev/null || echo '{}')
      else
        EXPECTED_PCR_JSON=$(jq -c '.' "$EXPECTED_PCRS_FILE" 2>/dev/null || echo '{}')
      fi
      ACTUAL_PCR_JSON=$(jq -c '.pcrs // {}' "$ATTEST_FILE" 2>/dev/null || echo '{}')

      # For each PCR in expected, compare values
      mismatch=0
      for p in $(echo "$EXPECTED_PCR_JSON" | jq -r 'keys[]' 2>/dev/null || true); do
        expected_val=$(echo "$EXPECTED_PCR_JSON" | jq -r --arg k "$p" '.[$k]')
        actual_val=$(echo "$ACTUAL_PCR_JSON" | jq -r --arg k "$p" '.[$k] // empty')
        if [ -z "$actual_val" ]; then
          migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=pcr_missing" "pcr=$p"
          echo "PCR $p missing in attestation" >&2
          mismatch=1
          if [ "$PCR_MODE" = "strict" ]; then break; fi
          continue
        fi
        if [ "$expected_val" != "$actual_val" ]; then
          migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=pcr_mismatch" "pcr=$p" "expected=$expected_val" "got=$actual_val"
          echo "PCR $p mismatch: expected=$expected_val got=$actual_val" >&2
          mismatch=1
          if [ "$PCR_MODE" = "strict" ]; then break; fi
        else
          migration_log "step=attestation_verify" "action=pcr_check" "device=$DEVICE" "pcr=$p" "status=pass"
        fi
      done

      if [ $mismatch -eq 1 ]; then
        if [ "$PCR_MODE" = "strict" ]; then
          migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=pcr_policy_failed"
          echo "PCR policy check failed (strict mode)" >&2
          exit 14
        else
          migration_log "step=attestation_verify" "action=warn" "device=$DEVICE" "reason=pcr_policy_mismatch" "mode=permissive"
          echo "PCR policy mismatch (permissive mode): continuing" >&2
        fi
      else
        migration_log "step=attestation_verify" "action=done" "device=$DEVICE" "method=real_tpm" "attest_file=$ATTEST_FILE" "pcr_check=pass"
      fi
    fi

    exit 0
  else
    migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=checkquote_failed"
    echo "tpm2_checkquote failed to verify the quote" >&2
    exit 13
  fi
fi

# Fallback: simulated attestation (existing behavior)
# Read expected pubkey
if [ ! -f "$EXPECTED_PUBKEY_FILE" ]; then
  migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=expected_pubkey_missing" "pubkey_file=$EXPECTED_PUBKEY_FILE"
  exit 6
fi
EXPECTED_PUB=$(cat "$EXPECTED_PUBKEY_FILE" || true)

if [ "$ATT_PUB" != "$EXPECTED_PUB" ]; then
  migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=pubkey_mismatch" "attest_file=$ATTEST_FILE" "pubkey_file=$EXPECTED_PUBKEY_FILE"
  exit 7
fi

migration_log "step=attestation_verify" "action=done" "device=$DEVICE" "attest_file=$ATTEST_FILE" "pubkey_file=$EXPECTED_PUBKEY_FILE"
exit 0
