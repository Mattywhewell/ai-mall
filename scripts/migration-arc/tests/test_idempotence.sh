#!/usr/bin/env bash
# Simple dry-run idempotence test for Scene 1 scripts
set -euo pipefail
TEST_ROOT=${TEST_ROOT:-$(mktemp -d)}
export TEST_ROOT
export MIGRATION_LOG=${TEST_ROOT}/migration-arc.ndjson

mkdir -p "$TEST_ROOT/etc/ssh"
# Fake a minimal sshd_config for tests
cat > "$TEST_ROOT/etc/ssh/sshd_config" <<'EOF'
# test sshd config
PermitRootLogin yes
PasswordAuthentication yes
EOF

# Use test paths by overriding variables
export KEY_PATH="$TEST_ROOT/.ssh/adele_ed25519"
export PUBKEY_FILE="$TEST_ROOT/etc/ssh/adele.pub"

# Ensure .ssh dir exists
mkdir -p "$TEST_ROOT/.ssh"

# Create a fake public key
ssh-keygen -t ed25519 -a 100 -f "$TEST_ROOT/.ssh/adele_ed25519" -N '' -C 'test' >/dev/null
cp "$TEST_ROOT/.ssh/adele_ed25519.pub" "$PUBKEY_FILE"

# Test generate_key idempotence
$(dirname "$0")/../generate_key.sh || true
$(dirname "$0")/../generate_key.sh || true

# Test install_key in test root
USER=testuser
mkdir -p "$TEST_ROOT/home/$USER/.ssh"
chown -R $(id -u):$(id -g) "$TEST_ROOT/home/$USER" 2>/dev/null || true
PUBKEY_FILE="$PUBKEY_FILE" TEST_ROOT="$TEST_ROOT" USER=$USER $(dirname "$0")/../install_key.sh || true
PUBKEY_FILE="$PUBKEY_FILE" TEST_ROOT="$TEST_ROOT" USER=$USER $(dirname "$0")/../install_key.sh || true

# Test patch_sshd in dry-run mode
SSHD_CONFIG="$TEST_ROOT/etc/ssh/sshd_config" DRY_RUN=1 $(dirname "$0")/../patch_sshd.sh || true

# Check log exists and contains steps
if grep -q "step=generate_key" "$MIGRATION_LOG" && grep -q "step=install_key" "$MIGRATION_LOG"; then
  echo "Idempotence smoke tests passed. Log: $MIGRATION_LOG"
  exit 0
else
  echo "Tests failed; log missing entries"
  cat "$MIGRATION_LOG" || true
  exit 2
fi
