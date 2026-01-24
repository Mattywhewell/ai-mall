import { describe, it, expect, beforeEach } from 'vitest';
import { setServerTestUser, clearServerTestUser, getServerTestUser } from '@/lib/testUserServerState';

describe('server test-user runtime flag', () => {
  beforeEach(() => {
    // reset by clearing explicitly
    clearServerTestUser();
  });

  it('is null after an explicit clear (test harness resets state via clear)', () => {
    const initial = getServerTestUser();
    // the test harness clears runtime state in beforeEach so we should observe an explicit null
    expect(initial).toBeNull();
  });

  it('setServerTestUser sets a role and getServerTestUser observes it', () => {
    setServerTestUser('citizen');
    expect(getServerTestUser()).toBe('citizen');
  });

  it('clearServerTestUser sets the flag to null (explicit clear)', () => {
    setServerTestUser('admin');
    expect(getServerTestUser()).toBe('admin');
    clearServerTestUser();
    expect(getServerTestUser()).toBeNull();
  });

  it('supports owner-scoped state so parallel workers do not clobber each other', () => {
    // global default should be independent of owner-scoped values
    expect(getServerTestUser()).toBeNull();
    setServerTestUser('citizen', 'owner-a');
    expect(getServerTestUser('owner-a')).toBe('citizen');
    expect(getServerTestUser('owner-b')).toBeUndefined();

    // clearing owner-a should not affect owner-b
    clearServerTestUser('owner-a');
    expect(getServerTestUser('owner-a')).toBeNull();
    expect(getServerTestUser('owner-b')).toBeUndefined();
  });
});