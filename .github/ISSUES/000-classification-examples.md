# Classification Examples Library

Purpose: provide real-world examples to illustrate Additive, Corrective, and Destructive classifications. Use these as copy-ready guidance for contributors and parsers.

Additive (create-only, low risk)
- Missing enum type referenced by functions: create enum (IF NOT EXISTS).
- Missing column present in application expectations, added with safe DEFAULT and NOT NULL handled via backfill.
- Missing index causing slow queries: CREATE INDEX CONCURRENTLY.
- Add RLS policy that is permissive and additive (doesn't remove existing permissions).
- Add a new table to store metadata used by new feature (no existing rows affected).

Corrective (modify without removal, medium risk)
- Alter a function body to use the correct enum or column types (no data removal).
- Update an RLS policy to include a missing check or to correct a condition.
- Add a NOT NULL constraint only after adding a safe default/backfill and verification.
- Alter a column type in compatible way (e.g., integer -> bigint with safe casting) and verify with tests.
- Fix a trigger function that references a removed helper — restore or rebind it to correct helper.

Destructive (removal/rename/data-transform, high risk)
- DROP column or table that still contains user data (requires backup).
- Rename a table used in many queries without providing an alias or compatibility layer.
- Replacing an enum by dropping and recreating it with different labels (may break existing data/funcs).
- Data purge or normalization that loses original values without archive/backups.
- Destructive policy changes that remove all access paths for a role.

Notes:
- If an example touches multiple classes (e.g., add + modify + drop), split into multiple patches and classify each part separately.
- Each example should accompany a short test plan and verification query when used in a PR.