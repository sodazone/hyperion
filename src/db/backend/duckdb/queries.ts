export type CEXFlowRow = {
	timestamp: Date;
	exchange: string;
	outflow_usd: number;
	inflow_usd: number;
	netflow_usd: number;
	cummulative_outflow_usd: number;
	cummulative_inflow_usd: number;
	cummulative_netflow_usd: number;
};

export type CEXFlowQueryParams = {
	bucket?: "day" | "hour";
	lookback?: number;
	exchange?: string;
	network?: string;
};

export type TopExchangesQueryParams = {
	bucket?: "hour" | "day";
	lookback?: number;
	network?: string;
	exchange?: string;
	limit?: number;
};

export function generateCEXFlowsQuery({
	bucket = "day",
	lookback = 30,
	network,
	exchange,
}: CEXFlowQueryParams) {
	const isDay = bucket === "day";

	const castExpr = isDay
		? "CAST(t.sent_at AS DATE)"
		: "date_trunc('hour', t.sent_at)";

	const startExpr = isDay
		? `CURRENT_DATE - INTERVAL '${lookback} days'`
		: `NOW() - INTERVAL '${lookback} hours'`;

	const networkFilter = network
		? `(t.origin_domain = '${network}' OR t.destination_domain = '${network}') AND `
		: "";

	const exchangeFilter = exchange
		? `AND (tag_to.tag = '${exchange}' OR tag_from.tag = '${exchange}')`
		: "";

	return `
WITH tag_to_dedup AS (
  SELECT address, MIN(tag) AS tag
  FROM address_tag
  WHERE tag LIKE 'exchange_name:%'
  GROUP BY address
),
tag_from_dedup AS (
  SELECT address, MIN(tag) AS tag
  FROM address_tag
  WHERE tag LIKE 'exchange_name:%'
  GROUP BY address
),
base AS (
  SELECT
    ${castExpr} AS timestamp,
    tag_to.tag AS tag_to,
    tag_from.tag AS tag_from,
    t.amount_usd
  FROM transfers t
  LEFT JOIN tag_to_dedup tag_to
    ON t.to_address = tag_to.address
  LEFT JOIN tag_from_dedup tag_from
    ON t.from_address = tag_from.address
  WHERE
    ${networkFilter}
    t.sent_at >= ${startExpr}
    AND (tag_to.tag IS NOT NULL OR tag_from.tag IS NOT NULL)
    AND NOT (tag_to.tag IS NOT NULL AND tag_from.tag IS NOT NULL)
    ${exchangeFilter}
)

SELECT
  timestamp,
  SUM(CASE WHEN tag_from IS NOT NULL THEN amount_usd ELSE 0 END) AS inflow_usd,
  SUM(CASE WHEN tag_to IS NOT NULL THEN amount_usd ELSE 0 END) AS outflow_usd,
  SUM(CASE WHEN tag_from IS NOT NULL THEN amount_usd ELSE 0 END)
    - SUM(CASE WHEN tag_to IS NOT NULL THEN amount_usd ELSE 0 END) AS netflow_usd,
  SUM(SUM(CASE WHEN tag_from IS NOT NULL THEN amount_usd ELSE 0 END))
    OVER (ORDER BY timestamp) AS cumulative_inflow_usd,
  SUM(SUM(CASE WHEN tag_to IS NOT NULL THEN amount_usd ELSE 0 END))
    OVER (ORDER BY timestamp) AS cumulative_outflow_usd,
  SUM(
    SUM(CASE WHEN tag_from IS NOT NULL THEN amount_usd ELSE 0 END)
    - SUM(CASE WHEN tag_to IS NOT NULL THEN amount_usd ELSE 0 END)
  ) OVER (ORDER BY timestamp) AS cumulative_netflow_usd
FROM base
GROUP BY timestamp
ORDER BY timestamp;
`;
}

