#!/usr/bin/env python3
"""Tiny JWT acceptance server for CI tests.
Verifies RS256 JWTs signed by onboard CA (tmp/onboard_ca.pem public key).
"""
import http.server, socketserver, sys, json, base64, subprocess, os, time
from urllib.parse import urlparse

PORT = int(os.environ.get('ONBOARD_PORT','8080'))
OUTDIR = os.environ.get('OUTDIR','./tmp')
CA_PUB = os.path.join(OUTDIR, 'onboard_ca.pub.pem')

if not os.path.exists(CA_PUB):
    print('CA public key not found at', CA_PUB, file=sys.stderr)


def b64url_decode(s):
    s += '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s)

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != '/validate':
            self.send_response(404)
            self.end_headers()
            return
        auth = self.headers.get('Authorization','')
        if not auth.startswith('Bearer '):
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b'Unauthorized')
            return
        token = auth.split(' ',1)[1]
        parts = token.split('.')
        if len(parts) != 3:
            self.send_response(400)
            self.end_headers(); self.wfile.write(b'Bad token'); return
        header_b, payload_b, sig_b = parts
        msg = (header_b + '.' + payload_b).encode('utf-8')
        sig = b64url_decode(sig_b)
        with open('tmp/_jwt_msg.bin','wb') as f: f.write(msg)
        with open('tmp/_jwt_sig.bin','wb') as f: f.write(sig)
        # verify signature
        try:
            subprocess.run(['openssl','dgst','-sha256','-verify',CA_PUB,'-signature','tmp/_jwt_sig.bin','tmp/_jwt_msg.bin'], check=True)
        except subprocess.CalledProcessError:
            self.send_response(401); self.end_headers(); self.wfile.write(b'Invalid signature'); return
        # decode payload
        payload = json.loads(base64.urlsafe_b64decode(payload_b + '=' * (-len(payload_b)%4)).decode('utf-8'))
        now = int(time.time())
        if payload.get('exp',0) < now:
            self.send_response(401); self.end_headers(); self.wfile.write(b'Expired'); return
        # success
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'OK')

    def log_message(self, format, *args):
        # keep CI logs quiet
        sys.stderr.write("%s - - [%s] %s\n" % (self.client_address[0], self.log_date_time_string(), format%args))

if __name__ == '__main__':
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        print('Accept JWT server listening on', PORT)
        httpd.serve_forever()
