PoC: Real TPM attestation (5C-1)

Purpose
-------
This PoC demonstrates detecting a TPM, creating a primary EK-like key, creating an AK, producing a quote over PCRs, and emitting an attestation JSON compatible with the simulator's artifact shape.

Quick start
-----------
1. Ensure `tpm2-tools`, `jq`, `openssl`, and `ssh-keygen` are installed on the host.
2. Attach/enable a TPM device (Raspberry Pi + discrete TPM module, laptop with TPM, etc.).
3. Run the PoC script:

   bash scripts/migration-arc/scene-5/enroll_tpm_real.sh /tmp/tpm-real-test real-device-tpm

4. Inspect the produced assets under `/tmp/tpm-real-test/etc/ssh/keys/hardware/attestations` and `/tmp/tpm-real-test/etc/ssh/keys/hardware`.

Notes
-----
- tpm2-tools versions differ; some flags used in the script may need adjustment for your environment.
- This is an exploratory PoC. It intentionally errors on unexpected states so the operator sees precise diagnostics.
- The produced quote is emitted as raw bytes and base64-encoded into the `attestation` JSON field; adapt the verifier as needed.

Next steps
----------
- Integrate with `verify_attestation.sh` to validate the real quote signature and PCR bindings.
- Add a manual acceptance test and iterate on edge cases (EK cert presence, platform EK, different AK algorithms).
