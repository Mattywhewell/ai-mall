# TPM Onboarding & Rejection Ritual 🔏

A concise reference for the Mobility onboarding flow (attestation → verification → issuance or rejection) and how to reproduce it locally and in CI.

## What is onboarding
- **Onboarding** verifies a device's TPM-based attestation and either issues a short-lived JWT (RS256) for network join or records a canonical rejection.
- The runtime artifacts are emitted as **NDJSON** to `./tmp/` and its `lineage/` subdirectory for auditability and CI artifact upload.

## Flow (high level)
1. Attestation capture (Beats 2–3): EK/AK keys, PCR snapshot, quote, nonce → `tpm_attest_*.ndjson`
2. Lineage registration (Beat 4): canonical `device_*` lineage → `lineage/device_*.full.ndjson`
3. Verification (Beat 5 / onboard_service): verify AK fingerprint and quote signature
   - If verification passes → issue JWT token → `onboard_token_*.txt` and emit `onboarding_issue` / `onboarding_verify` events
   - If verification fails → emit and persist a canonical `onboarding_reject` NDJSON line under `tmp/lineage/rejections_<ts>.ndjson`

## Rejection contract (canonical fields)
- Required fields: **ts**, **action** (`onboarding_reject`), **device_id**, **request_file**, **reason_code**, **reason_detail**, **evidence**, **severity**, **actor**, **workflow_run**, **trace_id**
- Severity domain: **`high`**, **`medium`**, **`low`** (normalized to `high` if unknown)
- Example reason codes: `attestation_verify_failed`, `token_issue_failed` (schema enforced by CI harness)

## How to reproduce
- Fast unit negative test (PR-level):

  OUTDIR=tmp ./scripts/tpm/test_onboarding_rejection_unit.sh

  This runs a minimal corrupt-attestation flow and validates the rejection schema via `scripts/tpm/assert_rejections_schema.sh`.

- Full hermetic E2E (swtpm) — runs in CI via `.github/workflows/tpm-e2e-swtpm.yml`:
  - Runs Beats 1–5 under `swtpm`, issues a TPM-backed SSH cert, performs onboarding, and runs a negative corrupt-attestation test.
  - Artifacts (including `tmp/lineage/rejections_*.ndjson`) are uploaded as `tpm-e2e-artifacts` for inspection.

## Where to look
- Code & scripts: `scripts/tpm/*`
- Unit test: `scripts/tpm/test_onboarding_rejection_unit.sh`
- Schema assertion: `scripts/tpm/assert_rejections_schema.sh`
- CI workflows: `.github/workflows/tpm-e2e-swtpm.yml`, `.github/workflows/tpm-onboarding-rejection-unit.yml`

---
Short, discoverable, and authoritative. Add this note to any PR that touches onboarding to keep future contributors oriented. ✨