#!/usr/bin/env bash
# Unit-level negative-flow test for onboarding rejection schema
# - creates minimal attestation with invalid signature
# - creates simple lineage file
# - creates request JSON pointing to them
# - runs onboard_service.py and expects failure
# - runs assert_rejections_schema.sh to validate rejection content
set -euo pipefail
OUTDIR=${OUTDIR:-./tmp}
mkdir -p "$OUTDIR" "$OUTDIR/lineage"
TS=$(date -u +"%Y%m%dT%H%M%SZ")
ATTEST="$OUTDIR/tpm_attest_unit_$TS.ndjson"
LINEAGE="$OUTDIR/lineage/device_unit_$TS.full.ndjson"
REQ="$OUTDIR/onboarding_request_unit_$TS.json"

# generate an RSA key pair and use the public key in pem_b64
AK_PRIV="$OUTDIR/ak_unit_$TS.pem"
AK_PUB="$OUTDIR/ak_unit_$TS.pub.pem"
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$AK_PRIV" >/dev/null 2>&1
openssl pkey -in "$AK_PRIV" -pubout -out "$AK_PUB" >/dev/null 2>&1
AK_PEM_B64=$(base64 -w 0 "$AK_PUB")

# prepare quote message and an invalid signature (random bytes)
echo -n "unit-quote-message-$TS" > "$OUTDIR/quote_msg.bin"
MESSAGE_B64=$(base64 -w 0 "$OUTDIR/quote_msg.bin")
# create a random signature that will NOT verify (so verifier fails)
head -c 64 /dev/urandom > "$OUTDIR/quote_sig.bin"
SIG_B64=$(base64 -w 0 "$OUTDIR/quote_sig.bin")
NONCE_B64=$(head -c 16 /dev/urandom | base64 -w 0)

# write attestation NDJSON with ak_public, nonce, quote, and a pcr_snapshot
cat > "$ATTEST" <<EOF
{"action":"ak_public","pem_b64":"$AK_PEM_B64"}
{"action":"nonce","nonce_b64":"$NONCE_B64"}
{"action":"quote","message_b64":"$MESSAGE_B64","signature_b64":"$SIG_B64"}
{"action":"pcr_snapshot","bank":"sha256","index":0,"value":"0000000000000000000000000000000000000000000000000000000000000000"}
EOF

# write a minimal lineage file (device registration)
cat > "$LINEAGE" <<EOF
{"action":"identity_registered_full","device_id":"unit-device-$TS","ak_pub_b64":"$AK_PEM_B64"}
EOF

# request file pointing to our attestation & lineage
cat > "$REQ" <<EOF
{
  "ts": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "action": "onboarding_request",
  "device_id": "unit-device-$TS",
  "attest_log": "$ATTEST",
  "lineage_log": "$LINEAGE"
}
EOF

chmod +x scripts/tpm/onboard_service.py scripts/tpm/assert_rejections_schema.sh

# Run onboard service and expect failure
set +e
python3 scripts/tpm/onboard_service.py "$REQ"
RC=$?
set -e
if [ $RC -eq 0 ]; then
  echo "Onboarding unexpectedly succeeded in unit negative test" >&2
  exit 2
else
  echo "Onboard service failed as expected (rc=$RC)"
fi

# validate the rejection schema
./scripts/tpm/assert_rejections_schema.sh attestation_verify_failed

echo "Unit negative-flow test passed: rejection schema valid"
exit 0
