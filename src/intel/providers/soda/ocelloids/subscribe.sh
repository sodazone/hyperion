#!/usr/bin/env bash

set -eu
cd "$(dirname "$0")"
set -a; source ./.env; set +a

if [ $# -eq 0 ]; then
    echo "Error: Please provide the path to the JSON data file." >&2
    echo "Usage: $0 <path_to_json_file>" >&2
    exit 1
fi

DATA_FILE="$1"

if [ ! -f "$DATA_FILE" ]; then
    echo "Error: File '$DATA_FILE' not found." >&2
    exit 1
fi

curl "${OC_HTTP_URL}/subs" \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer ${HYPERION_AUTH_TOKEN}" \
--data @"$DATA_FILE"
