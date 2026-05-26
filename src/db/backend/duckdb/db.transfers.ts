import type { DuckDBConnection } from "@duckdb/node-api";
import {
	type AnyEvent,
	type IssuanceEvent,
	type TransferEvent,
	TransferStatus,
} from "@/alerting";
import { PUBLIC_OWNER } from "@/db/db";
import { toDecimal } from "@/utils/amounts";
import { safeStringify } from "@/utils/strings";
import type { EntitiesDB } from "../sqlite/entities.db";
import { safe, safeNumber } from "./utils";

export function createTransfersAnalytics({
	conn,
	enqueueWrite,
}: {
	conn: DuckDBConnection;
	enqueueWrite: (w: () => Promise<void>) => Promise<void>;
}) {
	async function ingestTransfer(event: TransferEvent) {
		const { payload: p, origin, destination } = event;

		const isXC = !!destination;

		const correlationId =
			p.correlationId ??
			`${origin.chainURN}-${origin.blockHeight}-${origin.txHash ?? ""}`;

		const originDomain = String(origin.chainURN ?? "");
		const destinationDomain = String(
			destination?.chainURN ?? origin.chainURN ?? "",
		);

		const originProtocol = String(origin.protocol ?? "");
		const destinationProtocol = String(
			destination?.protocol ?? origin.protocol ?? "",
		);

		const blockHeight =
			typeof origin.blockHeight === "number" &&
			Number.isSafeInteger(origin.blockHeight)
				? origin.blockHeight
				: 0;

		const blockHash = safe(origin.blockHash);
		const txHash = safe(origin.txHash);

		const sentAt = new Date(origin.timestamp ?? Date.now()).toISOString();
		const recvAt = new Date(
			destination?.timestamp ?? origin.timestamp ?? Date.now(),
		).toISOString();

		const fromAddress = safe(p.from.address);
		const toAddress = safe(p.to.address);

		try {
			for (const asset of p.assets ?? []) {
				const decimals = asset.decimals ?? 0;

				const rawAmount = asset.amount;
				const amount =
					typeof rawAmount === "bigint"
						? Number(rawAmount) / 10 ** decimals
						: Number(rawAmount) / 10 ** decimals;

				const amountUsd = safeNumber(asset.amountUsd, 0);

				await conn.run(
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
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?::TIMESTAMP, ?::TIMESTAMP, ?::TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT DO NOTHING
          `,
					[
						safe(correlationId),
						isXC ? "xc" : "ic",
						originDomain,
						destinationDomain,
						originProtocol,
						destinationProtocol,
						blockHeight,
						blockHash,
						txHash,
						sentAt,
						sentAt,
						recvAt,
						fromAddress,
						toAddress,
						safe(asset.id),
						safe(asset.symbol),
						decimals,
						amount,
						amountUsd,
					],
				);
			}

			const insertBulk = async (
				table: string,
				columns: string[],
				rows: (string | number)[][],
			) => {
				if (!rows.length) return;

				const placeholders = rows
					.map((r) => `(${r.map(() => "?").join(",")})`)
					.join(",");

				await conn.run(
					`INSERT INTO ${table} (${columns.join(",")}) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
					rows.flat(),
				);
			};

			if (Array.isArray(p.from.tags) && p.from.tags.length)
				await insertBulk(
					"address_tag",
					["address", "tag"],
					p.from.tags.map((tag) => [fromAddress, safe(tag)]),
				);

			if (Array.isArray(p.to.tags) && p.to.tags.length)
				await insertBulk(
					"address_tag",
					["address", "tag"],
					p.to.tags.map((tag) => [toAddress, safe(tag)]),
				);

			if (Array.isArray(p.from.categories) && p.from.categories.length)
				await insertBulk(
					"address_category",
					["address", "category"],
					p.from.categories.map((c) => [fromAddress, Number(c)]),
				);

			if (Array.isArray(p.to.categories) && p.to.categories.length)
				await insertBulk(
					"address_category",
					["address", "category"],
					p.to.categories.map((c) => [toAddress, Number(c)]),
				);
		} catch (error) {
			console.error("Error during ingestTransfer:", event, error);
			throw error;
		}
	}

	async function ingestIssuance(event: IssuanceEvent) {
		if (event.type !== "issuance") return;

		const p = event.payload;

		const timestamp = event.origin.timestamp ?? Date.now();

		const reserveAmount = toDecimal({
			amount: p.reserve,
			decimals: p.inputs.reserveDecimals,
		});

		const remoteAmount = toDecimal({
			amount: p.remote,
			decimals: p.inputs.remoteDecimals,
		});

		const difference = reserveAmount - remoteAmount;

		const collateralRatio =
			remoteAmount === 0 ? null : reserveAmount / remoteAmount;

		const reserveAssetId =
			typeof p.inputs.reserveAssetId === "string"
				? p.inputs.reserveAssetId
				: safeStringify(p.inputs.reserveAssetId);

		await enqueueWrite(async () => {
			await conn.run(
				`
          INSERT INTO crosschain_solvency_snapshots (
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
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
				[
					new Date(timestamp).toISOString(),
					p.subscriptionId,
					p.protocol,
					p.inputs.reserveChain,
					p.inputs.reserveAddress,
					p.inputs.remoteChain,
					reserveAssetId,
					p.inputs.assetSymbol,
					reserveAmount,
					remoteAmount,
					difference,
					collateralRatio,
				],
			);
		});
	}

	function classify(address: string, entities: EntitiesDB) {
		const entity = entities.findEntity({
			owner: PUBLIC_OWNER,
			address,
		});
		return entity;
	}

	function onTransfer(event: TransferEvent, entities: EntitiesDB) {
		const { from, to } = event.payload;

		const fromEntity = classify(from.address, entities);
		const toEntity = classify(to.address, entities);

		event.payload.from.categories = fromEntity?.categories?.map(
			(category) => category.category,
		);
		event.payload.from.tags = fromEntity?.tags?.map((tag) => tag.tag);
		event.payload.to.categories = toEntity?.categories?.map(
			(category) => category.category,
		);
		event.payload.to.tags = toEntity?.tags?.map((tag) => tag.tag);

		enqueueWrite(() => ingestTransfer(event));
	}

	return {
		ingest(event: AnyEvent, { entities }: { entities: EntitiesDB }) {
			if (
				event.type === "transfer" &&
				event.payload.status === TransferStatus.SUCCESS
			) {
				onTransfer(event, entities);
			} else if (event.type === "issuance") {
				ingestIssuance(event);
			}
		},
		async createSchema() {
			await conn.run(`
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

          CREATE TABLE IF NOT EXISTS crosschain_solvency_snapshots (
            ts TIMESTAMP,

            subscription_id TEXT,

            protocol TEXT,

            reserve_chain TEXT,
            reserve_address TEXT,

            remote_chain TEXT,

            asset_id TEXT,
            asset_symbol TEXT,

            reserve_balance DOUBLE,
            remote_balance DOUBLE,

            difference DOUBLE,
            collateral_ratio DOUBLE,

            PRIMARY KEY (
              ts,
              subscription_id,
              asset_id
            )
          );

          CREATE INDEX IF NOT EXISTS idx_xc_inv_asset
          ON crosschain_solvency_snapshots(asset_id);

          CREATE INDEX IF NOT EXISTS idx_xc_inv_ts
          ON crosschain_solvency_snapshots(ts);

          CREATE INDEX IF NOT EXISTS idx_xc_inv_remote_ts
          ON crosschain_solvency_snapshots(remote_chain, ts DESC);
        `);
		},
	};
}
