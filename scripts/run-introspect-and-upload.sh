#!/usr/bin/env bash
# Run Supabase introspection locally or on a VM and upload logs (via gh CLI release or gist).
# Purpose: wrapper to run dbconnect + introspect, package logs, and optionally upload to GitHub/Gist.
# Usage:
#   SUPABASE_DATABASE_URL=... GH_REPO=owner/repo GITHUB_TOKEN=... ./scripts/run-introspect-and-upload.sh
set -euo pipefail
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ -f "$script_dir/utils.sh" ] && . "$script_dir/utils.sh"
export DOTENV_PATH=${DOTENV_PATH:-.env.local}
# Simple flags: --env-file <path>, --dry-run
DRY_RUN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file) DOTENV_PATH="$2"; shift 2;;
    --dry-run) DRY_RUN=1; shift;;
    *) shift;;
  esac
done

# NDJSON logger
log_ndjson() {
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  level="$1"; msg="$2"; context="$3"
  if [ -z "$context" ]; then context='{}'; fi
  printf '{"ts":"%s","level":"%s","msg":"%s","context":%s}\n' "$ts" "$level" "$msg" "$context"
}

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG_DIR="$(pwd)/introspect-logs-${TIMESTAMP}"
mkdir -p "$LOG_DIR"

log_ndjson info "running_dbconnect_start" "{\"script\":\"ci-supabase-dbconnect\"}"
if command -v node >/dev/null 2>&1; then
  NODE_OPTIONS='' node -r dotenv/config "$script_dir/ci-supabase-dbconnect.js" > "$LOG_DIR/dbconnect.log" 2>&1 || log_ndjson warn "dbconnect_exit_nonzero" "{\"path\":\"$LOG_DIR/dbconnect.log\"}"
else
  log_ndjson error "node_not_found" "{\"hint\":\"Install Node 18+\"}"
  exit 2
fi

log_ndjson info "running_introspect_start" "{\"script\":\"ci-supabase-introspect\"}"
(node -r dotenv/config "$script_dir/ci-supabase-introspect.js" 2>&1 | tee "$LOG_DIR/supabase-introspect.log") || log_ndjson warn "introspect_finished_with_errors" "{\"path\":\"$LOG_DIR/supabase-introspect.log\"}"

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

log_ndjson info "logs_packaged" "{\"zip\":\"$ZIPPATH\"}"

# Upload logic
if [ "$DRY_RUN" -eq 1 ]; then
  log_ndjson info "dry_run_upload_skipped" "{\"zip\":\"$ZIPPATH\"}"
  exit 0
fi

if command -v gh >/dev/null 2>&1 && [ -n "${GH_REPO:-}" ] && ( [ -n "${GITHUB_TOKEN:-}" ] || [ -n "${GH_TOKEN:-}" ] ); then
  TAG="introspect-${TIMESTAMP}"
  log_ndjson info "creating_github_release" "{\"tag\":\"$TAG\",\"repo\":\"$GH_REPO\"}"
  gh release create "$TAG" "$ZIPPATH" --repo "$GH_REPO" -t "Introspection logs $TAG" -n "Uploaded by run-introspect-and-upload.sh on ${TIMESTAMP}" && log_ndjson info "release_created" "{\"tag\":\"$TAG\"}"
  exit 0
fi

if command -v gh >/dev/null 2>&1 && [ "${CREATE_GIST:-0}" = "1" ] && ( [ -n "${GITHUB_TOKEN:-}" ] || [ -n "${GH_TOKEN:-}" ] ); then
  log_ndjson info "creating_gist" "{\"files\": [\"supabase-introspect.log\",\"dbconnect.log\"]}"
  gh gist create "$LOG_DIR/supabase-introspect.log" "$LOG_DIR/dbconnect.log" "$LOG_DIR/supabase-auth-fixes.sql" --public && log_ndjson info "gist_created" "{}"
  exit 0
fi

log_ndjson warn "no_upload_method_configured" "{\"zip\":\"$ZIPPATH\"}"
log_ndjson info "upload_instructions" "{\"hint\":\"Export GH_REPO and set GITHUB_TOKEN, or set CREATE_GIST=1 and GITHUB_TOKEN\"}"
exit 0
