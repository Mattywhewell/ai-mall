// Simple in-memory server-side test-user flag used by E2E/test-only endpoints and SSR.
// This is intentionally minimal: during test runs `npm run start` runs a single Node process
// so a module-level variable is sufficient to hold transient state for the duration of the
// test-run. The flag is undefined when not set, a string role when explicitly set, and null
// when explicitly cleared by /api/test/clear-test-user.

let serverTestUser: string | null | undefined = undefined;

export function setServerTestUser(role: string) {
  serverTestUser = role;
  // eslint-disable-next-line no-console
  console.info('serverTestUser: set ->', role);
}

export function clearServerTestUser() {
  serverTestUser = null;
  // eslint-disable-next-line no-console
  console.info('serverTestUser: cleared');
}

export function getServerTestUser(): string | null | undefined {
  return serverTestUser;
}
