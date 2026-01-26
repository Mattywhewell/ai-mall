import { describe, it, expect } from 'vitest';
import { buildLogEntry } from '../../lib/verifier/logger';

describe('verifier logger', () => {
  it('builds a proper log entry with pending status', () => {
    const workflowStart = Date.now() - 5000;
    const attemptStart = Date.now();
    const prevAttemptTime = Date.now() - 3000;
    const checkRuns = [
      { id: 1, name: 'some-check', status: 'completed', conclusion: 'failure', started_at: new Date(Date.now() - 6000).toISOString(), completed_at: new Date(Date.now() - 5900).toISOString() }
    ];

    const entry = buildLogEntry({ attempt: 1, attemptStart, workflowStart, prevAttemptTime, checkRuns });

    expect(entry).toHaveProperty('attempt', 1);
    expect(entry).toHaveProperty('timestamp');
    expect(entry).toHaveProperty('sinceWorkflowStartMs');
    expect(entry).toHaveProperty('sincePrevAttemptMs');
    expect(entry.observedChecks).toHaveLength(1);
    expect(entry.status).toBe('pending');
  });

  it('marks success when sigv4-e2e success exists', () => {
    const workflowStart = Date.now() - 5000;
    const attemptStart = Date.now();
    const prevAttemptTime = Date.now() - 3000;
    const checkRuns = [
      { id: 2, name: 'sigv4-e2e', status: 'completed', conclusion: 'success', started_at: new Date(Date.now() - 2000).toISOString(), completed_at: new Date(Date.now() - 1000).toISOString() }
    ];

    const entry = buildLogEntry({ attempt: 2, attemptStart, workflowStart, prevAttemptTime, checkRuns });

    expect(entry.status).toBe('success');
    expect(entry.observedChecks[0].timeSinceStartedMs).not.toBeNull();
  });
});
