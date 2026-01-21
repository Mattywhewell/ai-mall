# Parser Heuristics Specification

Goal: map the decision tree into deterministic, automatable heuristics the parser can apply to introspection output to propose a classification and a confidence score.

Heuristic rules (ordered):
1. **Missing object detection** → if introspection finds references to an object name (type, table, column, function) that is reported as missing: propose **Additive**. Confidence: high if referenced directly in function/trigger body; medium if inferred from name patterns.
2. **Type mismatch / invalid reference** → if function/trigger/proc references an existing object but errors on type or signature mismatches: propose **Corrective**. Confidence: high when error lines contain mismatched type names.
3. **Policy/permission gaps** → missing RLS policy lines or functions that reference auth roles but policies absent: propose **Corrective** (unless policy removal is detected, then Destructive). Confidence: medium.
4. **Rename/drop detection** → if introspection shows object previously present (schema history) but now missing or renamed (e.g., referential mismatch), propose **Destructive** and flag for human triage. Confidence: low–medium; require historical evidence.
5. **Multi-step signals** → if a single finding includes both missing object creation and a subsequent incompatible ALTER/DROP in the same context, mark as **Ambiguous/Multi-step** and propose splitting into Additive + Corrective/Destructive parts. Confidence: low.

Confidence scoring (basic):
- High (80–100): direct evidence lines in logs showing explicit 'does not exist' or compile errors pointing to the object.
- Medium (50–79): indirect evidence (missing policy for role referenced, or function signature mismatch without explicit error context).
- Low (0–49): heuristic inference from names or historical differences that require human confirmation.

Output format (parser):
- { id, classification, confidence, evidence_snippet, suggested_action: Add/Create/Alter/Drop, reason }

Notes for implementers:
- Always include raw evidence (snippet and file/line) in the output to allow human review.
- When confidence < 70, mark finding as `needs-human-triage` and do not auto-propose a SQL patch.