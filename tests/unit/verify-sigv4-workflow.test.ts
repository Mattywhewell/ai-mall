import { readFileSync } from 'fs';
import { describe, it, expect } from 'vitest';

describe('SigV4 verifier workflow', () => {
  const wf = readFileSync('.github/workflows/verify-pr-sigv4-v2.yml', 'utf8');

  it('has a concurrency group to prevent overlapping verifier storms', () => {
    expect(wf).toContain('concurrency:');
    expect(wf).toContain('verify-sigv4-');
  });

  it('emits a structured summary artifact upload step', () => {
    expect(wf).toContain('Upload SigV4 verifier summary');
    expect(wf).toContain('actions/upload-artifact');
    expect(wf).toContain('sigv4-summary-*.json');
  });

  it('writes per-attempt NDJSON logs and uploads them', () => {
    expect(wf).toContain('verifier-log.ndjson');
    expect(wf).toContain('verifier-log');
    expect(wf).toContain('maxAttempts = 12');
  });
});