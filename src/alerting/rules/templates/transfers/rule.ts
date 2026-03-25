import type { Alert, AlertPayload } from "@/db";
import { CategoriesMap } from "@/intel/mapping";
import type {
	RuleDefinition,
	TransferEvent,
	TransferPayload,
} from "../../types";
import { makeNetworks } from "../common/helpers";
import { toOwners } from "../common/owner";
import { mapTransferAlert } from "./mapper";
import { type Config, type LocalData, schema } from "./schema";

const ruleName = "transfer";

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
		amountUsd: number;
	}[];
	totals: {
		amountUsd: number;
	};
}

function matchesNetwork(event: TransferEvent, config: Config): boolean {
	if (!config.networks || config.networks.length === 0) return true;

	const originMatch = config.networks.includes(event.origin.chainURN);
	const destinationMatch =
		event.destination && config.networks.includes(event.destination.chainURN);

	return originMatch || !!destinationMatch;
}

export const TransfersRule: RuleDefinition<TransferEvent, LocalData, Config> = {
	id: ruleName,
	resolveDependencies: () => [{ kind: "transfer" }, { kind: "xc" }],
	title: "Asset Movement",
	description:
		"Detect asset movements in USD using thresholds, tags, and categories. Includes cross-chain transfers.",
	schema,
	defaults,

	matcher: async (event, { config, global: { db }, owner }) => {
		if (event.type !== "transfer") return { matched: false };
		if (!matchesNetwork(event, config)) return { matched: false };

		const { from, to, totalUsd, assets } = event.payload as TransferPayload;
		if (totalUsd == null || totalUsd < config.minUsd) return { matched: false };

		if (config.assetSymbols?.length) {
			const targetAssetSymbols = new Set(
				config.assetSymbols.split(",").map((s) => s.trim().toLowerCase()),
			);

			const hasMatchingAsset = assets.some((a) =>
				targetAssetSymbols.has(a.symbol.toLowerCase()),
			);

			if (!hasMatchingAsset) return { matched: false };
		}

		const local: LocalData = { addresses: new Set(), entities: {} };
		const owners = toOwners(owner, config.includePublicEntities);

		let found = false;
		for (const addr of [from.address, to.address]) {
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
			level: config.level,
			name: ruleName,
			remark,
			networks: makeNetworks(event),
			message,
			payload: {
				kind: "transfer",
				actors,
				assets,
				totals: { amountUsd: totalUsd },
			},
		};
	},
};
