# TPM & Hardware Policy Model (Scene 5C)

Purpose
- Document the deterministic policy selection and inheritance model used by the Scene 5 migration-arc tooling (attestation → verification → authorization).
- Provide a concise, machine-actionable contract for contributors and automation.

Where policies live
- Repo-level canonical templates: `scripts/migration-arc/policies/*.json`
  - e.g. `prod.json`, `dev.json`, `tpm.json`, `global.json`, `device-id.json`, `device-id.tpm.json`
- Test / runtime override (per-run or local): `$TEST_ROOT/etc/ssh/keys/hardware/<device>.json` and `<device>.<type>.json`

Precedence (higher overrides lower)
1. TEST-level device+type: `$TEST_ROOT/etc/ssh/keys/hardware/<device>.<type>.json`
2. TEST-level device: `$TEST_ROOT/etc/ssh/keys/hardware/<device>.json`
3. Repo-level device+type: `scripts/migration-arc/policies/<device>.<type>.json`
4. Repo-level environment: `scripts/migration-arc/policies/<env>.json` (env via `TEST_ENV`, default `dev`)
5. Repo-level type default: `scripts/migration-arc/policies/<type>.json` (e.g., `tpm.json`, `yubikey.json`)
6. Repo-level global: `scripts/migration-arc/policies/global.json` (lowest by default)

Merge semantics
- All candidate JSON files found (low→high precedence) are merged using jq object merge semantics.
- Keys present in higher-precedence files override lower-precedence values.
- This allows minimal device files to "overlay" a base environment or type file.

Policy shape
- Minimal policy JSON:
```json
{
  "mode": "strict",    // or "permissive" (default if unspecified is strict)
  "pcrs": { "0": "<hex>", "1": "<hex>" }
}
```
- `mode` controls PCR evaluation behaviour:
  - strict: any missing/mismatching PCR causes verification to fail.
  - permissive: log a `pcr_policy_mismatch` NDJSON event and continue (allow).

Behavioral contract & NDJSON events
- If expected PCRs file is malformed JSON → `malformed_expected_pcrs` (fail) and verifier exits nonzero.
- On PCR mismatch:
  - strict → `pcr_policy_failed` (fail)
  - permissive → `pcr_policy_mismatch` (warn and continue)
- Missing PCR entries in attestation → `pcr_missing` (treated per `mode`).
- Attestation verification emits `step=attestation_verify` NDJSON events for observability.

Multi-hardware selection
- Attestation's `type` field (e.g. `tpm`, `yubikey`, `pkcs11`) is used to prefer `<device>.<type>.json` and `<type>.json` templates.
- This empowers different policy defaults per hardware category without changing the verification engine.

Tests & How to validate
- Unit/integration tests (examples):
  - `scripts/migration-arc/tests/test_pcr_policy_templates.sh` — strict/permissive/malformed tests (hermetic: fakes `tpm2_checkquote`).
  - `scripts/migration-arc/tests/test_policy_inheritance.sh` — policy precedence, device+type selection, and merge tests (mock verifier captures final effective policy).
- To run locally (Linux/WSL with `jq`):
  - bash scripts/migration-arc/tests/test_pcr_policy_templates.sh
  - bash scripts/migration-arc/tests/test_policy_inheritance.sh

Notes & next steps
- `global.json` is intentionally lowest precedence; if an administrative/global override policy is desired, flip its precedence and add a test.
- CI: Add a small Linux job that runs the `scripts/migration-arc/tests/*.sh` to start validating policy behavior in PRs.
- Future work: expose policy evaluation logs to the telemetry channel, and add templates for YubiKey and PKCS#11.

---
Small, clear, and test-backed — this document is the source of truth for Scene 5C policy semantics.
