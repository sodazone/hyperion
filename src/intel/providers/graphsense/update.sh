#!/usr/bin/env bash
set -euo pipefail

# ----------------------
# Config
# ----------------------
REPO_URL="https://github.com/graphsense/graphsense-tagpacks.git"
REPO_NAME="graphsense-tagpacks"

: "${DATA_DIR:?DATA_DIR must be set in the environment}"
ARCHIVE_DIR="${ARCHIVE_DIR:-$DATA_DIR/archive}"

WORK_DIR="$DATA_DIR/$REPO_NAME"
TMP_DIR="$DATA_DIR/.tmp_$REPO_NAME"

mkdir -p "$DATA_DIR" "$ARCHIVE_DIR"

# ----------------------
# Clone or fetch
# ----------------------
if [[ ! -d "$WORK_DIR/.git" ]]; then
  echo "Cloning GraphSense tag packs..."
  git clone --depth=1 "$REPO_URL" "$WORK_DIR"
  exit 0
fi

echo "Fetching updates..."
cd "$WORK_DIR"

git fetch origin main

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/main)

# ----------------------
# Compare
# ----------------------
if [[ "$LOCAL_HASH" == "$REMOTE_HASH" ]]; then
  echo "No update detected"
  exit 10
fi

# ----------------------
# Archive current version
# ----------------------
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_PATH="$ARCHIVE_DIR/${REPO_NAME}_${TIMESTAMP}.tar.gz"

echo "Archiving current version to $ARCHIVE_PATH"
tar -czf "$ARCHIVE_PATH" \
  --exclude=".git" \
  -C "$DATA_DIR" "$REPO_NAME"

# ----------------------
# Update
# ----------------------
echo "Updating tag packs..."
git reset --hard origin/main

echo "GraphSense tag packs updated in $WORK_DIR"

exit 0
