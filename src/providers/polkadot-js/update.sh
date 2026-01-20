#!/usr/bin/env bash
set -euo pipefail

# ----------------------
# Config
# ----------------------
JSDELIVR_URL="https://cdn.jsdelivr.net/gh/polkadot-js/phishing@master/address.json"
FILE_NAME="polkadot-phishing-addresses.json"

: "${DATA_DIR:?DATA_DIR must be set in the environment}"

WORK_FILE="$DATA_DIR/$FILE_NAME"
TMP_DIR="$DATA_DIR/.tmp_phishing"

mkdir -p "$DATA_DIR" "$TMP_DIR"

TMP_FILE="$TMP_DIR/$FILE_NAME"

# ----------------------
# Download latest
# ----------------------
echo "Fetching phishing list from jsDelivr..."
curl -fsSL "$JSDELIVR_URL" -o "$TMP_FILE"

# ----------------------
# First install
# ----------------------
if [[ ! -f "$WORK_FILE" ]]; then
  echo "No existing file found, installing..."
  mv "$TMP_FILE" "$WORK_FILE"
  exit 0
fi

# ----------------------
# Compare
# ----------------------
LOCAL_HASH=$(sha256sum "$WORK_FILE" | awk '{print $1}')
REMOTE_HASH=$(sha256sum "$TMP_FILE" | awk '{print $1}')

if [[ "$LOCAL_HASH" == "$REMOTE_HASH" ]]; then
  echo "No update detected"
  exit 10
fi

# ----------------------
# Update
# ----------------------
echo "Updating phishing list..."
mv "$TMP_FILE" "$WORK_FILE"

echo "Phishing list updated in $WORK_FILE"

exit 0
