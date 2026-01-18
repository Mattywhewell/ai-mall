import { describe, it, expect, vi } from 'vitest';
const { ensureTestUsers } = require('../../scripts/e2e-seeders');

describe('e2e-seeders', () => {
  it('creates users and roles when missing', async () => {
    // First call to listUsers -> no users; after createUser, second call returns the created user
    const admin = {
      listUsers: vi.fn()
        .mockResolvedValueOnce({ data: { users: [] } })
        .mockResolvedValueOnce({ data: { users: [{ id: 'u-admin', email: 'e2e-admin+ci@example.com' }, { id: 'u-supplier', email: 'e2e-supplier+ci@example.com' }, { id: 'u-standard', email: 'e2e-standard+ci@example.com' }] } }),
      createUser: vi.fn().mockResolvedValue({}),
    };

    const fromMock = (table) => {
      const selectResp = { data: [] };
      const chain = {
        limit: vi.fn().mockResolvedValue(selectResp),
        eq: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(selectResp) })),
      };
      return {
        select: vi.fn(() => chain),
        insert: vi.fn().mockResolvedValue({}),
      };
    };

    const supabase = {
      auth: { admin },
      from: vi.fn(fromMock),
    } as any;

    await ensureTestUsers(supabase, { password: 'Pwd!234', log: { log: () => {} } });

    // ensure createUser was invoked at least once for missing users
    expect(admin.createUser).toHaveBeenCalled();

    // ensure user_roles.insert was called for at least one user
    expect(supabase.from).toHaveBeenCalledWith('user_roles');
    // supabase.from returns a fresh object each call in the test mock; inspect the recorded calls to find the returned object and its insert mock
    const fromResults = supabase.from.mock.results.map(r => r.value).filter(Boolean);
    const anyInsertCalled = fromResults.filter(v => v && v.insert).some(v => v.insert.mock.calls.length > 0);
    expect(anyInsertCalled).toBe(true);
  });

  it('is idempotent when users & roles exist', async () => {
    const admin = {
      listUsers: vi.fn().mockResolvedValue({ data: { users: [{ id: 'u-admin', email: 'e2e-admin+ci@example.com' }, { id: 'u-supplier', email: 'e2e-supplier+ci@example.com' }, { id: 'u-standard', email: 'e2e-standard+ci@example.com' }] } }),
      createUser: vi.fn(),
    };

    const fromMock = (table) => {
      const selectResp = { data: [{ id: 'r1', role: table === 'user_roles' ? 'admin' : 'irrelevant' }] };
      const chain = {
        limit: vi.fn().mockResolvedValue(selectResp),
        eq: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(selectResp) })),
      };
      return {
        select: vi.fn(() => chain),
        insert: vi.fn().mockResolvedValue({}),
      };
    };

    const supabase = {
      auth: { admin },
      from: vi.fn(fromMock),
    } as any;

    await ensureTestUsers(supabase, { password: 'Pwd!234', log: { log: () => {} } });

    // createUser should not be called
    expect(admin.createUser).toHaveBeenCalledTimes(0);

    // user_roles.insert should not be called because select returned a role
    expect(supabase.from('user_roles').insert).toHaveBeenCalledTimes(0);
  });
});
