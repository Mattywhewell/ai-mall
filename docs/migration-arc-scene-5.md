# Scene 5 — The Hardware Awakening

## Goal
Move Alverse from simulated device identity to real hardware-anchored trust. Servers should be able to require cryptographic proof of hardware presence (TPM / YubiKey / HSM-backed private keys) when issuing or accepting SSH certificates.

## Why now
Scene 4 established a deterministic cert lifecycle and a revocation oracle. Scene 5 leverages that foundation and binds keys to a physical presence, preventing disk-resident key forging and enabling stronger device attestations.

## Success criteria
- A repeatable set of scripts to enroll hardware devices (TPM, YubiKey)
- A testable issuance flow that ties a cert to a hardware key or an attestation statement
- Server enforcement that can require hardware-bound keys (simulated & gated for CI)
- CI tests that exercise parsing, issuance, and revocation for hardware-bound certs where possible
- Documentation and migration notes for operators

## Milestones
1. Scaffolding: scripts, docs, tests (this commit)
2. TPM attestation prototype (software-only simulation + test harness)
3. YubiKey / PKCS#11 integration (ykman/pkcs11-tool usage examples)
4. Enforcer changes (sshd config + AuthorizedPrincipalsCommand enhancement to validate hardware binding)
5. End-to-end on a dev-node (manual gating with hardware present)

## Test matrix & CI strategy
- Unit-level parsing tests (run in CI)
- Simulated hardware tests (run in CI by default; these simulate hardware via stubs)
- Real hardware tests (opt-in via `CI_RUN_SCENE5=true` and runner with attached hardware; these are gated and must be enabled explicitly)

## Security & operational notes
- Never accept plaintext private keys in tests. Use simulated / stubbed hardware in CI.
- For real hardware jobs, require PR author sign-off and protected branch workflow (manual gate).
- Store no real hardware secrets in repository. Use environment variables or secrets only in guarded workflows.

## Next steps
- Implement TPM stub + unit tests
- Add YubiKey examples (ykman; PKCS#11)
- Add an `AuthorizedPrincipalsCommand` extension that fails principals unless the cert is hardware-bound per attestation

---
(See `scripts/migration-arc/scene-5/` for implementation scaffolding.)