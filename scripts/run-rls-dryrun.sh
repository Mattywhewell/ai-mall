#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1-}" ]; then
  echo "Usage: $0 <STAGING_DB_URL> [SQL_FILE]"
  exit 2
fi
DB_URL="$1"
SQL_FILE="${2-}"

if [ -z "$SQL_FILE" ]; then
  SQL_FILE="migrations/rls-fix-top5.sql"
fi

if [ ! -f "$SQL_FILE" ]; then
  echo "SQL file not found: $SQL_FILE"
  exit 2
fi

echo "*** DRY-RUN: wrapping $SQL_FILE in a transaction and performing ROLLBACK (no changes committed)"
(echo "BEGIN;"; cat "$SQL_FILE"; echo "ROLLBACK;") | psql "$DB_URL"

echo "*** Dry-run completed. Review output for errors and policy changes."

echo "Check RLS policies (example):"
psql "$DB_URL" -c "SELECT schemaname, tablename, policyname, permissive, roles, cmd FROM pg_policies ORDER BY tablename;"

exit 0
