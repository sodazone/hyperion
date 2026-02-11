import { type Alert, type AlertPayload, PUBLIC_OWNER } from "@/db";
import { CAT, NetworkMap } from "@/intel/mapping";
import { equals } from "@/utils/bytes";
import {
	AlertLevel,
	type RuleDefinition,
	type TransferEvent,
	type TransferPayload,
} from "../../types";
import { mapTransferAlert } from "./mapper";
import { type Config, type LocalData, schema } from "./schema";

const ruleId = "value-movement";

function accept(event: TransferEvent, config: Config): boolean {
	if (event.type !== "transfer") return false;

	if (
		config.networks !== undefined &&
		config.networks.length > 0 &&
		!config.networks.includes(event.chain)
	)
		return false;

	return true;
}

const defaults = {
	infoUsd: 10_000,
	warningUsd: 100_000,
	criticalUsd: 1_000_000,
	riskCategories: [CAT.SANCTIONS, CAT.COMPROMISED],
	networks: [],
};

type Severity = {
	level: AlertLevel;
	remark: string;
};

const riskCategories: number[] = [CAT.SANCTIONS, CAT.COMPROMISED];

function resolveSeverity(
	totalUsd: number,
	local: LocalData,
	config: Config,
): Severity {
	for (const e of Object.values(local.entities)) {
		if (e.categories?.some((c: number) => riskCategories.includes(c))) {
			return {
				level: AlertLevel.Critical,
				remark: "Risk category detected",
			};
		}
	}

	if (totalUsd >= config.criticalUsd)
		return {
			level: AlertLevel.Critical,
			remark: "Critical threshold exceeded",
		};
	if (totalUsd >= config.warningUsd)
		return {
			level: AlertLevel.Warning,
			remark: `Warning threshold >= ${config.warningUsd}`,
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

export const TransfersRule: RuleDefinition<TransferEvent, LocalData, Config> = {
	id: ruleId,
	dependencies: [{ kind: "transfer" }],
	title: "Value Movement",
	description:
		"Detects significant asset movement and prioritizes alerts using thresholds and entity risk signals.",
	schema,
	defaults,

	matcher: async (event, { config, global: { db }, owner }) => {
		if (!accept(event, config)) return { matched: false };

		const { from, to, amountUsd } = event.payload as TransferPayload;

		if (!amountUsd || amountUsd < config.infoUsd) return { matched: false };

		const local: LocalData = { addresses: new Set(), entities: {} };
		const owners = equals(owner, PUBLIC_OWNER)
			? [PUBLIC_OWNER]
			: [PUBLIC_OWNER, owner];

		for (const addr of [from, to]) {
			local.addresses.add(addr);

			const entity = db.entities.findEntity({
				owner: owners,
				address: addr,
			});

			local.entities[addr] = {
				address: addr,
				exchangeName: entity?.tags
					?.find((t) => t.tag.startsWith("exchange_name"))
					?.tag.substring(14),
				walletType: entity?.tags
					?.find((t) => t.tag.startsWith("address_type"))
					?.tag.substring(13),
				categories: entity?.categories?.map((c) => c.category) ?? [],
			};
		}

		return { matched: true, data: local };
	},

	alertTemplate: (event, { config }, local): Alert<ExchangeAlertPayload> => {
		const { message, actors, assets, totalUsd } = mapTransferAlert(
			event,
			local,
		);
		const severity = resolveSeverity(totalUsd, local, config);
		return {
			timestamp: Date.now(),
			rule_id: ruleId,
			level: severity.level,
			remark: severity.remark,
			network: NetworkMap.fromURN(event.chain),
			tx_hash: event.txHash,
			block_number: event.blockHeight,
			block_hash: event.blockHash,
			message,
			payload: {
				kind: "transfer",
				actors,
				assets,
				totals: { usd: totalUsd },
			},
		};
	},
};
