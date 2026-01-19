#!/usr/bin/env bash
# One-shot VM script to run Supabase introspection, parse findings, and upload a GitHub release.
# Purpose: bootstrap a VM for short-lived introspection runs and artifact uploads.
# Usage on a fresh Ubuntu 22.04 VM (run as non-root user with sudo):
#   curl -fsSL https://raw.githubusercontent.com/Mattywhewell/ai-mall/main/scripts/run-introspect-vm.sh | bash -s -- <SUPABASE_DATABASE_URL> <NEXT_PUBLIC_SUPABASE_URL> <SUPABASE_SERVICE_ROLE_KEY> <GH_REPO>

set -euo pipefail
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ -f "$script_dir/utils.sh" ] && . "$script_dir/utils.sh"

SUPABASE_DB_URL=${1:-}
NEXT_PUBLIC_SUPABASE_URL_VAR=${2:-}
SUPABASE_SERVICE_ROLE_KEY_VAR=${3:-}
GH_REPO=${4:-"Mattywhewell/ai-mall"}

if [ -z "$SUPABASE_DB_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_URL_VAR" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY_VAR" ]; then
  echo "Usage: $0 <SUPABASE_DATABASE_URL> <NEXT_PUBLIC_SUPABASE_URL> <SUPABASE_SERVICE_ROLE_KEY> [GH_REPO]"
  echo "You can also run interactively by setting these env vars and re-running the script."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -y
sudo apt-get install -y curl unzip zip git build-essential ca-certificates

# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# GitHub CLI
if ! command -v gh >/dev/null 2>&1; then
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg >/dev/null 2>&1
  sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
  sudo apt-get update -y
  sudo apt-get install -y gh
fi

# Clone repo and branch
WORKDIR="$HOME/introspect-run-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$WORKDIR"
cd "$WORKDIR"

if [ ! -d ai-mall ]; then
  git clone https://github.com/Mattywhewell/ai-mall.git
fi
cd ai-mall
# Use the branch with the new tools
git fetch origin
git checkout chore/add-introspection-tools || true

# Install dependencies
npm ci --no-audit --no-fund

# Write .env.local (DO NOT COMMIT)
cat > .env.local <<EOF
SUPABASE_DATABASE_URL='${SUPABASE_DB_URL}'
NEXT_PUBLIC_SUPABASE_URL='${NEXT_PUBLIC_SUPABASE_URL_VAR}'
SUPABASE_SERVICE_ROLE_KEY='${SUPABASE_SERVICE_ROLE_KEY_VAR}'
EOF
chmod 600 .env.local

# Run introspection wrapper (creates a zip and prints path)
echo "Running introspection wrapper..."
./scripts/introspect-local.sh

# Find the generated zip file
ZIPPATH=$(ls -1 supabase-migrations-logs-*.zip 2>/dev/null | tail -n1 || true)
if [ -z "$ZIPPATH" ]; then
  echo "No zip was found in repo root; searching introspect-logs folder..."
  ZIPPATH=$(find . -maxdepth 2 -type f -name 'supabase-migrations-logs-*.zip' | tail -n1 || true)
fi
if [ -z "$ZIPPATH" ]; then
  echo "Could not find the zip artifact. Check logs in introspect-logs-* directories." >&2
  exit 2
fi

echo "Artifact created: $ZIPPATH"

# Parse introspection
TMPDIR=$(mktemp -d)
unzip -o "$ZIPPATH" -d "$TMPDIR" >/dev/null 2>&1 || true
# The introspect logs may be nested under a folder; find the folder that contains supabase-introspect.log
LOGDIR=$(find "$TMPDIR" -type f -name supabase-introspect.log -printf '%h\n' | head -n1)
if [ -z "$LOGDIR" ] || [ ! -f "$LOGDIR/supabase-introspect.log" ]; then
  LOGDIR="$TMPDIR"
fi
node scripts/parse-introspection.js "$LOGDIR"

# Upload release if GH_TOKEN provided or gh auth is configured
if [ -n "${GITHUB_TOKEN:-}" ] || gh auth status >/dev/null 2>&1; then
  TAG="introspect-$(date -u +%Y%m%dT%H%M%SZ)"
  echo "Creating GitHub release $TAG in $GH_REPO..."
  gh release create "$TAG" "$ZIPPATH" --repo "$GH_REPO" -t "Introspection logs $TAG" -n "Uploaded by run-introspect-vm.sh on $(date -u +%Y-%m-%dT%H:%M:%SZ)" && echo "Release created: $TAG"
else
  echo "GH credentials not found. To upload, either run 'gh auth login' or export GITHUB_TOKEN and re-run a release create command:" 
  echo "  gh release create <tag> $ZIPPATH --repo $GH_REPO -t 'Introspection' -n '...'
"
fi

# Print summary files
echo "Summary files:"
ls -1 introspection-findings.* || true

echo "Done. Upload the zip or paste the release/gist link in Issue #41 for DB team triage."

# Keep run directory for inspection
echo "Working dir retained at: $WORKDIR/ai-mall"
