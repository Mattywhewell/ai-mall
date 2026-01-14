import { POST as cronPost } from '@/app/api/cron/video-schedules/route';
import { POST as adminRunPost } from '@/app/api/admin/video/run/route';
import { GET as adminJobsGet } from '@/app/api/admin/video/jobs/route';
import { computeHmacSignature } from '@/lib/security/schedulerAuth';
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

describe('Cron endpoint auth', () => {
  it('rejects when token mismatched', async () => {
    process.env.VIDEO_SCHEDULER_TOKEN = 'topsecret';

    const req = makeRequest({ 'x-scheduler-token': 'wrong' }, '{}');
    const res = await cronPost(req);
    expect((res as any).status).toBe(401);
  });

  it('accepts valid HMAC signature when configured', async () => {
    process.env.VIDEO_SCHEDULER_TOKEN = '';
    process.env.VIDEO_SCHEDULER_HMAC_SECRET = 'hmsecret';

    const body = JSON.stringify({});
    const sig = computeHmacSignature('hmsecret', body);

    // Mock the scheduler to avoid touching DB
    const schedulerMock = vi.spyOn(require('@/lib/jobs/videoScheduler'), 'runVideoScheduleCheck').mockResolvedValue({ activated: 0, deactivated: 0 });

    const req = makeRequest({ 'x-scheduler-signature': sig }, body);
    const res = await cronPost(req);

    expect((res as any).status).not.toBe(401);
    schedulerMock.mockRestore();
  });

  it('supports pagination and CSV export', async () => {
    // Mock createClient and its .from chain
    const mockChain = {
      range: async () => ({ data: [{ id: '1', job_name: 'video_schedules', started_at: new Date().toISOString(), finished_at: new Date().toISOString(), status: 'completed', activated_count: 1, deactivated_count: 0, error_message: null, metadata: null }], count: 1, error: null })
    } as any;

    const orSpy = vi.fn(() => mockChain);
    const mockOrder = {
      or: orSpy,
      range: mockChain.range
    } as any;

    const mockSelect = {
      order: () => mockOrder
    } as any;

    const mockFrom = {
      select: () => mockSelect
    } as any;

    const mockClient = { from: () => mockFrom } as any;
    vi.spyOn(require('@/lib/supabaseServer'), 'createClient').mockResolvedValue(mockClient);

    const req = makeRequest({}, '{}');
    // Build URL with query params (simulate request.url)
    (req as any).url = 'http://localhost/api/admin/video/jobs?page=1&per_page=10';
    const res = await adminJobsGet(req as any);
    const json = await (res as any).json?.() || res;
    expect(json.success).toBe(true);
    expect(json.logs.length).toBeGreaterThan(0);

    // CSV export
    (req as any).url = 'http://localhost/api/admin/video/jobs?page=1&per_page=10&export=csv';
    const csvRes = await adminJobsGet(req as any);
    const text = await csvRes.text();
    expect(text.includes('job_name')).toBe(true);

    // Search query should return filtered results (mock driven)
    (req as any).url = 'http://localhost/api/admin/video/jobs?page=1&per_page=10&q=video';
    const searchRes = await adminJobsGet(req as any);
    const searchJson = await (searchRes as any).json?.() || searchRes;
    expect(searchJson.success).toBe(true);
    expect(searchJson.logs.length).toBeGreaterThan(0);
    // Ensure our .or(...) branch was used for search
    expect(orSpy).toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});

describe('Admin run endpoint', () => {
  it('rejects when not authenticated as admin', async () => {
    // No authorization header provided
    const req = makeRequest({}, '{}');
    const res = await adminRunPost(req);
    expect((res as any).status).toBe(401);
  });

  it('runs scheduler when authenticated as admin', async () => {
    // Mock requireAdmin to simulate an authenticated admin
    const roleMock = vi.spyOn(require('@/lib/auth/role-middleware'), 'requireAdmin').mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com', role: 'admin' }, error: null } as any);
    const schedulerMock = vi.spyOn(require('@/lib/jobs/videoScheduler'), 'runVideoScheduleCheck').mockResolvedValue({ activated: 1, deactivated: 0 });

    const req = makeRequest({ authorization: 'Bearer faketoken' }, '{}');
    const res = await adminRunPost(req as any);

    expect((res as any).status).not.toBe(401);
    schedulerMock.mockRestore();
    roleMock.mockRestore();
  });
});
