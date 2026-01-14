# Vercel Scheduled Invocation (sample)

Vercel supports scheduled function invocation via the dashboard or via a `vercel.json` configuration for some deployments. If your project supports it, you can add a scheduled job that POSTs to the cron endpoint.

Example (if your platform supports `crons` in `vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/video-schedules",
      "schedule": "*/5 * * * *",
      "timeZone": "UTC",
      "headers": {
        "X-Scheduler-Token": "${VIDEO_SCHEDULER_TOKEN}"
      }
    }
  ]
}
```

If your Vercel plan or setup doesn't support `vercel.json` cron configuration, use Vercel's dashboard or an external scheduler to POST to `/api/cron/video-schedules` and include the header `X-Scheduler-Token: <your-secret>`.

Remember to set `VIDEO_SCHEDULER_TOKEN` in the Vercel Environment Variables (Production) to secure the endpoint.