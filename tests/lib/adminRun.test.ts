import { POST as adminRunPost } from '@/app/api/admin/video/run/route';
import { vi, describe, it, expect } from 'vitest';

// Helper to make mock NextRequest-like object
function makeRequest(headers: Record<string, string> = {}, body: string = '{}') {
  return {
    headers: {
      get: (k: string) => headers[k.toLowerCase()] || null
    },
    text: async () => body
  } as any;
}

describe('Admin run audit logging', () => {
  it('attempts to insert admin_actions record when admin triggers run', async () => {
    // Mock requireAdmin to simulate an authenticated admin
    const roleMock = vi.spyOn(require('@/lib/auth/role-middleware'), 'requireAdmin').mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com', role: 'admin' }, error: null } as any);

    // Mock supabase client and its .from('admin_actions').insert call
    const insertSpy = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockClient = { from: (table: string) => ({ insert: insertSpy }) } as any;
    vi.spyOn(require('@/lib/supabase-server'), 'getSupabaseClient').mockReturnValue(mockClient as any);

    // Mock scheduler to avoid full run
    const schedulerMock = vi.spyOn(require('@/lib/jobs/videoScheduler'), 'runVideoScheduleCheck').mockResolvedValue({ activated: 0, deactivated: 0 });

    const req = makeRequest({ authorization: 'Bearer faketoken' }, '{}');
    const res = await adminRunPost(req as any);

    // Ensure scheduler ran and admin action was recorded
    expect(schedulerMock).toHaveBeenCalled();
    expect(insertSpy).toHaveBeenCalled();

    schedulerMock.mockRestore();
    roleMock.mockRestore();
  });
});
