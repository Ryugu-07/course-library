#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SOURCE_HOME="${COURSE_SOURCE_HOME:-$HOME}"

sync_course() {
  local source="$1"
  local destination="$2"

  if [[ ! -d "$source" ]]; then
    echo "Missing source directory: $source" >&2
    exit 1
  fi

  mkdir -p "$destination"
  rsync -a --delete \
    --exclude='.git/' \
    --exclude='.DS_Store' \
    --include='.env.example' \
    --exclude='.env' \
    --exclude='.env.*' \
    --exclude='.venv/' \
    --exclude='venv/' \
    --exclude='node_modules/' \
    --exclude='__pycache__/' \
    --exclude='.pytest_cache/' \
    --exclude='.mypy_cache/' \
    --exclude='.ruff_cache/' \
    --exclude='labs/output/' \
    --exclude='output/' \
    --exclude='models/' \
    --exclude='checkpoints/' \
    --exclude='input/' \
    --exclude='temp/' \
    "$source/" "$destination/"
}

sync_course "$SOURCE_HOME/agent-lab" "$ROOT/agent-lab"
sync_course "$SOURCE_HOME/ai-course" "$ROOT/ai-course"
sync_course "$SOURCE_HOME/comfy-course" "$ROOT/comfyUI-course"
sync_course "$SOURCE_HOME/math-course" "$ROOT/math-course"
sync_course "$SOURCE_HOME/grad-math" "$ROOT/grad-math"
sync_course "$SOURCE_HOME/physics-course" "$ROOT/physics-course"
sync_course "$SOURCE_HOME/cs-course" "$ROOT/cs-course"

echo "Course files synchronized into $ROOT"
