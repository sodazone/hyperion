import { DuckDBInstance } from "@duckdb/node-api";

import type { AnyEvent } from "@/alerting/rules/types";
import type { EntitiesDB } from "../sqlite/entities.db";
import { createDefiAnalytics } from "./db.defi";
import { createTransfersAnalytics } from "./db.transfers";
import { Queries } from "./queries";
import type {
	CEXFlowQueryParams,
	TopExchangesQueryParams,
} from "./queries.cex";
import type { DefiQueryParams, DefiVolumeQueryParams } from "./queries.defi";
import { createWriteQueue } from "./queue";
import type {
	CrosschainSolvencyRow,
	DefiVolumeRow,
	DexLiquidityRow,
	MoneyMarketHealthRow,
} from "./types";

export class AnalyticsDB {
	private db!: Awaited<ReturnType<typeof DuckDBInstance.create>>;
	private conn!: Awaited<ReturnType<typeof this.db.connect>>;
	private processors!: {
		ingest(
			event: AnyEvent,
			{
				entities,
			}: {
				entities: EntitiesDB;
			},
		): void;
		createSchema(): Promise<void>;
	}[];

	constructor(private dbPath = ":memory:") {}

	async init() {
		this.db = await DuckDBInstance.create(this.dbPath);
		this.conn = await this.db.connect();

		const enqueueWrite = createWriteQueue();
		const ctx = {
			conn: this.conn,
			enqueueWrite,
		};

		this.processors = [createDefiAnalytics(ctx), createTransfersAnalytics(ctx)];

		for (const processor of this.processors) {
			await processor.createSchema();
		}
	}

	ingestEvent(event: AnyEvent, ctx: { entities: EntitiesDB }) {
		for (const processor of this.processors) {
			processor.ingest(event, ctx);
		}
	}

	async close() {
		this.conn.disconnectSync();
		this.db.closeSync();
	}

	async solvencyByRemoteChain(
		remoteChain: string,
	): Promise<CrosschainSolvencyRow[]> {
		const result = await this.conn.runAndReadAll(
			`
  SELECT
    ts,
    subscription_id,
    protocol,
    reserve_chain,
    reserve_address,
    remote_chain,
    asset_id,
    asset_symbol,
    reserve_balance,
    remote_balance,
    difference,
    collateral_ratio
  FROM (
    SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY subscription_id, asset_id ORDER BY ts DESC
    ) as rn
    FROM crosschain_solvency_snapshots
    WHERE remote_chain = ?
  ) t
  WHERE rn = 1
  ORDER BY asset_symbol, subscription_id
  `,
			[remoteChain],
		);

		const rows = result.getRowObjectsJson() as any[];

		return rows.map(
			(r): CrosschainSolvencyRow => ({
				ts: r.ts,
				subscription_id: r.subscription_id,
				protocol: r.protocol,

				reserve_chain: r.reserve_chain,
				reserve_address: r.reserve_address,

				remote_chain: r.remote_chain,

				asset_id: r.asset_id,
				asset_symbol: r.asset_symbol,

				reserve_balance: Number(r.reserve_balance),
				remote_balance: Number(r.remote_balance),

				difference: Number(r.difference),
				collateral_ratio:
					r.collateral_ratio === null ? null : Number(r.collateral_ratio),
			}),
		);
	}

	async cexSeries(params: CEXFlowQueryParams) {
		return (
			await this.conn.runAndReadAll(Queries.cex.cex_flows(params))
		).getRowObjectsJson();
	}

	async cexTop(params: TopExchangesQueryParams) {
		return (
			await this.conn.runAndReadAll(Queries.cex.top_exchanges(params))
		).getRowObjectsJson();
	}

	async dexLiquiditySeries(params: DefiQueryParams) {
		const result = await this.conn.runAndReadAll(
			Queries.defi.dex_liquidity(params),
		);
		const rows = result.getRowObjectsJson() as any[];

		return rows.map(
			(r): DexLiquidityRow => ({
				ts: String(r.timestamp),
				subscription_id: String(r.subscription_id),
				network_id: String(r.network_id),
				protocol: String(r.protocol),
				market_id: String(r.market_id),
				label: r.label,

				supplied_usd: Number(r.supplied_usd),
				tvl_change_usd: Number(r.tvl_change_usd),
				total_aggregate_tvl_usd: Number(r.total_aggregate_tvl_usd),
			}),
		);
	}

	async defiVolumeSeries(
		params: DefiVolumeQueryParams,
	): Promise<DefiVolumeRow[]> {
		const result = await this.conn.runAndReadAll(Queries.defi.volume(params));
		const rows = result.getRowObjectsJson() as any[];

		return rows.map(
			(r): DefiVolumeRow => ({
				ts: String(r.timestamp),
				protocol: String(r.protocol),
				market_id: String(r.market_id),

				swap_volume_usd: Number(r.swap_volume_usd),
				supply_volume_usd: Number(r.supply_volume_usd),
				borrow_volume_usd: Number(r.borrow_volume_usd),
				repay_volume_usd: Number(r.repay_volume_usd),
				withdraw_volume_usd: Number(r.withdraw_volume_usd),
				liquidation_volume_usd: Number(r.liquidation_volume_usd),
			}),
		);
	}

	async moneyMarketHealthSeries(params: DefiQueryParams) {
		const result = await this.conn.runAndReadAll(
			Queries.defi.money_market_health(params),
		);
		const rows = result.getRowObjectsJson() as any[];

		return rows.map(
			(r): MoneyMarketHealthRow => ({
				ts: String(r.timestamp),
				subscription_id: String(r.subscription_id),
				network_id: String(r.network_id),
				protocol: String(r.protocol),
				market_id: String(r.market_id),
				label: r.label,

				supplied_usd: Number(r.supplied_usd),
				borrowed_usd: Number(r.borrowed_usd),
				utilization: r.utilization === null ? null : Number(r.utilization),
				solvency_ratio:
					r.solvency_ratio === null ? null : Number(r.solvency_ratio),
				is_paused: Boolean(r.is_paused),
			}),
		);
	}
}
