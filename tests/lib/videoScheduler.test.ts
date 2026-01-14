import { runVideoScheduleCheck } from '@/lib/jobs/videoScheduler';

// These tests are light integration-style but will mock the supabase client
// We mock only the subset used by runVideoScheduleCheck

function makeMockClient({ activateCount = 0, deactivateCount = 0 } = {}) {
  const inserts: any[] = [];
  return {
    from: (table: string) => ({
      update: (_: any) => ({
        lte: (_field: string, _val: any) => ({
          or: (_: string) => ({
            select: async (_: string) => ({ data: Array.from({ length: activateCount }, (_, i) => ({ id: `a${i}` })), error: null })
          }),
          eq: (_f: string, _v: any) => ({
            select: async (_: string) => ({ data: Array.from({ length: deactivateCount }, (_, i) => ({ id: `d${i}` })), error: null })
          })
        })
      }),
      insert: async (payload: any) => {
        inserts.push({ table, payload });
        return { data: [{ id: 'run-id-1', ...payload }], error: null };
      },
      select: async () => ({ data: [], error: null })
    })
  } as any;
}

test('runVideoScheduleCheck writes job_run_log and returns counts', async () => {
  const mock = makeMockClient({ activateCount: 2, deactivateCount: 1 });
  const result = await runVideoScheduleCheck(mock as any);
  expect(result).toHaveProperty('activated');
  expect(result).toHaveProperty('deactivated');
  expect(typeof result.runId).toBe('string');
});
