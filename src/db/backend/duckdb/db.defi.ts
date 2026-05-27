import type { DuckDBConnection } from "@duckdb/node-api";
import type { AnyEvent, DefiLiquidityEvent } from "@/alerting";
import { safeNumber } from "./utils";

export function createDefiAnalytics({
	conn,
	enqueueWrite,
}: {
	conn: DuckDBConnection;
	enqueueWrite: (w: () => Promise<void>) => Promise<void>;
}) {
	async function ingestDefiLiquidity(event: DefiLiquidityEvent) {
		if (event.type !== "defi-liquidity") return;

		const p = event.payload;
		const timestamp = new Date(
			event.origin.timestamp ?? Date.now(),
		).toISOString();

		if (p.category === "exchange") {
			await conn.run(
				`
			INSERT INTO dex_liquidity_snapshots (
				ts, subscription_id, network_id, protocol, market_id, label, supplied_usd
			) VALUES (?::TIMESTAMP, ?, ?, ?, ?, ?, ?)
		`,
				[
					timestamp,
					p.subscriptionId,
					p.networkId,
					p.protocol,
					p.marketId,
					p.label,
					safeNumber(p.suppliedUSD, 0),
				],
			);
		}

		if (p.category === "money-market" && p.lending) {
			await conn.run(
				`
			INSERT INTO money_market_health_snapshots (
				ts, subscription_id, network_id, protocol, market_id, label,
				supplied_usd, utilization, solvency_ratio, bad_debt_usd, is_paused
			) VALUES (?::TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
				[
					timestamp,
					p.subscriptionId,
					p.networkId,
					p.protocol,
					p.marketId,
					p.label,
					safeNumber(p.suppliedUSD, 0),
					safeNumber(p.lending.utilization, null),
					safeNumber(p.lending.health?.solvencyRatio, null),
					safeNumber(p.lending.health?.badDebtUSD, 0),
					p.lending.isPaused ?? false,
				],
			);
		}
	}

	return {
		ingest(event: AnyEvent) {
			if (event.type !== "defi-liquidity") return;
			enqueueWrite(() => ingestDefiLiquidity(event));
		},
		createSchema: async () => {
			await conn.run(`
        CREATE TABLE IF NOT EXISTS dex_liquidity_snapshots (
          ts              TIMESTAMP,
          subscription_id TEXT,
          network_id      TEXT,
          protocol        TEXT,
          market_id       TEXT,
          label           TEXT,
          supplied_usd    DOUBLE,

          PRIMARY KEY (ts, protocol, market_id)
        );

        CREATE INDEX IF NOT EXISTS idx_dex_liq_lookup
        ON dex_liquidity_snapshots(protocol, market_id, ts DESC);
      `);

			await conn.run(`
        CREATE TABLE IF NOT EXISTS money_market_health_snapshots (
          ts              TIMESTAMP,
          subscription_id TEXT,
          network_id      TEXT,
          protocol        TEXT,
          market_id       TEXT,
          label           TEXT,
          supplied_usd    DOUBLE,
          utilization     DOUBLE,
          solvency_ratio  DOUBLE,
          bad_debt_usd    DOUBLE,
          is_paused       BOOLEAN,

          PRIMARY KEY (ts, protocol, market_id)
        );

        CREATE INDEX IF NOT EXISTS idx_mm_health_lookup
        ON money_market_health_snapshots(protocol, market_id, ts DESC);
      `);
		},
	};
}
