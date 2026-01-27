#!/usr/bin/env python3
"""Return persistent signing handle from latest Beat2 lineage file (or empty string).
Usage: OUTDIR=tmp python3 scripts/tpm/get_sign_handle.py
"""
import json
import glob
import os
import sys

OUTDIR = os.environ.get('OUTDIR', 'tmp')
pattern = os.path.join(OUTDIR, 'tpm_beat2_*.ndjson')
files = sorted(glob.glob(pattern), reverse=True)
if not files:
    print('')
    sys.exit(0)

f = files[0]
with open(f) as fh:
    for line in fh:
        try:
            o = json.loads(line)
        except Exception:
            continue
        if o.get('key_type') == 'SIGNING':
            print(o.get('handle', ''))
            sys.exit(0)
print('')
