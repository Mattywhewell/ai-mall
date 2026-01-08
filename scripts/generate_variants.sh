#!/usr/bin/env bash
# Generate stylistic variants for citizen portraits using Replicate (example)
# Requires: REPLICATE_API_TOKEN env var set. Adjust MODEL and payload to your provider.

set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROMPTS_FILE="$ROOT_DIR/design/citizen-prompts.md"
VARIANTS_MD="$ROOT_DIR/design/citizen-variants.md"
OUTPUT_BASE="$ROOT_DIR/public/citizens/variants"
mkdir -p "$OUTPUT_BASE"

if [ -z "$REPLICATE_API_TOKEN" ]; then
  echo "Please set REPLICATE_API_TOKEN environment variable."
  exit 1
fi

# Replace this with your chosen model version
MODEL="stability-ai/stable-diffusion-xl-beta"

# Read variant styles from citizen-variants.md by parsing headings (simple heuristic)
styles=("illustrated" "painterly" "isometric")

# Simple parser to extract base prompts blocks (same approach used earlier)
awk '/^## /{i++}{if(i>0)print > ("/tmp/prompt_" i ".md")}' "$PROMPTS_FILE"

for style in "${styles[@]}"; do
  out_dir="$OUTPUT_BASE/$style"
  mkdir -p "$out_dir"
  for f in /tmp/prompt_*.md; do
    idx=$(basename "$f" | sed -E 's/prompt_([0-9]+).md/\1/')
    base_prompt=$(sed -n '2p' "$f")
    prompt="${base_prompt} + ${style}"

    echo "Generating variant: citizen-${idx} -- ${style}"

    curl -s -X POST "https://api.replicate.com/v1/predictions" \
      -H "Authorization: Token $REPLICATE_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"version\": \"$MODEL\", \"input\": {\"prompt\": \"${prompt//\"/\\\"}\", \"aspect_ratio\": \"3:4\", \"width\": 1600, \"height\": 2133}}" \
      | jq -r '.output[0]' > "$out_dir/citizen-${idx}--${style}.png"

    echo "Saved $out_dir/citizen-${idx}--${style}.png"
    sleep 1
  done
done

echo "Variant generation complete."
