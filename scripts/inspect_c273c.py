import zipfile
z='tmp-ci-artifacts/21185953623/test-results/rbac-Role-Based-Access-Con-c273c--sees-standard-profile-tabs-chromium/trace.zip'
with zipfile.ZipFile(z) as f:
    for name in f.namelist():
        try:
            data=f.read(name).decode('utf-8',errors='ignore')
        except Exception:
            continue
        if '/api/test/set-test-user' in data or '/api/test/ssr-probe' in data or 'test/ssr-probe:' in data or 'probe request headers' in data or 'ensureTestUser' in data or 'CI: SSR initialUser' in data or '__ssr_probe' in data or 'test_user' in data:
            print('==',name)
            for line in data.splitlines():
                if '/api/test/set-test-user' in line or '/api/test/ssr-probe' in line or 'test/ssr-probe:' in line or 'probe request headers' in line or 'ensureTestUser' in line or 'CI: SSR initialUser' in line or '__ssr_probe' in line or 'test_user' in line:
                    print('  ',line.strip())
