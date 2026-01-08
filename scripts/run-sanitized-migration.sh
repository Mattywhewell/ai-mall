#!/usr/bin/env bash
# Bash script to safely run sanitized SQL migration
# Usage: PGHOST=localhost PGUSER=postgres PGPASSWORD=pass PGDATABASE=db ./scripts/run-sanitized-migration.sh
set -euo pipefail
SCRIPT_DIR=$(dirname "$0")
MIGRATION="$SCRIPT_DIR/../migrations/supabase-new-features-migration-sanitized.sql"
if [ ! -f "$MIGRATION" ]; then
  echo "Migration file not found: $MIGRATION" >&2
  exit 1
fi
# Safety: ensure no TS/JS markers
if grep -nE "^\s*export\b|^\s*//" "$MIGRATION" >/dev/null; then
  echo "Migration file contains non-SQL content. Aborting." >&2
  exit 1
fi

# Run psql with ON_ERROR_STOP
PGPASSWORD=${PGPASSWORD:-}
export PGPASSWORD
psql --set=ON_ERROR_STOP=on -h "${PGHOST:-localhost}" -U "${PGUSER:-postgres}" -d "${PGDATABASE:-postgres}" -f "$MIGRATION"

echo "Migration finished successfully."