#!/usr/bin/env bash
# Minimal assertion harness for onboarding_reject NDJSON
# Usage: assert_rejections_schema.sh <expected_reason_code>
set -euo pipefail
EXPECTED_REASON=${1:-attestation_verify_failed}
shopt -s nullglob
FILES=(tmp/lineage/rejections_*.ndjson)
if [ ${#FILES[@]} -eq 0 ]; then
  echo "No rejection files found in tmp/lineage" >&2
  exit 1
fi
FOUND=0
for f in "${FILES[@]}"; do
  while IFS= read -r line; do
    # Validate required fields and exact reason_code
    if echo "$line" | jq -e --arg expected "$EXPECTED_REASON" '
      (has("ts") and .ts | type == "string") and
      (.action == "onboarding_reject") and
      (has("device_id") and (.device_id|type=="string" and (.device_id|length>0))) and
      (has("request_file")) and
      (has("reason_code") and .reason_code == $expected) and
      (has("reason_detail")) and
      (has("evidence")) and
      (has("severity") and (.severity|type=="string" and (.severity=="high" or .severity=="medium" or .severity=="low"))) and
      (has("actor") and (.actor|type=="string" and (.actor|length>0))) and
      (has("trace_id") and (.trace_id|type=="string" and (.trace_id|length>0)))' >/dev/null 2>&1; then
      FOUND=1
      break 2
    fi
  done < "$f"
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
