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

# Parse attestation JSON for 'pubkey' and 'type' (accept type-specific keys)
# Emit a debug NDJSON event with the raw attestation (or mark non-JSON) to aid CI debugging
RAW_ATT=$(cat "$ATTEST_FILE" 2>/dev/null || true)
if echo "$RAW_ATT" | jq -c '.' >/dev/null 2>&1; then
  migration_log "step=attestation_verify" "action=info" "device=$DEVICE" "attest_raw=$(echo "$RAW_ATT" | jq -c '.')"
else
  # When attestation isn't JSON, record raw bytes (base64) so CI can show exact content
  ATT_RAW_B64=$(base64 -w0 "$ATTEST_FILE" 2>/dev/null || echo "")
  migration_log "step=attestation_verify" "action=info" "device=$DEVICE" "attest_raw=<<non-json>>" "attest_raw_b64=$ATT_RAW_B64"
fi

ATT_TYPE=$(jq -r '.type // empty' "$ATTEST_FILE" 2>/dev/null || true)
ATT_PUB=""
if [ "$ATT_TYPE" = "yubikey" ]; then
  # YubiKey attestations include a cert fingerprint or cert PEM rather than an ssh pubkey
  ATT_FP=$(jq -r '.cert_fingerprint // empty' "$ATTEST_FILE" 2>/dev/null || true)
  ATT_CERT=$(jq -r '.cert_pem // empty' "$ATTEST_FILE" 2>/dev/null || true)
  if [ -z "$ATT_FP" ] && [ -z "$ATT_CERT" ]; then
    migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=invalid_attestation_json" "attest_file=$ATTEST_FILE"
    exit 4
  fi
else
  ATT_PUB=$(jq -r '.pubkey // empty' "$ATTEST_FILE" 2>/dev/null || true)
  if [ -z "$ATT_PUB" ] || [ -z "$ATT_TYPE" ]; then
    migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=invalid_attestation_json" "attest_file=$ATTEST_FILE"
    exit 4
  fi
fi

# Check type matches
if [ "$ATT_TYPE" != "$EXPECTED_TYPE" ]; then
  migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=type_mismatch" "expected=$EXPECTED_TYPE" "got=$ATT_TYPE"
  exit 5
fi

