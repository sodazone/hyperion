#!/usr/bin/env bash
set -euo pipefail

# ----------------------
# Config
# ----------------------
URL="${URL:-https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN_ADVANCED.ZIP}"

: "${DATA_DIR:?DATA_DIR must be set in the environment}"
ARCHIVE_DIR="${ARCHIVE_DIR:-$DATA_DIR/archive}"

NEW="$DATA_DIR/ofac_new.zip"
OLD="$DATA_DIR/ofac_old.zip"

mkdir -p "$DATA_DIR" "$ARCHIVE_DIR"

# ----------------------
# Download
# ----------------------
curl -fsSL "$URL" -o "$NEW"

# ----------------------
# Compare with old
# ----------------------
if [[ -f "$OLD" ]] && cmp -s "$NEW" "$OLD"; then
  echo "No update detected"
  rm "$NEW"
  exit 10
fi

# ----------------------
# Archive old version
# ----------------------
if [[ -f "$OLD" ]]; then
  cp "$OLD" "$ARCHIVE_DIR/ofac_$(date +%Y%m%d).zip"
fi

# ----------------------
# Replace old with new
# ----------------------
mv "$NEW" "$OLD"

# ----------------------
# Extract
# ----------------------
unzip -oq "$OLD" -d "$DATA_DIR"

echo "OFAC SDN updated in $DATA_DIR"

exit 0
