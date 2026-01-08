#!/usr/bin/env bash
# Helper script to batch-generate citizen portraits using Replicate (example)
# Requires: REPLICATE_API_TOKEN env var set. Adjust model and params as needed.

set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROMPTS_FILE="$ROOT_DIR/design/citizen-prompts.md"
OUTPUT_DIR="$ROOT_DIR/public/citizens/hires"
mkdir -p "$OUTPUT_DIR"

if [ -z "$REPLICATE_API_TOKEN" ]; then
  echo "Please set REPLICATE_API_TOKEN environment variable."
  exit 1
fi

# This is a minimal example using Replicate's REST API for Stable Diffusion/SDXL.
# Replace model and input schema according to the model you use.

MODEL="stability-ai/stable-diffusion-xl-beta"

# Simple parser: extract prompts blocks by '##' headings and send one image per block
awk '/^## /{i++}{if(i>0)print > ("/tmp/prompt_" i ".md")}' "$PROMPTS_FILE"

for f in /tmp/prompt_*.md; do
  idx=$(basename "$f" | sed -E 's/prompt_([0-9]+).md/\1/')
  prompt=$(sed -n '2p' "$f")
  echo "Generating citizen-$idx from prompt: $prompt"

  # Example curl request (adjust model endpoint and payload to match provider)
  curl -s -X POST "https://api.replicate.com/v1/predictions" \
    -H "Authorization: Token $REPLICATE_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"version\": \"$MODEL\", \"input\": {\"prompt\": \"${prompt//\"/\\\"}\", \"aspect_ratio\": \"3:4\", \"width\": 1600, \"height\": 2133}}" \
    | jq -r '.output[0]' > "$OUTPUT_DIR/citizen-${idx}.png"

  echo "Saved to $OUTPUT_DIR/citizen-${idx}.png"
  sleep 1
done

echo "Done. Review images in $OUTPUT_DIR"
