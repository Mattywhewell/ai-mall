#!/usr/bin/env bash
# Preflight collector for Migration Arc (Scene 1)
set -euo pipefail
source "$(dirname "$0")/lib/log.sh"
OUT=${OUT:-/var/run/migration-arc/preflight.json}
TEST_ROOT=${TEST_ROOT:-}

migration_log "step=preflight" "action=start"
mkdir -p "$(dirname "$OUT")"

cat > "$OUT" <<EOF
{
  "ts":"$(date -Iseconds)",
  "hostname":"$(hostname --fqdn 2>/dev/null || hostname)",
  "user":"$(whoami)",
  "interfaces":$(ip -j addr 2>/dev/null || echo "[]"),
  "wifi_profiles":$(nmcli -t -f NAME connection show 2>/dev/null | jq -R -s -c 'split("\n")[:-1]' 2>/dev/null || echo "[]"),
  "sshd_config_exists":$( [ -f "/etc/ssh/sshd_config" ] && echo true || echo false )
}
EOF

migration_log "step=preflight" "action=done" "out=$OUT"

echo "Preflight saved: $OUT"