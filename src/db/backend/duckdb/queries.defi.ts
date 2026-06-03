export type DefiQueryParams = {
	bucket?: "day" | "hour";
	lookback?: number;
	protocol?: string;
	network?: string;
	marketId?: string;
	limit?: number;
};

export type DefiVolumeQueryParams = DefiQueryParams & {
	type: "dex" | "lending";
};

const VOLUME_FILTERS: Record<string, string> = {
	dex: "AND event_type = 'swap' AND direction = 'in'",
	lending: "AND event_type != 'swap'",
} as const;

export function generateDefiVolumeSeriesQuery({
	bucket = "day",
	lookback = 30,
	network,
	protocol,
	marketId,
	limit,
	type = "dex",
}: DefiVolumeQueryParams) {
	const isDay = bucket === "day";
	const castExpr = isDay ? "CAST(ts AS DATE)" : "DATE_TRUNC('hour', ts)";
	const startExpr = isDay
		? `CURRENT_DATE - INTERVAL '${lookback} days'`
		: `NOW() - INTERVAL '${lookback} hours'`;

	const networkFilter = network ? `AND network_id = '${network}'` : "";
	const protocolFilter = protocol ? `AND protocol = '${protocol}'` : "";
	const marketFilter = marketId ? `AND market_id = '${marketId}'` : "";
	const limitClause = limit ? `LIMIT ${limit}` : "";
	const eventTypeFilter = VOLUME_FILTERS[type];

	return `
WITH aggregated_volume AS (
  SELECT
    ${castExpr} AS timestamp,
    protocol,
    market_id,
    SUM(CASE WHEN event_type = 'swap' THEN amount_usd ELSE 0 END)AS swap_volume_usd,
    SUM(CASE WHEN event_type = 'borrow' THEN amount_usd ELSE 0 END) AS borrow_volume_usd,
    SUM(CASE WHEN event_type = 'repay' THEN amount_usd ELSE 0 END) AS repay_volume_usd,
    SUM(CASE WHEN event_type = 'withdraw' THEN amount_usd ELSE 0 END) AS withdraw_volume_usd,
    SUM(CASE WHEN event_type = 'liquidate' AND direction = 'debt' THEN amount_usd ELSE 0 END) AS liquidation_volume_usd
  FROM defi_volume_events
  WHERE
    ts >= ${startExpr}
    ${networkFilter}
    ${protocolFilter}
    ${marketFilter}
    ${eventTypeFilter}
  GROUP BY 1, 2, 3
)

SELECT
  timestamp,
  protocol,
  market_id,
  swap_volume_usd,
  borrow_volume_usd,
  repay_volume_usd,
  withdraw_volume_usd,
  liquidation_volume_usd,
FROM aggregated_volume
ORDER BY timestamp ASC
${limitClause};
`;
}

export function generateDefiVolumeQuery({
	bucket = "hour",
	lookback = 24,
	network,
	protocol,
	marketId,
	limit,
	type = "dex",
}: DefiVolumeQueryParams) {
	const intervalUnit = bucket === "day" ? "days" : "hours";
	const networkFilter = network ? `AND network_id = '${network}'` : "";
	const protocolFilter = protocol ? `AND protocol = '${protocol}'` : "";
	const marketFilter = marketId ? `AND market_id = '${marketId}'` : "";
	const limitClause = limit ? `LIMIT ${limit}` : "";
	const eventTypeFilter = VOLUME_FILTERS[type];

	return `
WITH volume_comparison AS (
  SELECT
    protocol,
    market_id,
    SUM(
      CASE
        WHEN ts >= NOW() - INTERVAL '${lookback} ${intervalUnit}'
        THEN CASE WHEN event_type = 'swap' THEN amount_usd ELSE 0 END
        ELSE 0
      END
    ) AS current_swap_volume_usd,
    SUM(
      CASE
        WHEN ts < NOW() - INTERVAL '${lookback} ${intervalUnit}'
         AND ts >= NOW() - INTERVAL '${lookback * 2} ${intervalUnit}'
        THEN CASE WHEN event_type = 'swap' THEN amount_usd ELSE 0 END
        ELSE 0
      END
    ) AS previous_swap_volume_usd,
    SUM(
      CASE
        WHEN ts >= NOW() - INTERVAL '${lookback} ${intervalUnit}'
        THEN CASE WHEN event_type = 'borrow' THEN amount_usd ELSE 0 END
        ELSE 0
      END
    ) AS current_borrow_volume_usd,
    SUM(
      CASE
        WHEN ts < NOW() - INTERVAL '${lookback} ${intervalUnit}'
         AND ts >= NOW() - INTERVAL '${lookback * 2} ${intervalUnit}'
        THEN CASE WHEN event_type = 'borrow' THEN amount_usd ELSE 0 END
        ELSE 0
      END
    ) AS previous_borrow_volume_usd,
    SUM(
      CASE
        WHEN ts >= NOW() - INTERVAL '${lookback} ${intervalUnit}'
        THEN CASE WHEN event_type = 'repay' THEN amount_usd ELSE 0 END
        ELSE 0
      END
    ) AS current_repay_volume_usd,
    SUM(
      CASE
        WHEN ts < NOW() - INTERVAL '${lookback} ${intervalUnit}'
         AND ts >= NOW() - INTERVAL '${lookback * 2} ${intervalUnit}'
        THEN CASE WHEN event_type = 'repay' THEN amount_usd ELSE 0 END
        ELSE 0
      END
    ) AS previous_repay_volume_usd,
    SUM(
      CASE
        WHEN ts >= NOW() - INTERVAL '${lookback} ${intervalUnit}'
        THEN CASE
          WHEN event_type = 'liquidate' AND direction = 'debt'
          THEN amount_usd ELSE 0 END
        ELSE 0
      END
    ) AS current_liquidation_volume_usd,
    SUM(
      CASE
        WHEN ts < NOW() - INTERVAL '${lookback} ${intervalUnit}'
         AND ts >= NOW() - INTERVAL '${lookback * 2} ${intervalUnit}'
        THEN CASE
          WHEN event_type = 'liquidate' AND direction = 'debt'
          THEN amount_usd ELSE 0 END
        ELSE 0
      END
    ) AS previous_liquidation_volume_usd
  FROM defi_volume_events
  WHERE
    ts >= NOW() - INTERVAL '${lookback * 2} ${intervalUnit}'
    ${networkFilter}
    ${protocolFilter}
    ${marketFilter}
    ${eventTypeFilter}
  GROUP BY 1, 2
)
SELECT *
FROM volume_comparison
ORDER BY current_swap_volume_usd DESC
${limitClause};
`;
}

