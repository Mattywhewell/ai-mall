#!/usr/bin/env python3
import os, zipfile, sys, json

def scan(root):
    rows=[]
    for entry in sorted(os.listdir(root)):
        if 'rbac-Role-Based-Access-Con' not in entry:
            continue
        d=os.path.join(root,entry)
        # Find trace.zip in directory or nested
        zipf=None
        for p in [os.path.join(d,'trace.zip'), os.path.join(d,'trace','trace.zip')]:
            if os.path.isfile(p):
                zipf=p
                break
        if not zipf:
            # also try to find any .zip within
            for fn in os.listdir(d):
                if fn.endswith('.zip'):
                    zipf=os.path.join(d,fn)
                    break
        if not zipf:
            rows.append((entry,'no-trace','no','no','no'))
            continue
        probe_found=False
        cookie_on_probe=False
        server_log_present=False
        fallback_hit=False
        probe_header_in_req=False
        try:
            with zipfile.ZipFile(zipf) as z:
                for name in z.namelist():
                    try:
                        data=z.read(name).decode('utf-8',errors='ignore')
                    except Exception:
                        continue
                    if '__ssr_probe=' in data or 'x-e2e-ssr-probe' in data:
                        probe_found=True
                    if 'test_user' in data and '__ssr_probe' in data:
                        cookie_on_probe=True
                    if 'CI: SSR initialUser' in data or 'CI: SSR PROBE RECEIVED' in data or 'CI: SSR PROBE' in data or 'test/ssr-probe:' in data or '/api/test/ssr-probe' in data:
                        server_log_present=True
                    if '/api/test/set-test-user' in data or '/api/test/ssr-probe' in data:
                        fallback_hit=True
                    if 'set-cookie' in data.lower() and 'test_user' in data:
                        fallback_hit=True
                    # request headers may include x-e2e-ssr-probe
                    if 'x-e2e-ssr-probe' in data.lower():
                        probe_header_in_req=True
        except Exception as e:
            rows.append((entry,'error',str(e)))
            continue
        rows.append((entry,'yes' if probe_found else 'no','yes' if cookie_on_probe else 'no','yes' if server_log_present else 'no','yes' if fallback_hit else 'no','yes' if probe_header_in_req else 'no'))
    return rows

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: scan_traces_ci.py <path-to-ci-artifacts-dir>')
        sys.exit(2)
    root=sys.argv[1]
    if not os.path.isdir(root):
        print('Dir not found',root); sys.exit(2)
    rows=scan(root)
    outf=os.path.join(root,'trace-scan-results-ci.md')
    with open(outf,'w',encoding='utf-8') as f:
        f.write('| test name | probe nav present? | cookie on probe? | server log? | fallback hit? | probe header in trace? |\n')
        f.write('|---|---:|---:|---:|---:|---:|\n')
        for r in rows:
            if len(r)==6:
                f.write(f'| `{r[0]}` | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} |\\n')
            else:
                f.write(f'| `{r[0]}` | error | error | error | {r[1]} |\\n')
    print('WROTE',outf)
    for r in rows:
        print(r)
