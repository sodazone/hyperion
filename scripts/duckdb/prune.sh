#!/usr/bin/env bash

set -euo pipefail

RETENTION_INTERVAL="40 DAYS"
TABLES=(
    #"defi_volume_events"
    #"dex_liquidity_snapshots"
    #"money_market_health_snapshots"
    "crosschain_solvency_snapshots"
    "transfers"
)

if [ -z "${1:-}" ]; then
    echo "Error: Missing database path argument."
    echo "Usage: $0 <path_to_duckdb_file>"
    exit 1
fi

DB_PATH="$1"

echo "DuckDB prune"
echo "Database: $DB_PATH"
echo "Retention: $RETENTION_INTERVAL"
echo "-"

if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database file '$DB_PATH' not found."
    exit 1
fi


for table in "${TABLES[@]}"; do
    echo "Pruning: $table"
    duckdb "$DB_PATH" "SELECT COUNT(*) as Records FROM $table WHERE ts <= NOW() - INTERVAL $RETENTION_INTERVAL;"
    duckdb "$DB_PATH" "DELETE FROM $table WHERE ts <= NOW() - INTERVAL $RETENTION_INTERVAL;"
done

echo "Reclaiming disk space (VACUUM)"
duckdb "$DB_PATH" "VACUUM;"

echo "🎉 All done!"
