#!/usr/bin/env bash
# Run Supabase introspection locally or on a VM and upload logs (via gh CLI release or gist).
# Purpose: wrapper to run dbconnect + introspect, package logs, and optionally upload to GitHub/Gist.
# Usage:
#   SUPABASE_DATABASE_URL=... GH_REPO=owner/repo GITHUB_TOKEN=... ./scripts/run-introspect-and-upload.sh
set -euo pipefail
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ -f "$script_dir/utils.sh" ] && . "$script_dir/utils.sh"
export DOTENV_PATH=${DOTENV_PATH:-.env.local}
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG_DIR="$(pwd)/introspect-logs-${TIMESTAMP}"
mkdir -p "$LOG_DIR"

echo "🔧 Running SSL-enabled Postgres connect test..."
if command -v node >/dev/null 2>&1; then
  NODE_OPTIONS='' node -r dotenv/config "$script_dir/ci-supabase-dbconnect.js" > "$LOG_DIR/dbconnect.log" 2>&1 || echo "-- dbconnect exited with non-zero; see $LOG_DIR/dbconnect.log"
else
  echo "Node.js not found in PATH. Install Node 18+ and retry." >&2
  exit 2
fi

echo "🔍 Running Supabase introspection..."
(node -r dotenv/config "$script_dir/ci-supabase-introspect.js" 2>&1 | tee "$LOG_DIR/supabase-introspect.log") || echo "-- introspect finished with errors; see logs"

# Copy helpful files for context
cp "$script_dir/../supabase-auth-fixes.sql" "$LOG_DIR/" 2>/dev/null || true
cp "$script_dir/ci-supabase-introspect.js" "$LOG_DIR/" 2>/dev/null || true

# Create zip
ZIPPATH="$LOG_DIR/supabase-migrations-logs-${TIMESTAMP}.zip"
( cd "$(dirname "$LOG_DIR")" && zip -r "$ZIPPATH" "$(basename "$LOG_DIR")" ) >/dev/null 2>&1 || {
  echo "⚠️  Failed to create zip using zip utility; attempting python fallback..."
  python - <<PY
import shutil, sys
shutil.make_archive(r"${LOG_DIR}/supabase-migrations-logs-${TIMESTAMP}", 'zip', r"${LOG_DIR}")
print('Created zip via python')
PY
  ZIPPATH="${LOG_DIR}/supabase-migrations-logs-${TIMESTAMP}.zip"
}

echo "📦 Logs packaged at: $ZIPPATH"

# Upload logic
if command -v gh >/dev/null 2>&1 && [ -n "${GH_REPO:-}" ] && ( [ -n "${GITHUB_TOKEN:-}" ] || [ -n "${GH_TOKEN:-}" ] ); then
  TAG="introspect-${TIMESTAMP}"
  echo "🚀 Creating GitHub release $TAG in $GH_REPO and uploading asset..."
  gh release create "$TAG" "$ZIPPATH" --repo "$GH_REPO" -t "Introspection logs $TAG" -n "Uploaded by run-introspect-and-upload.sh on ${TIMESTAMP}" && echo "✅ Release created: $TAG"
  exit 0
fi

if command -v gh >/dev/null 2>&1 && [ "${CREATE_GIST:-0}" = "1" ] && ( [ -n "${GITHUB_TOKEN:-}" ] || [ -n "${GH_TOKEN:-}" ] ); then
  echo "📝 Creating a gist with logs..."
  gh gist create "$LOG_DIR/supabase-introspect.log" "$LOG_DIR/dbconnect.log" "$LOG_DIR/supabase-auth-fixes.sql" --public && echo "✅ Gist created"
  exit 0
fi

echo "⚠️ No upload method configured. To upload:
  - Export GH_REPO='owner/repo' and GITHUB_TOKEN, or
  - Set CREATE_GIST=1 and GITHUB_TOKEN, or
  - Manually upload $ZIPPATH where you want."
exit 0