export function generateDexLiquidityQuery({
	bucket = "day",
	lookback = 30,
	network,
	protocol,
	marketId,
}: DefiQueryParams) {
	const isDay = bucket === "day";
	const castExpr = isDay ? "CAST(ts AS DATE)" : "DATE_TRUNC('hour', ts)";
	const startExpr = isDay
		? `CURRENT_DATE - INTERVAL '${lookback} days'`
		: `NOW() - INTERVAL '${lookback} hours'`;

	const networkFilter = network ? `AND network_id = '${network}'` : "";
	const protocolFilter = protocol ? `AND protocol = '${protocol}'` : "";
	const marketFilter = marketId ? `AND market_id = '${marketId}'` : "";

	// We use arg_max(val, ts) to cleanly grab the last state sample in each time bucket window
	return `
WITH bucketed_states AS (
  SELECT
    ${castExpr} AS timestamp,
    protocol,
    market_id,
    any_value(label) as label,
    arg_max(supplied_usd, ts) AS supplied_usd
  FROM dex_liquidity_snapshots
  WHERE ts >= ${startExpr}
    ${networkFilter}
    ${protocolFilter}
    ${marketFilter}
  GROUP BY 1, 2, 3
),

calculated AS (
  SELECT
    timestamp,
    protocol,
    market_id,
    label,
    supplied_usd,
    supplied_usd
      - FIRST_VALUE(supplied_usd) OVER (
          PARTITION BY protocol, market_id
          ORDER BY timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) AS tvl_change_usd
  FROM bucketed_states
)

SELECT
  timestamp,
  protocol,
  market_id,
  label,
  supplied_usd,
  tvl_change_usd,
  SUM(supplied_usd) OVER (PARTITION BY timestamp) AS total_aggregate_tvl_usd
FROM calculated
ORDER BY timestamp ASC, supplied_usd DESC;
`;
}

export function generateMoneyMarketHealthQuery({
	bucket = "hour",
	lookback = 24,
	network,
	protocol,
	marketId,
}: DefiQueryParams) {
	const isDay = bucket === "day";
	const castExpr = isDay ? "CAST(ts AS DATE)" : "DATE_TRUNC('hour', ts)";
	const startExpr = isDay
		? `CURRENT_DATE - INTERVAL '${lookback} days'`
		: `NOW() - INTERVAL '${lookback} hours'`;

	const networkFilter = network ? `AND network_id = '${network}'` : "";
	const protocolFilter = protocol ? `AND protocol = '${protocol}'` : "";
	const marketFilter = marketId ? `AND market_id = '${marketId}'` : "";

	return `
SELECT
  ${castExpr}		 AS timestamp,
  protocol,
  market_id,
  any_value(label) AS label,
  arg_max(borrowed_usd, ts) AS borrowed_usd,
  arg_max(supplied_usd, ts) AS supplied_usd,
  arg_max(utilization, ts) AS utilization,
  arg_max(solvency_ratio, ts) AS solvency_ratio,
  arg_max(is_paused, ts) AS is_paused
FROM money_market_health_snapshots
WHERE ts >= ${startExpr}
  ${networkFilter}
  ${protocolFilter}
  ${marketFilter}
GROUP BY 1, 2, 3
ORDER BY supplied_usd DESC, timestamp ASC;
`;
}

export const DefiQueries = {
	dex_liquidity: generateDexLiquidityQuery,
	money_market_health: generateMoneyMarketHealthQuery,
	volume: generateDefiVolumeQuery,
	volume_series: generateDefiVolumeSeriesQuery,
};
