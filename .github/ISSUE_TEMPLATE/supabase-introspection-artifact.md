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
