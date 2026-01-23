// In-memory server-side test-user state used by E2E/test-only endpoints and SSR.
// Implemented as a map keyed by an optional owner token so parallel E2E workers can
// set/clear a test user without clobbering each other. The map's value contains the
// role (string) when set, null when explicitly cleared, and undefined when never set.

type OwnerKey = string;
const GLOBAL_KEY = '__global__';

const serverState = new Map<OwnerKey, { role: string | null | undefined, ts: number }>();

function nowTs() {
  return Date.now();
}

export function setServerTestUser(role: string, owner?: string) {
  const key = owner || GLOBAL_KEY;
  serverState.set(key, { role, ts: nowTs() });
  // eslint-disable-next-line no-console
  console.info('serverTestUser: set ->', { key, role });
}

export function clearServerTestUser(owner?: string) {
  const key = owner || GLOBAL_KEY;
  serverState.set(key, { role: null, ts: nowTs() });
  // eslint-disable-next-line no-console
  console.info('serverTestUser: cleared ->', { key });
}

export function getServerTestUser(owner?: string): string | null | undefined {
  const key = owner || GLOBAL_KEY;
  return serverState.get(key)?.role;
}
