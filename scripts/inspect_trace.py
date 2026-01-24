#!/usr/bin/env python3
import zipfile, sys
if len(sys.argv) < 2:
    print('Usage: inspect_trace.py <trace.zip>'); sys.exit(2)
zipf = sys.argv[1]
keywords = ['CI: SSR initialUser','CI: SSR PROBE','test-user-server','data-role="admin"','x-e2e-ssr-probe','/api/test/set-test-user','set-cookie','__ssr_probe','__test_user']
print('Opening', zipf)
try:
    with zipfile.ZipFile(zipf) as z:
        for name in z.namelist():
            try:
                data=z.read(name).decode('utf-8',errors='ignore')
            except Exception:
                continue
            found=[k for k in keywords if k.lower() in data.lower()]
            if found:
                print('\n---',name,'contains',found)
                for k in found:
                    idx = data.lower().find(k.lower())
                    start=max(0,idx-200)
                    end=min(len(data), idx+200)
                    snippet = data[start:end].replace('\n','\\n')
                    print('  *',k, '->', snippet)
except Exception as e:
    print('Error reading zip', e)
