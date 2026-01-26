export function buildLogEntry({ attempt, attemptStart, workflowStart, prevAttemptTime, checkRuns }) {
  const sinceWorkflowStartMs = attemptStart - workflowStart;
  const sincePrevAttemptMs = attemptStart - prevAttemptTime;

  const observedChecks = (checkRuns || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    conclusion: c.conclusion,
    started_at: c.started_at,
    completed_at: c.completed_at,
    timeSinceStartedMs: c.started_at ? (attemptStart - Date.parse(c.started_at)) : null,
  }));

  const entry = {
    attempt,
    timestamp: new Date(attemptStart).toISOString(),
    sinceWorkflowStartMs,
    sincePrevAttemptMs,
    observedChecks,
    status: observedChecks.some((c: any) => c.name === 'sigv4-e2e' && c.conclusion === 'success') ? 'success' : 'pending',
  };

  return entry;
}
