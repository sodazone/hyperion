export type DexLiquidityRow = {
	timestamp: Date;
	protocol: string;
	market_id: string;
	supplied_usd: number;
	tvl_change_usd: number;
	cumulative_tvl_usd: number;
};

export type MoneyMarketHealthRow = {
	timestamp: Date;
	protocol: string;
	market_id: string;
	supplied_usd: number;
	utilization: number;
	solvency_ratio: number;
	bad_debt_usd: number;
	is_paused: boolean;
};

export type DefiQueryParams = {
	bucket?: "day" | "hour";
	lookback?: number;
	protocol?: string;
	network?: string;
	marketId?: string;
	limit?: number;
};

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
    supplied_usd,
    supplied_usd - LAG(supplied_usd, 1, supplied_usd) OVER (PARTITION BY protocol, market_id ORDER BY timestamp) AS tvl_change_usd
  FROM bucketed_states
)

SELECT
  timestamp,
  protocol,
  market_id,
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
  ${castExpr} AS timestamp,
  protocol,
  market_id,
  arg_max(supplied_usd, ts) AS supplied_usd,
  arg_max(utilization, ts) AS utilization,
  arg_max(solvency_ratio, ts) AS solvency_ratio,
  arg_max(bad_debt_usd, ts) AS bad_debt_usd,
  arg_max(is_paused, ts) AS is_paused
FROM money_market_health_snapshots
WHERE ts >= ${startExpr}
  ${networkFilter}
  ${protocolFilter}
  ${marketFilter}
GROUP BY 1, 2, 3
ORDER BY timestamp ASC;
`;
}

export const DefiQueries = {
	dex_liquidity: generateDexLiquidityQuery,
	money_market_health: generateMoneyMarketHealthQuery,
};
