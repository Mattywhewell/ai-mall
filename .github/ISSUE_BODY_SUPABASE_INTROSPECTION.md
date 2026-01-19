## Supabase Introspection Artifact Attached 📦

**Timestamp:** <insert timestamp>

**Environment used:**
- Host: <supabase-host>
- Command: <exact command used>
- Runner: local / VM / self-hosted

**Artifact:**
<paste the zip or gist/release link here>

**Key signals from logs:**
- dbconnect: <e.g., ETIMEDOUT / OK>
- introspect: <e.g., exec_sql missing / schema-cache delay / OK>

---

### SQL Patch Checklist (DB team) ✅
- [ ] Parse the introspection outputs (functions, triggers, columns, dependencies).
- [ ] List any objects referencing `user_role` and note the exact dependency chain.
- [ ] Identify broken functions/triggers referencing dropped columns or enums.
- [ ] Create idempotent SQL patches: use `DO $$ BEGIN IF NOT ... THEN ... END IF; END $$;` patterns where possible.
- [ ] Add RLS/grant fixes (e.g., enable RLS + restrictive policies) and test admin role bypass where required.
- [ ] Run patches in a staging DB and validate: re-run `introspect-local.sh` and confirm no remaining references.
- [ ] Run `scripts/local-create-user.js` (admin createUser) to verify no 500s.
- [ ] Open a PR containing SQL migrations + small test(s) and reference this issue.
- [ ] Include rollback steps in PR description.

**Requested next steps:**
- Attach artifact zip or gist link to this issue; tag @db-team when ready for triage.
