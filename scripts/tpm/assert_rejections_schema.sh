#!/usr/bin/env bash
# Minimal assertion harness for onboarding_reject NDJSON
# Usage: assert_rejections_schema.sh <expected_reason_code>
set -euo pipefail
EXPECTED_REASON=${1:-attestation_verify_failed}
shopt -s nullglob
# Wait a short while for the rejection file to be written to avoid micro-race flakiness
ATTEMPTS=6
DELAY=0.4
COUNT=0
FOUND=0
while [ "$COUNT" -lt "$ATTEMPTS" ]; do
  FILES=(tmp/lineage/rejections_*.ndjson)
  if [ ${#FILES[@]} -eq 0 ]; then
    sleep $DELAY
    COUNT=$((COUNT+1))
    continue
  fi
  FOUND=0
  for f in "${FILES[@]}"; do
    while IFS= read -r line; do
      # Validate required fields and exact reason_code
      if echo "$line" | jq -e --arg expected "$EXPECTED_REASON" '
      (.action == "onboarding_reject") and
      (has("reason_code") and .reason_code == $expected) and
      (has("trace_id") and (.trace_id | length > 0))' >/dev/null 2>&1; then
        FOUND=1
        break 2
      fi
    done < "$f"
  done
  if [ "$FOUND" -eq 1 ]; then
    break
  fi
  sleep $DELAY
  COUNT=$((COUNT+1))
done

if [ "$FOUND" -eq 1 ]; then
  echo "Found valid onboarding_reject with reason_code=$EXPECTED_REASON"
  exit 0
else
  echo "No valid onboarding_reject with reason_code=$EXPECTED_REASON found" >&2
  for f in "${FILES[@]}"; do
    echo "---- $f ----"
    sed -n '1,200p' "$f" || true
  done
  exit 1
fi