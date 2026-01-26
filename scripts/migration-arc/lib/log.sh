#!/usr/bin/env bash
# migration-arc logging helper - writes NDJSON lines to MIGRATION_LOG (default /var/log/migration-arc.ndjson)
set -euo pipefail
MIGRATION_LOG=${MIGRATION_LOG:-/var/log/migration-arc.ndjson}

migration_log(){
  # Accept either a JSON string or key=value pairs
  if [ $# -eq 0 ]; then
    echo "{\"ts\":\"$(date -Iseconds)\",\"msg\":\"noop\"}" >> "$MIGRATION_LOG"
    return 0
  fi
  # If single arg and looks like JSON, pass-through
  if [ $# -eq 1 ] && [[ "$1" =~ ^\{.*\}$ ]]; then
    jq -c ". + {\"ts\": \"$(date -Iseconds)\"}" <<<"$1" >> "$MIGRATION_LOG"
    return 0
  fi
  # Otherwise assume key=value pairs
  local json="{\"ts\":\"$(date -Iseconds)\""
  for kv in "$@"; do
    key=${kv%%=*}
    val=${kv#*=}
    json+=", \"$key\": \"$val\""
  done
  json+="}"
  echo "$json" >> "$MIGRATION_LOG"
}

# For dry-run / debugging, print a newline to stdout when MIGRATION_LOG is not writable
if [ ! -w "$(dirname "$MIGRATION_LOG")" ] 2>/dev/null; then
  MIGRATION_LOG=${MIGRATION_LOG:-/tmp/migration-arc.ndjson}
fi
