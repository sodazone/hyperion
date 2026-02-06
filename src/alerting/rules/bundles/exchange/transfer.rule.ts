import { type Alert, type AlertPayload, PUBLIC_OWNER } from "@/db";
import { CAT, NetworkMap } from "@/intel/mapping";
import {
	AlertLevel,
	type Rule,
	type TransferEvent,
	type TransferPayload,
} from "../../types";
import { mapTransferAlert } from "./mapper";
import type { LocalData } from "./types";

// TODO: configurable
const THRESHOLDS = {
	warningUsd: 100_000,
	criticalUsd: 1_000_000,
};

const MIN_USD_THRESHOLD = 10_000;

const RISK_CATEGORIES: number[] = [CAT.SANCTIONS, CAT.COMPROMISED];

const ruleId = "exchange-large-transfer";
const owner = PUBLIC_OWNER;

type Severity = {
	level: AlertLevel;
	remark: string;
};

function resolveSeverity(totalUsd: number, local: LocalData): Severity {
	for (const e of Object.values(local.entities)) {
		if (e.categories?.some((c: number) => RISK_CATEGORIES.includes(c))) {
			return {
				level: AlertLevel.Critical,
				remark: "Risk category detected",
			};
		}
	}

	if (totalUsd >= THRESHOLDS.criticalUsd)
		return {
			level: AlertLevel.Critical,
			remark: "Critical threshold exceeded",
		};
	if (totalUsd >= THRESHOLDS.warningUsd)
		return {
			level: AlertLevel.Warning,
			remark: `Warning threshold >= ${THRESHOLDS.warningUsd}`,
		};

	return {
		level: AlertLevel.Info,
		remark: "Minimum threshold exceeded",
	};
}

interface ExchangeAlertPayload extends AlertPayload {
	kind: "transfer";
	assets: {
		id: string;
		symbol: string;
		decimals: number;
		amount: string;
		usd: number;
	}[];
	totals: {
		usd: number;
	};
}

export const exchangeLargeTransferRule: Rule<TransferEvent, LocalData> = {
	id: ruleId,
	owner,
	dependencies: [{ kind: "transfer" }],

	matcher: async (event, ctx) => {
		if (event.type !== "transfer") return { matched: false };

		const { from, to, amountUsd } = event.payload as TransferPayload;

		// TODO... maybe first mapping for sanctions etc?
		if (!amountUsd || amountUsd < MIN_USD_THRESHOLD) return { matched: false };

		const local: LocalData = { addresses: new Set(), entities: {} };
		let matched = false;

		for (const addr of [from, to]) {
			local.addresses.add(addr);

			const entity = ctx.db.entities.findEntity({
				owner: PUBLIC_OWNER,
				address: addr,
			});

			// TODO: this is a configurable CAT of Interest
			const isExchange =
				entity?.categories?.some((c) => c.category === CAT.EXCHANGE) ?? false;

			// TODO: mapping more general... supporting exchange or not..
			local.entities[addr] = {
				address: addr,
				isExchange,
				exchangeName: entity?.tags
					?.find((t) => t.tag.startsWith("exchange_name"))
					?.tag.substring(14),
				walletType: entity?.tags
					?.find((t) => t.tag.startsWith("address_type"))
					?.tag.substring(13),
				categories: entity?.categories?.map((c) => c.category) ?? [],
			};

			if (isExchange) matched = true;
		}

		return { matched, data: local };
	},

	alertTemplate: (event, _ctx, local): Alert<ExchangeAlertPayload> => {
		const { message, actors, assets, totalUsd } = mapTransferAlert(
			event,
			local,
		);
		const severity = resolveSeverity(totalUsd, local);
		return {
			timestamp: event.timestamp ?? Date.now(),
			rule_id: ruleId,
			owner,
			level: severity.level,
			remark: severity.remark,
			network: NetworkMap.fromURN(event.chain),
			tx_hash: event.txHash,
			block_number: event.blockHeight,
			block_hash: event.blockHash,
			message,
			payload: { kind: "transfer", actors, assets, totals: { usd: totalUsd } },
		};
	},
};
