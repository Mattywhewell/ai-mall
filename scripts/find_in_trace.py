#!/usr/bin/env python3
import zipfile, sys
if len(sys.argv) < 3:
    print('Usage: find_in_trace.py <trace.zip> <pattern>')
    sys.exit(2)
zipf=sys.argv[1]
pat=sys.argv[2].lower()
print('Searching',zipf,'for',pat)
with zipfile.ZipFile(zipf) as z:
    for name in z.namelist():
        try:
            data=z.read(name).decode('utf-8',errors='ignore')
        except Exception:
            continue
        if pat in data.lower():
            print('\n--',name)
            for i,line in enumerate(data.splitlines()):
                if pat in line.lower():
                    start=max(0,i-3)
                    end=min(i+3,len(data.splitlines()))
                    for l in data.splitlines()[start:end]:
                        print(l)
                    break
