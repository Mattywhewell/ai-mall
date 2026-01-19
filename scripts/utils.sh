#!/usr/bin/env bash
# Shared script utilities for scripts in this repo
# - provides logging helpers and safe exit helpers

set -u

# Colors
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  BLUE='\033[0;34m'
  RESET='\033[0m'
else
  RED=''
  GREEN=''
  YELLOW=''
  BLUE=''
  RESET=''
fi

log() { echo -e "${BLUE}[INFO]${RESET} $*"; }
info() { echo -e "${GREEN}[OK]${RESET} $*"; }
warn() { echo -e "${YELLOW}[WARN]${RESET} $*"; }
err() { echo -e "${RED}[ERROR]${RESET} $*" >&2; }

# safe exit with message
die() { err "$*"; exit 1; }

# ensure command exists
require_cmd() { command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"; }
