#!/usr/bin/env bash
set -euo pipefail

URL="${URL:-https://assethub-polkadot.api.subscan.io/api/scan/accounts/merkle}"
: "${DATA_DIR:?DATA_DIR must be set in the environment}"
STATE_FILE="${DATA_DIR}/subscan_merkle.fingerprint"

mkdir -p "$DATA_DIR"

RESP=$(curl -s \
  -H "Content-Type: application/json" \
  -d '{"page":0,"row":1}' \
  "$URL")

FINGERPRINT=$(echo "$RESP" | jq -c '{
  count: .data.count,
  first: .data.list[0] | {
    address: .account.address,
    balance: .balance,
    locked: .locked,
    tag: .tag_name,
    type: .tag_type,
    subtype: .tag_sub_type
  }
}' | sha256sum | awk '{print $1}')

if [[ -f "$STATE_FILE" ]]; then
  OLD=$(cat "$STATE_FILE")
  if [[ "$FINGERPRINT" == "$OLD" ]]; then
    echo "No change"
    exit 10
  fi
fi

echo "Data changed"
echo "$FINGERPRINT" > "$STATE_FILE"
exit 0
