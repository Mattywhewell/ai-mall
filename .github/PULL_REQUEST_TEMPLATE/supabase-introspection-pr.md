Add Supabase introspection artifact for DB patching — includes dbconnect + schema logs for review.

<!--
Short description for the PR title (one line). Keep it exact and concise — this makes reviews and triage easier.
-->


**What this contains**
- Introspection artifact (zip) attached to the PR or linked in the description
- Brief notes about environment and commands used to generate the artifact

**How to generate an artifact**: See `docs/INTROSPECTION.md` — it describes how to run the introspection wrapper and produce the zip.

**How to trigger automated parsing**: after attaching the artifact, comment on the corresponding issue with `/introspect <url>` (or paste the release URL into the issue and run the command). The automated workflow will parse the artifact and post the findings back to the issue.

**Safety note:** Do **not** paste secrets (DB URLs, service role keys, or credentials) into PR comments or issue bodies. Use `.env.local` or secure secrets instead.

**Recommended reviewers**: @team-db, @team-ops
