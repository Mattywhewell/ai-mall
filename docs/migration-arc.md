# Migration Arc — Scene 1: The Wireless Awakening

This document summarizes how to run Scene 1 scripts for transforming a Lenovo dev-node to accept wireless, key-only SSH access with hardened, idempotent rituals.

Quick start
-----------
1. Check preflight: `scripts/migration-arc/preflight.sh`
2. Generate (or import) key: `scripts/migration-arc/generate_key.sh`
3. Install public key atomically: `scripts/migration-arc/install_key.sh` (set `PUBKEY_FILE` and `USER` as needed)
4. Patch sshd safely: `scripts/migration-arc/patch_sshd.sh` (supports `DRY_RUN=1`)
5. Start rollback timer: `scripts/migration-arc/rollback_timer.sh`
6. Validate from remote: `scripts/migration-arc/validate_ssh.sh`
7. On success: `touch /tmp/migration-ok` and remove rollback timer

Testing
-------
Run the idempotence smoke test locally (uses a temporary sandbox):

scripts/migration-arc/tests/test_idempotence.sh

Notes
-----
- All scripts log NDJSON lines to `$MIGRATION_LOG` (default `/var/log/migration-arc.ndjson`).
- Use `TEST_ROOT` and `DRY_RUN=1` when rehearsing on non-production machines.

Templates
---------
- `scripts/migration-arc/templates/autossh@.service` — systemd template for reverse SSH tunnels (Scene 5).

Safety & Rollback
-----------------
- Each mutating script creates a timestamped backup (e.g., sshd_config.bak.<ts>).
- A short-lived rollback timer is recommended during initial rollout. See `rollback_timer.sh`.

Next steps
----------
- Scene 2 (Key Ritual): integrate hardware-backed keys and consider SSH CA for scaled auth.
- Scene 5 (Global Reachability): choose between WireGuard, Tailscale, reverse SSH, or Cloudflare Tunnel.
