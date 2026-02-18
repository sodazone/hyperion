import { DuckDBInstance } from "@duckdb/node-api";

import type { TransferEvent } from "@/alerting/rules/types";
import {
	type CEXFlowQueryParams,
	Queries,
	type TopExchangesQueryParams,
} from "./queries";

const safe = (v: any) => (v === undefined || v === null ? "" : String(v));
const safeNumber = (v: any, fallback = 0) =>
	typeof v === "number" && Number.isFinite(v) ? v : fallback;

export class AnalyticsDB {
	private db!: Awaited<ReturnType<typeof DuckDBInstance.create>>;
	private conn!: Awaited<ReturnType<typeof this.db.connect>>;
	private writeQueue: Promise<void> = Promise.resolve();

	constructor(private dbPath = ":memory:") {}

	async init() {
		this.db = await DuckDBInstance.create(this.dbPath);
		this.conn = await this.db.connect();

		await this.conn.run(`
      CREATE TABLE IF NOT EXISTS transfers (
        correlation_id    TEXT UNIQUE,
        transfer_type     TEXT,

        origin_domain TEXT,
        destination_domain TEXT,

        origin_protocol   TEXT,
        destination_protocol TEXT,

        block_height BIGINT,
        block_hash TEXT,
        tx_hash TEXT,

        ts TIMESTAMP,
        sent_at TIMESTAMP,
        recv_at TIMESTAMP,

        from_address TEXT,
        to_address TEXT,

        asset_id TEXT,
        asset_symbol TEXT,
        asset_decimals INTEGER,

        amount DOUBLE,
        amount_usd DOUBLE
      );

      CREATE TABLE IF NOT EXISTS address_tag (
        address TEXT,
        tag TEXT,
        UNIQUE(address, tag)
      );

      CREATE TABLE IF NOT EXISTS address_category (
        address TEXT,
        category INTEGER,
        UNIQUE(address, category)
      );

      CREATE INDEX IF NOT EXISTS idx_tag ON address_tag(tag);
      CREATE INDEX IF NOT EXISTS idx_category ON address_category(category);
    `);
	}

	async close() {
		this.conn.disconnectSync();
		this.db.closeSync();
	}

	async ingestTransfer(event: TransferEvent) {
		return this.enqueueWrite(() => this._ingestTransfer(event));
	}

	private async _ingestTransfer(event: TransferEvent) {
		const p = event.payload;

		const rawAmount = event.payload.amount;
		const decimals = p.asset?.decimals ?? 0;
		const amount =
			typeof rawAmount === "bigint"
				? Number(rawAmount) / 10 ** decimals
				: Number(rawAmount) / 10 ** decimals;

		const amountUsd = safeNumber(p.amountUsd, 0);

		const correlationId =
			p.correlationId ??
			`${event.chain}-${event.blockHeight}-${event.txHash ?? ""}`;
		const chain = String(event.chain ?? "");
		const protocol = String(p.protocol ?? "");
		const blockHeight =
			typeof event.blockHeight === "number" &&
			Number.isSafeInteger(event.blockHeight)
				? event.blockHeight
				: 0;

		const timestamp = new Date(event.timestamp ?? Date.now()).toISOString();

		try {
			await this.conn.run(
				`
      INSERT INTO transfers (
        correlation_id, transfer_type,
        origin_domain, destination_domain,
        origin_protocol, destination_protocol,
        block_height, block_hash, tx_hash,
        ts, sent_at, recv_at,
        from_address, to_address,
        asset_id, asset_symbol, asset_decimals,
        amount, amount_usd
      )
      VALUES (?, 'ic', ?, ?, ?, ?, ?, ?, ?, ?::TIMESTAMP, ?::TIMESTAMP, ?::TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT DO NOTHING
      `,
				[
					safe(correlationId),
					chain,
					chain,
					protocol,
					protocol,
					blockHeight,
					safe(event.blockHash),
					safe(event.txHash),
					timestamp,
					timestamp,
					timestamp,
					safe(p.from),
					safe(p.to),
					safe(p.asset?.id),
					safe(p.asset?.symbol),
					decimals,
					amount,
					amountUsd,
				],
			);

			const insertBulk = async (
				table: string,
				columns: string[],
				rows: (string | number)[][],
			) => {
				if (!rows.length) return;
				const placeholders = rows
					.map((r) => `(${r.map(() => "?").join(",")})`)
					.join(",");
				await this.conn.run(
					`INSERT INTO ${table} (${columns.join(",")}) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
					rows.flat(),
				);
			};

			if (Array.isArray(p.fromTags) && p.fromTags.length)
				await insertBulk(
					"address_tag",
					["address", "tag"],
					p.fromTags.map((tag) => [safe(p.from), safe(tag)]),
				);

			if (Array.isArray(p.toTags) && p.toTags.length)
				await insertBulk(
					"address_tag",
					["address", "tag"],
					p.toTags.map((tag) => [safe(p.to), safe(tag)]),
				);

			if (Array.isArray(p.fromCategories) && p.fromCategories.length)
				await insertBulk(
					"address_category",
					["address", "category"],
					p.fromCategories.map((c) => [safe(p.from), Number(c)]),
				);

			if (Array.isArray(p.toCategories) && p.toCategories.length)
				await insertBulk(
					"address_category",
					["address", "category"],
					p.toCategories.map((c) => [safe(p.to), Number(c)]),
				);
		} catch (error) {
			console.error("Error during ingestTransfer:", event, error);
			throw error;
		}
	}

	async cexSeries(params: CEXFlowQueryParams) {
		return (
			await this.conn.runAndReadAll(Queries.cex_flows(params))
		).getRowObjectsJson();
	}

	async cexTop(params: TopExchangesQueryParams) {
		return (
			await this.conn.runAndReadAll(Queries.top_exchanges(params))
		).getRowObjectsJson();
	}

	private enqueueWrite(w: () => Promise<void>) {
		this.writeQueue = this.writeQueue.then(w).catch(console.error);
		return this.writeQueue;
	}
}
