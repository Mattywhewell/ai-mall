#!/usr/bin/env python3
import os, zipfile, json, sys
root=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'artifacts', 'playwright-report', 'test-results')
rows=[]
for entry in sorted(os.listdir(root)):
    if 'rbac-Role-Based-Access-Con' not in entry:
        continue
    d=os.path.join(root,entry)
    zipf=os.path.join(d,'trace.zip')
    if not os.path.isfile(zipf):
        continue
    probe_found=False
    cookie_on_probe=False
    server_log_present=False
    fallback_hit=False
    try:
        with zipfile.ZipFile(zipf) as z:
            for name in z.namelist():
                try:
                    data=z.read(name).decode('utf-8',errors='ignore')
                except Exception:
                    continue
                if '__ssr_probe=' in data:
                    probe_found=True
                if 'test_user' in data and '__ssr_probe' in data:
                    cookie_on_probe=True
                if 'CI: SSR initialUser' in data:
                    server_log_present=True
                if '/api/test/set-test-user' in data:
                    fallback_hit=True
                # fallback Set-Cookie in response headers
                if 'set-cookie' in data.lower() and 'test_user' in data:
                    fallback_hit=True
    except Exception as e:
        rows.append((entry,'error',str(e)))
        continue
    rows.append((entry,'yes' if probe_found else 'no','yes' if cookie_on_probe else 'no','yes' if server_log_present else 'no','yes' if fallback_hit else 'no'))

outf=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'artifacts', 'trace-scan-results.md')
with open(outf,'w',encoding='utf-8') as f:
    f.write('| test name | probe nav present? | cookie on probe? | server log? | fallback hit? |\n')
    f.write('|---|---:|---:|---:|---:|\n')
    for r in rows:
        if len(r)==5:
            f.write(f'| `{r[0]}` | {r[1]} | {r[2]} | {r[3]} | {r[4]} |\n')
        else:
            f.write(f'| `{r[0]}` | error | error | error | {r[1]} |\n')
print('WROTE',outf)
print('ROWS',len(rows))
for r in rows:
    print(r)
