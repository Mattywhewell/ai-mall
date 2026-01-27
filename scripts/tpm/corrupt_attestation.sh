#!/usr/bin/env bash
set -euo pipefail

# Corrupt the latest attestation bundle by flipping a byte in the quote signature.
OUTDIR="${OUTDIR:-./tmp}"
mkdir -p "$OUTDIR"
SRC=$(ls -1t "$OUTDIR"/tpm_attest_*.ndjson 2>/dev/null | head -n1 || true)
if [ -z "$SRC" ]; then echo "No attestation file found in $OUTDIR" >&2; exit 1; fi
TS=$(date -u +"%Y%m%dT%H%M%SZ")
DST="$OUTDIR/tpm_attest_corrupt_$TS.ndjson"

python3 - <<PY
import json,sys
src='$SRC'
dst='$DST'
with open(src) as fh, open(dst,'w') as out:
    for line in fh:
        try:
            o=json.loads(line)
        except Exception:
            out.write(line)
            continue
        if o.get('action')=='quote' and 'signature_b64' in o:
            import base64
            s=base64.b64decode(o['signature_b64'])
            if len(s)>0:
                s=bytes([s[0]^0xFF]) + s[1:]
            o['signature_b64']=base64.b64encode(s).decode('ascii')
            out.write(json.dumps(o)+"\n")
        else:
            out.write(json.dumps(o)+"\n")
print(dst)
PY

echo "$DST"
exit 0
