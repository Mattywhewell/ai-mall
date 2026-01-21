# Activation checklist — Parser-output validation workflow

Purpose: a short checklist to enable automated validation of parser 'findings JSON' artifacts when an introspection artifact is available.

This checklist helps you enable and run the ready-to-apply validation workflow when an introspection artifact is available.

1. Review the workflow file: `.github/workflows/validate-parser-output.yml` (already present). ✅

2. Decide how you will host the findings JSON:
   - Upload `introspection-findings.json` as a release asset, or
   - Host it as a raw gist (preferred for quick manual runs), or
   - Upload it somewhere accessible via a public URL.

3. Run the workflow (manual / `Run workflow` button in Actions):
   - Inputs:
     - `findings_url`: public raw URL to `introspection-findings.json`
     - `issue_number` (optional): an issue number to receive a short confirmation comment.
   - The workflow will:
     - download the JSON
     - run `python scripts/validate_parser_output.py introspection-findings.json`
     - post a comment to the issue when `issue_number` is provided and validation succeeds

4. If you want automatic validation on every new release/artifact (optional):
   - Use the provided release-triggered workflow: `.github/workflows/validate-parser-output-on-release.yml` (it triggers on `release.published`, finds an asset named `introspection-findings*`, downloads it, and validates it automatically).
   - To activate: publish a release and include an asset named `introspection-findings.json` (or `introspection-findings-<suffix>.json`). The workflow will run automatically and post a short comment to the release with the result.

See also: `docs/FUTURE_EXTENSION_PATH.md`.

For the longer-term roadmap (schema versioning, multi-stream validation, and sequencer dry-run plans), see `docs/FUTURE_EXTENSION_PATH.md`.

5. If validation fails:
   - Review the error messages in the run logs
   - Fix the parser output or consult the parser spec: `docs/PARSER_OUTPUT_FORMAT.md`
   - Re-run the workflow with the corrected URL

6. When you're ready to fully automate:
   - Add a release-triggered step to fetch assets by name (optional)
   - Optionally, add an approval gate (e.g., require maintainer review for invalidating findings)

If you want, I can draft the release-triggered variant (asset-by-name handling) when you're ready to automate validation on publish. 🎯