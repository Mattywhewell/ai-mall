#!/usr/bin/env python3
"""Onboard service (CLI)
Reads an onboarding request JSON and verifies attestation then issues a short-lived JWT (RS256).
Emits NDJSON events into tmp/. No external Python deps required.
"""
import sys, json, os, subprocess, time, base64, tempfile
from pathlib import Path

OUTDIR = os.environ.get('OUTDIR', './tmp')
Path(OUTDIR).mkdir(parents=True, exist_ok=True)

def emit(obj):
    print(json.dumps(obj))
    sys.stdout.flush()

def run_verifier(lineage, attest):
    cmd = ['./scripts/tpm/beat5_verify_attestation.sh', '--lineage', lineage, '--attest', attest]
    try:
        subprocess.run(cmd, check=True)
        return True
    except subprocess.CalledProcessError as e:
        emit({'action':'onboarding_verify','status':'failed','step':'verifier','error':str(e)})
        return False

def ensure_ca():
    key = Path(OUTDIR) / 'onboard_ca.pem'
    pub = Path(OUTDIR) / 'onboard_ca.pub.pem'
    if not key.exists():
        subprocess.run(['ssh-keygen','-t','rsa','-b','2048','-f',str(key),'-N','', '-C','onboard-ca'], check=True)
        # extract PEM public key
        pub.write_bytes(Path(str(key)+'.pub').read_bytes())
    return key, pub

def base64url(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b'=').decode('ascii')

def make_jwt_rs256(payload: dict, ca_key: Path):
    header = {'alg':'RS256','typ':'JWT'}
    header_b = base64url(json.dumps(header, separators=(',',':')).encode('utf-8'))
    payload_b = base64url(json.dumps(payload, separators=(',',':')).encode('utf-8'))
    signing_input = f"{header_b}.{payload_b}".encode('utf-8')
    with tempfile.NamedTemporaryFile(delete=False) as fmsg:
        fmsg.write(signing_input)
        msgname = fmsg.name
    sigfile = tempfile.NamedTemporaryFile(delete=False)
    signame = sigfile.name
    sigfile.close()
    try:
        subprocess.run(['openssl','dgst','-sha256','-sign',str(ca_key),'-out',signame,msgname], check=True)
        sig = Path(signame).read_bytes()
        sig_b64 = base64url(sig)
        token = f"{header_b}.{payload_b}.{sig_b64}"
        return token
    finally:
        try:
            os.unlink(msgname)
            os.unlink(signame)
        except Exception:
            pass

def main():
    if len(sys.argv) < 2:
        print('Usage: onboard_service.py <request.json>')
        sys.exit(2)
    reqfile = Path(sys.argv[1])
    if not reqfile.exists():
        print('Request file missing', file=sys.stderr)
        sys.exit(2)
    req = json.loads(reqfile.read_text())
    device_id = req.get('device_id')
    attest = req.get('attest_log')
    lineage = req.get('lineage_log')

    emit({'action':'onboarding_receive','device_id':device_id,'request_file':str(reqfile),'ts':time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())})

    ok = run_verifier(lineage, attest)
    if not ok:
        emit({'action':'onboarding_issue','device_id':device_id,'status':'failed','reason':'verifier_failed'})
        sys.exit(1)

    # ensure CA
    ca_key, ca_pub = ensure_ca()

    # issue token
    iat = int(time.time())
    exp = iat + 15*60  # 15 minutes
    payload = {'device_id': device_id, 'iat': iat, 'exp': exp, 'scope': 'network:join'}
    token = make_jwt_rs256(payload, ca_key)
    token_file = Path(OUTDIR) / f'onboard_token_{time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())}.txt'
    token_file.write_text(token)

    emit({'action':'onboarding_verify','device_id':device_id,'result':'pass'})
    emit({'action':'onboarding_issue','device_id':device_id,'token_file':str(token_file),'ttl':'PT15M','status':'ok'})
    print(str(token_file))
    sys.exit(0)

if __name__ == '__main__':
    main()
