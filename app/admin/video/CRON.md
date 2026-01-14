# Video Scheduler Cron

This endpoint runs the video scheduling job that toggles `is_active` on `video_assets` according to `schedule_start` and `schedule_end`.

Endpoint
- POST /api/cron/video-schedules

Security
- The endpoint supports a secret header: `X-Scheduler-Token` which should match the `VIDEO_SCHEDULER_TOKEN` environment variable.
- If `VIDEO_SCHEDULER_TOKEN` is not set, the endpoint will run without validation (a warning is logged). For production deployments you should set the env var.

GitHub Actions (recommended)
- Create the following repository secrets:
  - `SITE_URL` — base URL of your deployment (e.g., `https://aiverse.example.com`)
  - `VIDEO_SCHEDULER_TOKEN` — secret token

- A sample workflow is included at `.github/workflows/video-scheduler.yml` (runs every 5 minutes by default). It uses those secrets to POST to the endpoint with the required header.

Vercel (optional)
- You can use Vercel Scheduled Functions or an external scheduler to POST to `/api/cron/video-schedules` with the header `X-Scheduler-Token: <your-secret>`.
- If using Vercel, set `VIDEO_SCHEDULER_TOKEN` in the Environment Variables for your project.

Testing locally
- Run the following (if you set the env locally):
  curl -X POST http://localhost:3000/api/cron/video-schedules -H "X-Scheduler-Token: <token>"

Contact
- If you want me to also add a persistent job-run log (table + job-run-record) or set up retries and alerts, I can add that next.

Admin Run Endpoint
- POST /api/admin/video/run — trigger the scheduler from the admin UI.
- Admin-run from the admin UI now uses the current signed-in session; the server validates that the caller is an admin. The legacy `X-Admin-Token` header is no longer required for UI-triggered runs.