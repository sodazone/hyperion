import type { Alert, AlertPayload } from "@/db";
import { CategoriesMap, NetworkMap } from "@/intel/mapping";
import type {
	RuleDefinition,
	TransferEvent,
	TransferPayload,
} from "../../types";
import { toOwners } from "../common/owner";
import { mapTransferAlert } from "./mapper";
import { type Config, type LocalData, schema } from "./schema";

const ruleId = "transfer";

const defaults = {
	minUsd: 10_000,
	level: 1,
	categories: [],
	includePublicEntities: true,
	tags: [],
	networks: [],
};

interface TransferAlertPayload extends AlertPayload {
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

function accept(event: TransferEvent, config: Config): boolean {
	return (
		event.type === "transfer" &&
		(!config.networks ||
			config.networks.length === 0 ||
			config.networks.includes(event.chain))
	);
}

export const TransfersRule: RuleDefinition<TransferEvent, LocalData, Config> = {
	id: ruleId,
	dependencies: [{ kind: "transfer" }],
	title: "Asset Movement",
	description: "Detects asset movements in USD using thresholds.",
	schema,
	defaults,

	matcher: async (event, { config, global: { db }, owner }) => {
		if (!accept(event, config)) return { matched: false };

		const { from, to, amountUsd } = event.payload as TransferPayload;
		if (!amountUsd || amountUsd < config.minUsd) return { matched: false };

		const local: LocalData = { addresses: new Set(), entities: {} };
		const owners = toOwners(owner, config.includePublicEntities);

		let found = false;
		for (const addr of [from, to]) {
			local.addresses.add(addr);

			const entity = db.entities.findEntity({
				owner: owners,
				address: addr,
				categories: config.categories,
				tags: config.tags,
			});

			if (entity) {
				found = true;
			}

			local.entities[addr] = {
				address: addr,
				tags: entity?.tags?.map((tag) => tag.tag) ?? [],
				categories: entity?.categories?.map((c) => c.category) ?? [],
			};
		}

		const filterRequired =
			(config.categories?.length || 0) + (config.tags?.length || 0) > 0;
		if (filterRequired && !found) {
			return { matched: false };
		}

		return { matched: true, data: local };
	},

	alertTemplate: (event, { config }, local): Alert<TransferAlertPayload> => {
		const { message, actors, assets, totalUsd } = mapTransferAlert(
			event,
			local,
		);

		let remark = `≥${config.minUsd} USD`;
		if (config.categories && config.categories.length > 0) {
			remark += ` in ${config.categories.map(CategoriesMap.getLabel).join(", ")}`;
		}
		if (config.tags && config.tags.length > 0) {
			remark += ` with ${config.tags.join(", ")}`;
		}

		return {
			timestamp: Date.now(),
			rule_id: ruleId,
			level: config.level,
			remark,
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
