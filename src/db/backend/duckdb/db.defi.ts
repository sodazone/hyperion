import type { DuckDBConnection } from "@duckdb/node-api";
import type { AnyEvent, DefiEvent, DefiLiquidityEvent } from "@/alerting";
import { safeNumber } from "./utils";

export function createDefiAnalytics({
	conn,
	enqueueWrite,
}: {
	conn: DuckDBConnection;
	enqueueWrite: (w: () => Promise<void>) => Promise<void>;
}) {
	async function ingestDefiEvent(event: DefiEvent) {
		if (event.type !== "defi-event") return;

		const { origin } = event;
		const p = event.payload;
		const timestamp = new Date(origin.timestamp ?? Date.now()).toISOString();

		const insertRow = async (
			eventType: string,
			direction: "in" | "out" | "collateral" | "debt" | "none",
			assetId: string,
			symbol: string,
			amountStr: string,
			amountUSD?: number,
		) => {
			await conn.run(
				`
					INSERT INTO defi_volume_events (
						ts, event_id, tx_hash, network_id, protocol, market_id,
						event_type, direction, asset_id, symbol, amount, amount_usd
					) VALUES (?::TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
					`,
				[
					timestamp,
					p.id,
					origin.txHash ?? null,
					origin.chainURN,
					origin.protocol ?? null,
					p.marketId,
					eventType,
					direction,
					assetId,
					symbol,
					safeNumber(amountStr, 0),
					safeNumber(amountUSD, null),
				],
			);
		};

		switch (p.name) {
			case "swap":
				await insertRow(
					"swap",
					"in",
					p.data.in.assetId,
					p.data.in.symbol,
					p.data.in.amount,
					p.data.in.amountUSD,
				);
				await insertRow(
					"swap",
					"out",
					p.data.out.assetId,
					p.data.out.symbol,
					p.data.out.amount,
					p.data.out.amountUSD,
				);
				break;

			case "mint":
			case "burn":
				if (Array.isArray(p.data.assets)) {
					for (const asset of p.data.assets) {
						await insertRow(
							p.name,
							"none",
							asset.assetId,
							asset.symbol,
							asset.amount,
							asset.amountUSD,
						);
					}
				}
				break;

			case "borrow":
			case "repay":
			case "supply":
			case "withdraw":
				if (Array.isArray(p.data.assets)) {
					for (const asset of p.data.assets) {
						await insertRow(
							p.name,
							"none",
							asset.assetId,
							asset.symbol,
							asset.amount,
							asset.amountUSD,
						);
					}
				}
				break;

			case "liquidate":
				await insertRow(
					"liquidate",
					"debt",
					p.data.debt.assetId,
					p.data.debt.symbol,
					p.data.debt.amount,
					p.data.debt.amountUSD,
				);
				await insertRow(
					"liquidate",
					"collateral",
					p.data.collateral.assetId,
					p.data.collateral.symbol,
					p.data.collateral.amount,
					p.data.collateral.amountUSD,
				);
				break;
		}
	}

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
				ts, network_id, protocol, market_id, label, supplied_usd
			) VALUES (?::TIMESTAMP, ?, ?, ?, ?, ?)
		`,
				[
					timestamp,
					p.networkId,
					p.protocol,
					p.marketId,
					p.label,
					safeNumber(p.suppliedUSD, 0),
				],
			);
		} else if (p.category === "money-market" && p.lending) {
			await conn.run(
				`
			INSERT INTO money_market_health_snapshots (
				ts, network_id, protocol, market_id, label,
				supplied_usd, borrowed_usd, utilization, solvency_ratio, is_paused
			) VALUES (?::TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
				[
					timestamp,
					p.networkId,
					p.protocol,
					p.marketId,
					p.label,
					safeNumber(p.suppliedUSD, 0),
					safeNumber(p.lending.borrowedUSD, 0),
					safeNumber(p.lending.utilization, null),
					safeNumber(p.lending.health?.solvencyRatio, null),
					p.lending.isPaused ?? false,
				],
			);
		} else if (p.category === "liquid-staking" && p.liquidStaking) {
			await conn.run(
				`
			INSERT INTO liquid_staking_snapshots (
				ts, network_id, protocol, market_id, label, staking_network, supplied_usd, exchange_rate, total_staked
			) VALUES (?::TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
				[
					timestamp,
					p.networkId,
					p.protocol,
					p.marketId,
					p.label,
					p.liquidStaking.stakingNetwork ?? "",
					safeNumber(p.suppliedUSD, 0),
					safeNumber(p.liquidStaking.exchangeRate, 0),
					safeNumber(p.liquidStaking.totalStaked, 0),
				],
			);
		}
	}

	return {
		ingest(event: AnyEvent) {
			if (event.type === "defi-liquidity") {
				enqueueWrite(() => ingestDefiLiquidity(event));
			} else if (event.type === "defi-event") {
				enqueueWrite(() => ingestDefiEvent(event));
			}
		},
		createSchema: async () => {
			await conn.run(`
				CREATE TABLE IF NOT EXISTS defi_volume_events (
					ts           TIMESTAMP,
					event_id     TEXT,
					tx_hash      TEXT,
					network_id   TEXT,
					protocol     TEXT,
					market_id    TEXT,
					event_type   TEXT,
					direction    TEXT,
					asset_id     TEXT,
					symbol       TEXT,
					amount       DOUBLE,
					amount_usd   DOUBLE,
					PRIMARY KEY (ts, event_id, asset_id, direction)
				);

				CREATE INDEX IF NOT EXISTS idx_volume_lookups
				ON defi_volume_events(protocol, market_id, ts DESC);
			`);

			await conn.run(`
        CREATE TABLE IF NOT EXISTS dex_liquidity_snapshots (
          ts              TIMESTAMP,
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
          network_id      TEXT,
          protocol        TEXT,
          market_id       TEXT,
          label           TEXT,
          supplied_usd    DOUBLE,
          borrowed_usd    DOUBLE,
          utilization     DOUBLE,
          solvency_ratio  DOUBLE,
          is_paused       BOOLEAN,

          PRIMARY KEY (ts, protocol, market_id)
        );

        CREATE INDEX IF NOT EXISTS idx_mm_health_lookup
        ON money_market_health_snapshots(protocol, market_id, ts DESC);
      `);

			await conn.run(`
							CREATE TABLE IF NOT EXISTS liquid_staking_snapshots (
								ts              TIMESTAMP,
								network_id      TEXT,
								protocol        TEXT,
								market_id       TEXT,
								label           TEXT,
								staking_network TEXT,
								supplied_usd    DOUBLE,
								exchange_rate   DOUBLE,
								total_staked    DOUBLE,

								PRIMARY KEY (ts, protocol, market_id)
							);

							CREATE INDEX IF NOT EXISTS idx_lst_lookup
							ON liquid_staking_snapshots(protocol, market_id, ts DESC);
						`);
		},
	};
}
