# Parser output format (brief spec)

This document describes the minimal JSON contract (the "findings JSON") the sequencer expects from the parser output. See `docs/parser-output.schema.json` for the current schema (v1).

Supported top-level shapes:
- A JSON `list` of findings:
  [ { ... }, { ... } ]
- A JSON `object` with a `findings` array:
  { "findings": [ { ... } ] }

Minimal fields per finding (recommended):
- `id` (string): unique identifier for the finding. If missing, the sequencer will generate a deterministic `auto_<hash>` id.
- `classification` (string): one of `Additive`, `Corrective`, `Destructive` (case-insensitive accepted).
- `confidence` (number): 0-100 confidence score.
- `impact` or `severity` (string): `low`, `medium`, or `high` (used to bias scheduling).
- `object_type` / `kind` (string): e.g., `table`, `function`, `type`, `index`.
- `schema` (string): schema name (defaults to `public` if omitted).
- `object_name` / `name` (string): the name of the object the finding addresses.
- `dependencies` (array): objects or strings describing dependencies. Supported forms:
  - string: `schema.name` or `schema.name:kind` (e.g., `public.user_role:type`)
  - object: `{ "schema":"public", "name":"user_role", "kind":"type" }`
- `affects` / `creates` (array, optional): objects this patch will create or change (same forms as `dependencies`). If omitted, sequencer will attempt to infer from `object_name` and `schema`.
- `suggested_sql` (string, optional): suggested idempotent SQL patch for human review.
- `test_plan` (string, optional): high-level test instructions (used in PR templates).
- `reason` (string, optional): short human-friendly explanation.

Notes & behavior:
- The parser can include additional metadata; the sequencer ignores unknown fields.
- If `dependencies` point to objects not created by any finding, they are reported as `unmatched` (informing the operator that an external dependency exists).
- The sequencer normalizes `classification` to title-case and `impact` to lowercase.

Example finding:
{
  "id": "F-001",
  "classification": "Additive",
  "confidence": 95,
  "impact": "low",
  "object_type": "type",
  "schema": "public",
  "object_name": "user_role",
  "dependencies": [],
  "suggested_sql": "CREATE TYPE public.user_role AS ENUM ('admin','supplier','customer','ai_agent');",
  "reason": "Missing user_role enum in public schema"
}

Full parser output example (object wrapper):

```json
{
  "findings": [
    {
      "id": "F-001",
      "classification": "Additive",
      "confidence": 95,
      "impact": "low",
      "object_type": "type",
      "schema": "public",
      "object_name": "user_role",
      "dependencies": [],
      "suggested_sql": "CREATE TYPE public.user_role AS ENUM ('admin','supplier','customer','ai_agent');",
      "reason": "Missing user_role enum in public schema"
    },
    {
      "id": "F-002",
      "classification": "Corrective",
      "confidence": 90,
      "impact": "medium",
      "object_type": "function",
      "schema": "public",
      "object_name": "create_user",
      "dependencies": [
        { "schema": "public", "name": "user_role", "kind": "type" }
      ],
      "suggested_sql": "CREATE OR REPLACE FUNCTION public.create_user(...) RETURNS ...",
      "reason": "create_user expects user_role type to exist"
    }
  ]
}
```

Legacy field names (accepted)

| canonical | legacy |
|---|---|
| `object_name` | `name` |
| `impact` | `estimated_impact` |
| `affects` | `dependencies` |

Validation

You can validate parser output locally before running the sequencer:

```bash
python scripts/validate_parser_output.py <path-to-findings.json>
```

If you plan to extend the parser output, preserve these core fields so the sequencer can continue to operate deterministically.