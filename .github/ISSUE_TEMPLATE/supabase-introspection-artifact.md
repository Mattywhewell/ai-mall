---
name: "Supabase Introspection Artifact Attached"
about: "Attach Supabase introspection artifact for DB team review and patching"
title: "Supabase Introspection Artifact Attached"
labels: "db-team, introspection, schema-review"
assignees: "Mattywhewell"
---

## Supabase Introspection Artifact Attached 📦

**Timestamp:**  
<insert timestamp>

**Environment used:**
- Host: `<supabase-host>`
- Command: `<exact command used>`
- Runner: local / VM / self-hosted

**Artifact:**
<upload the zip or paste the gist/release link>

**Key signals from logs:**
- dbconnect: `<e.g., ETIMEDOUT / OK>`
- introspect: `<e.g., exec_sql missing / schema-cache delay / OK>`

**Requested next steps (DB team):**
- Parse introspection output
- Identify remaining references to `user_role`
- Prepare idempotent SQL patches
- Confirm no additional RLS or schema issues

---

> Tip: If GitHub Actions can't reach the DB, run these scripts on a cloud VM or a self-hosted runner, then attach the resulting zip to this issue for the DB team.

---

## Automated parsing (optional) 🔁

To trigger the automated parsing workflow:
- Upload the introspection zip as a GitHub **Release** (recommended) or host it at a reachable URL (gist or raw zip). **Do NOT include secrets** in the link or comment.
- Comment on this issue with the command:
  `/introspect <url>`
- The workflow will download the URL, run the parser, post a findings summary as a comment, upload parsed artifacts, and add labels `introspection` and `schema-review`.

Use this when you have the packaged artifact ready for DB review.
