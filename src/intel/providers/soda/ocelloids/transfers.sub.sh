#!/usr/bin/env bash

set -eu
cd "$(dirname "$0")"
set -a; source ./.env.prod; set +a

curl 'https://api.ocelloids.net/subs' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer ${HYPERION_AUTH_TOKEN}" \
--data '{
    "id": "hyperion:transfers-all-networks",
    "agent": "transfers",
    "public": false,
    "args": {
		"networks": "*"
	},
	"channels": [
		{
			"type": "websocket"
		}
	]
}'

curl 'https://api.ocelloids.net/subs' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer ${HYPERION_AUTH_TOKEN}" \
--data '{
    "id": "hyperion:xc-all-networks",
    "agent": "crosschain",
    "public": false,
    "args": {
		"networks": "*"
	},
	"channels": [
		{
			"type": "websocket"
		}
	]
}'
