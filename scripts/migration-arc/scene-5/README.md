Scene 5 — Hardware Awakening

This folder contains scripts and tests for Scene 5: device-anchored identities.

Overview
- `enroll_hardware.sh` — idempotent enrollment helper (TPM/YubiKey placeholder)
- `tests/test_scene5_hardware_integration.sh` — opt-in hardware integration tests (stubs used by default)

Usage
- Read `docs/migration-arc-scene-5.md` for goals and acceptance criteria.
- Use `TEST_ROOT` and `MIGRATION_LOG` for sandboxed runs (consistent with other migration-arc scripts).

Guiding principles
- Idempotence
- Observability (NDJSON logs)
- CI stubs by default; opt-in real hardware tests only when explicitly configured (e.g., `CI_RUN_SCENE5=true`).