# If this is a YubiKey attestation, validate the certificate fingerprint and attributes
if [ "$ATT_TYPE" = "yubikey" ]; then
  # Require openssl for cert parsing and chain validation
  if ! command -v openssl >/dev/null 2>&1; then
    migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=openssl_missing"
    echo "openssl is required to verify yubikey attestations" >&2
    exit 9
  fi

  # Extract policy-level expectations (fingerprint, slot, label, ca_file)
  EXPECTED_FP=""
  EXPECTED_SLOT=""
  EXPECTED_LABEL=""
  EXPECTED_CA_FILE=""
  if [ -n "$EXPECTED_PCRS_FILE" ] && [ -f "$EXPECTED_PCRS_FILE" ]; then
    if jq -e '.fingerprint' "$EXPECTED_PCRS_FILE" >/dev/null 2>&1; then
      EXPECTED_FP=$(jq -r '.fingerprint' "$EXPECTED_PCRS_FILE" 2>/dev/null || echo "")
    fi
    if jq -e '.slot' "$EXPECTED_PCRS_FILE" >/dev/null 2>&1; then
      EXPECTED_SLOT=$(jq -r '.slot' "$EXPECTED_PCRS_FILE" 2>/dev/null || echo "")
    fi
    if jq -e '.label' "$EXPECTED_PCRS_FILE" >/dev/null 2>&1; then
      EXPECTED_LABEL=$(jq -r '.label' "$EXPECTED_PCRS_FILE" 2>/dev/null || echo "")
    fi
    # optional CA file path in policy
    if jq -e '.ca_file' "$EXPECTED_PCRS_FILE" >/dev/null 2>&1; then
      EXPECTED_CA_FILE=$(jq -r '.ca_file' "$EXPECTED_PCRS_FILE" 2>/dev/null || echo "")
    fi
  fi

  # Write the embedded cert PEM to a file and ensure it parses
  TMPDIR=$(mktemp -d)
  ATTEST_CERT_FILE="$TMPDIR/attest_cert.pem"
  jq -r '.cert_pem' "$ATTEST_FILE" > "$ATTEST_CERT_FILE" || true

  if ! openssl x509 -in "$ATTEST_CERT_FILE" -noout >/dev/null 2>&1; then
    migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=malformed_attestation"
    echo "Attestation cert PEM is malformed" >&2
    exit 17
  fi

  # Compute fingerprint from cert and ensure it matches the embedded value
  COMPUTED_FP_HEX=$(openssl x509 -noout -fingerprint -sha256 -in "$ATTEST_CERT_FILE" | awk -F'=' '{print $NF}' | tr -d ':' | tr -d '\n' | tr '[:lower:]' '[:upper:]')
  COMPUTED_FP="SHA256:$COMPUTED_FP_HEX"
  ACTUAL_FP=$(jq -r '.cert_fingerprint // empty' "$ATTEST_FILE" 2>/dev/null || true)
  if [ -z "$ACTUAL_FP" ]; then
    migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=fingerprint_missing"
    echo "Attestation missing cert_fingerprint" >&2
    exit 11
  fi

  if [ "$COMPUTED_FP" != "$ACTUAL_FP" ]; then
    migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=attest_cert_fingerprint_mismatch" "computed=$COMPUTED_FP" "attested=$ACTUAL_FP"
    echo "Attestation cert fingerprint does not match embedded certificate" >&2
    exit 18
  fi

  # Certificate chain validation: prefer TEST_ROOT/yubikey_ca.pem, otherwise use ca_file from policy if present
  CA_FILE=""
  if [ -n "${TEST_ROOT:-}" ] && [ -f "${TEST_ROOT}/yubikey_ca.pem" ]; then
    CA_FILE="${TEST_ROOT}/yubikey_ca.pem"
  elif [ -n "$EXPECTED_CA_FILE" ]; then
    # Policy may point at a file path; try resolving relative to TEST_ROOT or absolute
    if [ -n "${TEST_ROOT:-}" ] && [ -f "${TEST_ROOT}/$EXPECTED_CA_FILE" ]; then
      CA_FILE="${TEST_ROOT}/$EXPECTED_CA_FILE"
    elif [ -f "$EXPECTED_CA_FILE" ]; then
      CA_FILE="$EXPECTED_CA_FILE"
    fi
  fi

  if [ -z "$CA_FILE" ] || [ ! -f "$CA_FILE" ]; then
    migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=ca_missing"
    echo "CA file for YubiKey verification not found" >&2
    exit 19
  fi

  if ! openssl verify -CAfile "$CA_FILE" "$ATTEST_CERT_FILE" >/dev/null 2>&1; then
    migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=cert_chain_invalid"
    echo "Certificate chain validation failed" >&2
    exit 20
  fi

  # Policy fingerprint enforcement (strict/permissive behavior)
  if [ -n "$EXPECTED_FP" ]; then
    if [ "$EXPECTED_FP" != "$ACTUAL_FP" ]; then
      if [ "$PCR_MODE" = "strict" ]; then
        migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=fingerprint_mismatch" "expected=$EXPECTED_FP" "got=$ACTUAL_FP"
        echo "YubiKey fingerprint mismatch (strict mode)" >&2
        exit 14
      else
        migration_log "step=attestation_verify" "action=warn" "device=$DEVICE" "reason=fingerprint_mismatch" "mode=permissive" "expected=$EXPECTED_FP" "got=$ACTUAL_FP"
        echo "YubiKey fingerprint mismatch (permissive mode): continuing" >&2
      fi
    else
      migration_log "step=attestation_verify" "action=info" "device=$DEVICE" "method=yubikey" "attest_file=$ATTEST_FILE" "fingerprint_check=pass"
    fi
  else
    migration_log "step=attestation_verify" "action=info" "device=$DEVICE" "method=yubikey" "fingerprint=$ACTUAL_FP" "note=no_expected_fingerprint"
  fi

  # Optional slot/label checks
  POL_SLOT="$EXPECTED_SLOT"
  POL_LABEL="$EXPECTED_LABEL"
  ATTSLOT=$(jq -r '.slot // empty' "$ATTEST_FILE" 2>/dev/null || true)
  ATTLABEL=$(jq -r '.label // empty' "$ATTEST_FILE" 2>/dev/null || true)
  if [ -n "$POL_SLOT" ] && [ "$POL_SLOT" != "$ATTSLOT" ]; then
    if [ "$PCR_MODE" = "strict" ]; then
      migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=slot_mismatch" "expected=$POL_SLOT" "got=$ATTSLOT"
      echo "YubiKey slot mismatch (strict): deny" >&2
      exit 21
    else
      migration_log "step=attestation_verify" "action=warn" "device=$DEVICE" "reason=slot_mismatch" "mode=permissive" "expected=$POL_SLOT" "got=$ATTSLOT"
    fi
  fi
  if [ -n "$POL_LABEL" ] && [ "$POL_LABEL" != "$ATTLABEL" ]; then
    if [ "$PCR_MODE" = "strict" ]; then
      migration_log "step=attestation_verify" "action=failed" "device=$DEVICE" "reason=label_mismatch" "expected=$POL_LABEL" "got=$ATTLABEL"
      echo "YubiKey label mismatch (strict): deny" >&2
      exit 22
    else
      migration_log "step=attestation_verify" "action=warn" "device=$DEVICE" "reason=label_mismatch" "mode=permissive" "expected=$POL_LABEL" "got=$ATTLABEL"
    fi
  fi

  migration_log "step=attestation_verify" "action=done" "device=$DEVICE" "method=yubikey" "attest_file=$ATTEST_FILE" "fingerprint_check=pass" "cert_chain=pass"
  exit 0
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
