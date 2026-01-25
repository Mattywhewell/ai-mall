const http = require('http');
const nd = require('./scripts/ndjson-logger');

// Global safety handlers to ensure unexpected errors are logged in NDJSON
process.on('uncaughtException', (err) => {
  nd.log('error','uncaught_exception',{error: String(err && err.stack ? err.stack : err)});
  // give NDJSON a moment to flush
  setTimeout(() => process.exit(1), 50);
});
process.on('unhandledRejection', (reason) => {
  nd.log('error','unhandled_rejection',{reason: String(reason)});
  setTimeout(() => process.exit(1), 50);
});

// Probe configuration (override with env vars if needed)
// Try configured host, IPv6 loopback, and 127.0.0.1 to avoid binding/name-resolution races
const DEFAULT_HOST = process.env.COMMONS_HOST || 'localhost';
// Add '::1' so probes succeed when the server binds to IPv6 only (Windows/Node can do this)
const HOSTS = Array.from(new Set([DEFAULT_HOST, '::1', '127.0.0.1']));
const PORT = parseInt(process.env.COMMONS_PORT || '3000', 10);
const PATH = process.env.COMMONS_PATH || '/commons';
const MAX_ATTEMPTS = parseInt(process.env.MAX_ATTEMPTS || '10', 10);
const INITIAL_BACKOFF_MS = parseInt(process.env.INITIAL_BACKOFF_MS || '500', 10);
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '5000', 10);

const { exec } = require('child_process');

function collectDiagnostics(err, attempt) {
  try {
    if (process.platform === 'win32') {
      // Check port ownership and quick connectivity checks
      exec('netstat -ano | findstr :'+PORT, { windowsHide: true }, (e, stdout, stderr) => {
        nd.log('info','diag_netstat',{attempt, stdout: stdout ? stdout.trim() : '', stderr: stderr ? stderr.trim() : ''});
      });

      exec('powershell -NoProfile -Command "Test-NetConnection -ComputerName 127.0.0.1 -Port '+PORT+' -InformationLevel Detailed | ConvertTo-Json -Compress"', { windowsHide: true }, (e, stdout, stderr) => {
        nd.log('info','diag_test_netconnection',{attempt, stdout: stdout ? stdout.trim() : '', stderr: stderr ? stderr.trim() : ''});
      });

      exec('tasklist /FI "IMAGENAME eq node.exe" /FO LIST', { windowsHide: true }, (e, stdout, stderr) => {
        nd.log('info','diag_tasklist_node',{attempt, stdout: stdout ? stdout.trim() : '', stderr: stderr ? stderr.trim() : ''});
      });
    } else {
      exec('ss -ltnp | grep :'+PORT+' || netstat -anp | grep :'+PORT, { windowsHide: true }, (e, stdout, stderr) => {
        nd.log('info','diag_netstat',{attempt, stdout: stdout ? stdout.trim() : '', stderr: stderr ? stderr.trim() : ''});
      });
    }
  } catch (ex) {
    nd.log('warn','diag_failed',{attempt, err: String(ex && ex.stack ? ex.stack : ex)});
  }
}

function attemptFetch(attempt=1, hostIndex=0) {
  const HOST = HOSTS[hostIndex];
  nd.log('info','testing_commons_attempt',{attempt, host: HOST, hostIndex, port: PORT, path: PATH});

  const req = http.get({ host: HOST, port: PORT, path: PATH, timeout: REQUEST_TIMEOUT_MS }, (res) => {
    nd.log('info','Status',{status: res.statusCode, host: HOST});
    nd.log('info','Headers',{contentType: res.headers['content-type'], host: HOST});

    let data = '';
    res.on('data', (chunk) => { data += chunk; });

    res.on('end', () => {
      nd.log('info','response_received',{length: data.length, host: HOST});
      if (data.includes('SpatialCommons') || data.includes('spatial-environment')) {
        nd.log('info','commons_page_ok',{host: HOST});
        process.exit(0);
      } else {
        nd.log('warn','commons_page_maybe_broken',{host: HOST});
        process.exit(2);
      }
    });
  });

  req.on('error', (err) => {
    nd.log(attempt < MAX_ATTEMPTS ? 'warn' : 'error','connection_error',{
      attempt,
      host: HOST,
      hostIndex,
      message: err && err.message ? err.message : '',
      code: err && err.code ? err.code : null,
      errno: err && err.errno ? err.errno : null,
      syscall: err && err.syscall ? err.syscall : null,
      stack: err && err.stack ? err.stack : null
    });

    // Add quick environment diagnostics to help classify network errors (Windows-aware)
    collectDiagnostics(err, attempt);

    // If other hosts configured, try the next host immediately
    if (hostIndex < HOSTS.length - 1) {
      nd.log('info','switching_host',{from: HOSTS[hostIndex], to: HOSTS[hostIndex+1], attempt});
      setTimeout(() => attemptFetch(attempt, hostIndex + 1), 50);
      return;
    }

    if (attempt < MAX_ATTEMPTS) {
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      nd.log('info','retrying_commons',{nextAttemptInMs: backoff, attempt: attempt+1});
      setTimeout(() => attemptFetch(attempt + 1, 0), backoff);
    } else {
      process.exit(1);
    }
  });

  req.setTimeout(REQUEST_TIMEOUT_MS, () => {
    nd.log('warn','request_timeout',{attempt, host: HOST});
    req.destroy();

    if (hostIndex < HOSTS.length - 1) {
      nd.log('info','switching_host_after_timeout',{from: HOSTS[hostIndex], to: HOSTS[hostIndex+1], attempt});
      setTimeout(() => attemptFetch(attempt, hostIndex + 1), 50);
      return;
    }

    if (attempt < MAX_ATTEMPTS) {
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      nd.log('info','retrying_commons_timeout',{nextAttemptInMs: backoff, attempt: attempt+1});
      setTimeout(() => attemptFetch(attempt + 1, 0), backoff);
    } else {
      nd.log('error','request_timeout_final',{attempt});
      process.exit(1);
    }
  });
}

nd.log('info','Testing commons page - start',{hosts: HOSTS, port: PORT, path: PATH});
attemptFetch();