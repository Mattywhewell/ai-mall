#!/usr/bin/env bash
set -euo pipefail

# Simple YubiKey PIV attestation extractor
# Usage: yubikey_extract.sh <cert-pem-file>
# Produces compact JSON on stdout:
# {
#   "type": "yubikey",
#   "cert_pem": "-----BEGIN...",
#   "cert_fingerprint": "SHA256:...",
#   "slot": "9a",
#   "label": "YubiKey-123"
# }

CERT_FILE=${1:-}
if [ -z "$CERT_FILE" ] || [ ! -f "$CERT_FILE" ]; then
  echo "Usage: $0 <cert-pem-file>" >&2
  exit 2
fi

# Read cert
CERT_PEM=$(cat "$CERT_FILE")
# Compute a canonical fingerprint
if command -v openssl >/dev/null 2>&1; then
  # openssl x509 prints fingerprint like "SHA256 Fingerprint=AA:BB:.."
  FP=$(openssl x509 -in "$CERT_FILE" -noout -fingerprint -sha256 2>/dev/null || true)
  # Normalize to SHA256:hex (no colons)
  FP=${FP#SHA256 Fingerprint=}
  FP=${FP//:/}
  CERT_FP="SHA256:${FP}"
else
  CERT_FP=""
fi

cat <<EOF
{
  "type": "yubikey",
  "cert_pem": $(jq -Rs . < "$CERT_FILE"),
  "cert_fingerprint": "${CERT_FP}",
  "slot": "9a",
  "label": "YubiKey-EXAMPLE"
}
EOF
