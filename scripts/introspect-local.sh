#!/usr/bin/env bash
# Convenience wrapper to run introspection locally (no uploads)
# Usage: ./scripts/introspect-local.sh
set -euo pipefail
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOTENV_PATH=${DOTENV_PATH:-.env.local}
if [ -f "$DOTENV_PATH" ]; then
  export DOTENV_CONFIG_PATH="$DOTENV_PATH"
  echo "Loaded env from $DOTENV_PATH"
else
  echo "No $DOTENV_PATH found, relying on environment variables." >&2
fi
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG_DIR="$(pwd)/introspect-logs-${TIMESTAMP}"
mkdir -p "$LOG_DIR"

echo "🔧 Running SSL-enabled Postgres connect test..."
node -r dotenv/config "$script_dir/ci-supabase-dbconnect.js" > "$LOG_DIR/dbconnect.log" 2>&1 || echo "-- dbconnect exited non-zero; see $LOG_DIR/dbconnect.log"

echo "🔍 Running Supabase introspection..."
(node -r dotenv/config "$script_dir/ci-supabase-introspect.js" 2>&1 | tee "$LOG_DIR/supabase-introspect.log") || echo "-- introspect finished with errors; see logs"

# Copy helpful context files
cp "$script_dir/../supabase-auth-fixes.sql" "$LOG_DIR/" 2>/dev/null || true
cp "$script_dir/ci-supabase-introspect.js" "$LOG_DIR/" 2>/dev/null || true

# Create zip
ZIPPATH="$(pwd)/supabase-migrations-logs-${TIMESTAMP}.zip"
if command -v zip >/dev/null 2>&1; then
  zip -r "$ZIPPATH" "$LOG_DIR" >/dev/null 2>&1 || echo "zip failed"
else
  python - <<PY
import shutil
shutil.make_archive(r"supabase-migrations-logs-${TIMESTAMP}", 'zip', r"${LOG_DIR}")
print('Created zip via python')
PY
  ZIPPATH="$(pwd)/supabase-migrations-logs-${TIMESTAMP}.zip"
fi

echo "📦 Introspection logs packaged at: $ZIPPATH"

echo "Expected outputs (short):"
echo " - $LOG_DIR/dbconnect.log    (SSL OK or ETIMEDOUT)"
echo " - $LOG_DIR/supabase-introspect.log  (exec_sql available or schema-cache delay)"
echo " - $ZIPPATH"

echo "Done. Share $ZIPPATH with DB team (Issue template: 'Supabase Introspection Artifact Attached')"
exit 0
