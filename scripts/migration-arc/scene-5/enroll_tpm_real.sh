#!/usr/bin/env bash
# PoC enroll_tpm_real.sh - detect TPM, extract EK/AK, create a quote and emit attestation JSON
set -euo pipefail

TEST_ROOT=${1:-$(mktemp -d)}
mkdir -p "$TEST_ROOT/etc/ssh/keys/hardware/attestations" "$TEST_ROOT/etc/ssh/keys/hardware"

# Requirements: tpm2-tools (tpm2_getcap, tpm2_createprimary, tpm2_createak, tpm2_quote, tpm2_checkquote, tpm2_readpublic)
for cmd in tpm2_getcap tpm2_createprimary tpm2_createak tpm2_quote tpm2_checkquote tpm2_readpublic; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: required command '$cmd' not found; install tpm2-tools" >&2
    exit 2
  fi
done

DEVICE=${2:-"real-device-tpm"}
OUT_DIR="$TEST_ROOT/etc/ssh/keys/hardware"
ATTEST_FILE="$OUT_DIR/attestations/${DEVICE}-attestation.json"
PUBKEY_FILE="$OUT_DIR/${DEVICE}.pub"

# 1) Detect TPM presence
if ! tpm2_getcap -c properties-fixed >/dev/null 2>&1; then
  echo "No TPM detected on this host (tpm2_getcap failed)" >&2; exit 3
fi

# 2) Create a primary key in endorsement hierarchy (EK-like for PoC)
TMPDIR=$(mktemp -d)
echo "Creating primary (EK-like) on endorsement hierarchy..."
PRIMARY_CTX="$TMPDIR/ek.ctx"
tpm2_createprimary -C e -g sha256 -G rsa -c "$PRIMARY_CTX" >/dev/null

# 3) Read public part (PEM if supported)
EK_PUB_PEM="$TMPDIR/ek.pub.pem"
if tpm2_readpublic -c "$PRIMARY_CTX" -f pem -o "$EK_PUB_PEM" >/dev/null 2>&1; then
  echo "Converted EK public to PEM: $EK_PUB_PEM"
else
  # fallback: readpublic raw and continue (user may need to adapt)
  tpm2_readpublic -c "$PRIMARY_CTX" -o "$TMPDIR/ek.rawpub" || true
  echo "Warning: tpm2_readpublic -f pem not supported; saved raw pub to $TMPDIR/ek.rawpub"
fi

# 4) Create an Attestation Key (AK) for quoting
echo "Creating AK..."
AK_CTX="$TMPDIR/ak.ctx"
AK_PUB="$TMPDIR/ak.pub.pem"
AK_PRIV="$TMPDIR/ak.priv"
# Use tpm2_createak where available
if tpm2_createak -C "$PRIMARY_CTX" -c "$AK_CTX" -u "$AK_PUB" -r "$AK_PRIV" >/dev/null 2>&1; then
  echo "AK created"
else
  echo "tpm2_createak failed; try running with proper EK/endorsement or platform provisioned EK" >&2
  exit 4
fi

# 5) Generate a quote over PCRs (example PCRs: 0,1,2)
PCRS="sha256:0,1,2"
QUOTE_BIN="$TMPDIR/quote.bin"
QUOTE_SIG="$TMPDIR/quote.sig"
PCR_OUTPUT="$TMPDIR/pcrs.out"
# tpm2_quote expects loaded AK handle; some tpm2-tools variants use ctx from createak directly
if tpm2_quote -c "$AK_CTX" -l "$PCRS" -q "random-nonce" -m "$QUOTE_BIN" -s "$QUOTE_SIG" -o "$PCR_OUTPUT" >/dev/null 2>&1; then
  echo "Quote generated"
else
  echo "tpm2_quote failed; ensure AK is loadable and tpm2-tools version supports the options used" >&2
  exit 5
fi

# 6) Convert AK pub to an SSH-format pubkey if possible
if command -v ssh-keygen >/dev/null 2>&1 && [ -f "$AK_PUB" ]; then
  # If AK pub is PEM RSA, derive SSH pubkey
  if openssl rsa -pubin -in "$AK_PUB" -pubout >/dev/null 2>&1; then
    ssh-keygen -f "$AK_PUB" -i -m PKCS8 >/dev/null 2>&1 || true
  fi
  # Try to create an SSH public key from the AK pub PEM
  if openssl rsa -pubin -in "$AK_PUB" -outform PEM >/dev/null 2>&1; then
    # Attempt to derive an ssh-rsa key
    ssh_pub_line=$(ssh-keygen -f "$AK_PUB" -i -m PKCS8 2>/dev/null || true)
    if [ -n "$ssh_pub_line" ]; then
      echo "$ssh_pub_line $DEVICE" > "$PUBKEY_FILE"
    else
      echo "AK pub present but ssh-keygen conversion failed; saving PEM at $AK_PUB" > /dev/stderr
      cp "$AK_PUB" "$PUBKEY_FILE.pem"
    fi
  fi
fi

# 7) Build attestation artifact (JSON): device, type, pubkey (as string), attestation (base64 quote)
QUOTE_B64=$(base64 -w0 "$QUOTE_BIN" || base64 "$QUOTE_BIN" | tr -d '\n')
PUBKEY_STR="$( [ -f "$PUBKEY_FILE" ] && tr -d '\n' < "$PUBKEY_FILE" || echo "(no-ssh-pub-available)" )"
jq -n --arg device "$DEVICE" --arg type "tpm" --arg pubkey "$PUBKEY_STR" --arg attest "$QUOTE_B64" '{device:$device, type:$type, pubkey:$pubkey, attestation:$attest}' > "$ATTEST_FILE"

echo "Wrote attestation JSON -> $ATTEST_FILE"
ls -l "$ATTEST_FILE" "$PUBKEY_FILE" || true

echo "Done. You can now run scripts/migration-arc/authorized_principals_command.sh against the produced certs pointing to the $ATTEST_FILE and $PUBKEY_FILE artifacts." 

# Keep artifacts for inspection
echo "PoC artifacts preserved in $TMPDIR (cleanup manually)"
exit 0