export function generateTopExchangesQuery({
	bucket = "day",
	lookback = 30,
	network,
	exchange,
	limit = 10,
}: TopExchangesQueryParams) {
	const isDay = bucket === "day";

	const startExpr = isDay
		? `CURRENT_DATE - INTERVAL '${lookback} days'`
		: `NOW() - INTERVAL '${lookback} hours'`;

	const networkFilter = network
		? `(t.origin_domain = '${network}' OR t.destination_domain = '${network}') AND `
		: "";

	const exchangeFilter = exchange
		? `AND (tag_to.tag = '${exchange}' OR tag_from.tag = '${exchange}')`
		: "";

	return `
WITH tag_to_dedup AS (
  SELECT address, MIN(tag) AS tag
  FROM address_tag
  WHERE tag LIKE 'exchange_name:%'
  GROUP BY address
),
tag_from_dedup AS (
  SELECT address, MIN(tag) AS tag
  FROM address_tag
  WHERE tag LIKE 'exchange_name:%'
  GROUP BY address
),
base AS (
  SELECT
    tag_to.tag AS tag_to,
    tag_from.tag AS tag_from,
    t.amount_usd
  FROM transfers t
  LEFT JOIN tag_to_dedup tag_to
    ON t.to_address = tag_to.address
  LEFT JOIN tag_from_dedup tag_from
    ON t.from_address = tag_from.address
  WHERE
    ${networkFilter}
    t.sent_at >= ${startExpr}
    AND (tag_to.tag IS NOT NULL OR tag_from.tag IS NOT NULL)
    AND NOT (tag_to.tag IS NOT NULL AND tag_from.tag IS NOT NULL)
    ${exchangeFilter}
)

SELECT
  COALESCE(tag_to, tag_from) AS exchange,
  SUM(CASE WHEN tag_from IS NOT NULL THEN amount_usd ELSE 0 END) AS inflow_usd,
  SUM(CASE WHEN tag_to IS NOT NULL THEN amount_usd ELSE 0 END) AS outflow_usd,
  SUM(CASE WHEN tag_from IS NOT NULL THEN amount_usd ELSE 0 END)
    - SUM(CASE WHEN tag_to IS NOT NULL THEN amount_usd ELSE 0 END) AS netflow_usd
FROM base
GROUP BY exchange
ORDER BY (inflow_usd + outflow_usd) DESC
LIMIT ${limit};
`;
}

export const Queries = {
	cex_flows: generateCEXFlowsQuery,
	top_exchanges: generateTopExchangesQuery,
	daily_zscore: `
  WITH daily AS (
  SELECT
      CAST(sent_at AS DATE) AS day,
      SUM(CASE WHEN tag_to.tag IS NOT NULL AND tag_from.tag IS NULL THEN amount_usd ELSE 0 END) -
      SUM(CASE WHEN tag_from.tag IS NOT NULL AND tag_to.tag IS NULL THEN amount_usd ELSE 0 END) AS netflow_usd
  FROM transfers t
  LEFT JOIN address_tag tag_to ON t.to_address = tag_to.address AND tag_to.tag LIKE 'exchange_name:%'
  LEFT JOIN address_tag tag_from ON t.from_address = tag_from.address AND tag_from.tag LIKE 'exchange_name:%'
  WHERE NOT (tag_to.tag IS NOT NULL AND tag_from.tag IS NOT NULL)
    AND (tag_to.tag IS NOT NULL OR tag_from.tag IS NOT NULL)
    AND sent_at >= current_date - INTERVAL '29 days'
  GROUP BY 1
  ),

  stats AS (
      SELECT
          AVG(netflow_usd) AS mean_net,
          STDDEV_POP(netflow_usd) AS stddev_net
      FROM daily
  )

  SELECT
      d.day,
      d.netflow_usd,
      s.mean_net,
      s.stddev_net,
      CASE
          WHEN s.stddev_net = 0 THEN 0
          ELSE (d.netflow_usd - s.mean_net) / s.stddev_net
      END AS z_score
  FROM daily d
  CROSS JOIN stats s
  WHERE d.day = current_date;
  `,
};
