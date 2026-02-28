#!/usr/bin/env bash
set -euo pipefail

./scripts/sync-projects.sh
zola serve
