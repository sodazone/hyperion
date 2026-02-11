import { truncMid } from "@/console/util";
import {
	type Alert,
	type AlertActor,
	type AlertPayload,
	PUBLIC_OWNER,
} from "@/db";
import { CAT, CategoriesMap, NetworkMap } from "@/intel/mapping";
import { equals } from "@/utils/bytes";
import type { BaseEvent, RuleDefinition } from "../../types";
import {
	type Config,
	type LocalData,
	type LocalEntityData,
	schema,
} from "./schema";

const ruleId = "flagged";

function makeLabels(entity: LocalEntityData) {
	const labels: string[] = [];

	if (entity.categories?.length) {
		for (let i = 0; i < entity.categories.length; i++) {
			const cat = entity.categories[i];
			const sub = entity.subcategories?.[i];

			if (cat !== undefined) {
				const catName = CategoriesMap.getLabel(cat, sub);
				if (catName) {
					labels.push(catName);
				}
			}
		}
	}

	if (entity.tags?.length) {
		for (const tag of entity.tags) {
			labels.push(tag);
		}
	}

	return labels;
}

const defaults = {
	level: 1,
	riskCategories: [CAT.SANCTIONS, CAT.COMPROMISED],
	riskTags: [],
	networks: [],
};

interface EntityAlertPayload extends AlertPayload {
	kind: "flagged";
}

export const FlaggedRule: RuleDefinition<BaseEvent, LocalData, Config> = {
	id: ruleId,
	title: "Flagged Entities",
	description:
		"Flags entities that match configured risk categories, subcategories, or tags, highlighting potential risk signals for review.",
	schema,
	defaults,

	matcher: async (event, { config, global: { db }, owner }) => {
		if (
			event.addresses === undefined ||
			event.addresses.length === 0 ||
			(config.networks?.length && !config.networks.includes(event.chain))
		) {
			return { matched: false };
		}

		const owners = equals(owner, PUBLIC_OWNER)
			? [PUBLIC_OWNER]
			: [PUBLIC_OWNER, owner];

		const local: LocalData = { entities: [] };
		let matched = false;

		for (const addr of event.addresses) {
			const entity = db.entities.findEntity({
				owner: owners,
				address: addr,
				categories: config.riskCategories,
				tags: config.riskTags,
			});

			if (!entity) continue;

			const categories = entity.categories?.map((c) => c.category) ?? [];
			const subcategories =
				entity.categories?.map((c) => c.subcategory).filter(Boolean) ?? [];
			const tags = entity.tags?.map((t) => t.tag) ?? [];

			let role: "seen" | "flagged" = "seen";
			console.log(categories, config.riskCategories);
			if (categories.some((c) => config.riskCategories.includes(c))) {
				role = "flagged";
				matched = true;
			}

			local.entities.push({
				address: addr,
				role,
				addressFormatted: entity.address_formatted,
				categories,
				subcategories,
				tags,
			});
		}

		if (matched) return { matched, data: local };
		return { matched: false };
	},

	alertTemplate: (event, { config }, local): Alert<EntityAlertPayload> => {
		const actors: AlertActor[] = local.entities.map((entity) => ({
			role: entity.role,
			address: entity.address,
			address_formatted: entity.addressFormatted,
			labels: makeLabels(entity),
		}));
		const flaggedAddrs =
			actors
				.filter((a) => a.role === "flagged")
				.map((a) => truncMid(a.address_formatted))
				.join(", ") || "???";

		const alert: Alert<EntityAlertPayload> = {
			timestamp: Date.now(),
			rule_id: ruleId,
			level: config.level,
			network: NetworkMap.fromURN(event.chain),
			tx_hash: event.txHash,
			block_number: event.blockHeight,
			block_hash: event.blockHash,
			message: `Entity ${flaggedAddrs} flagged for risk`,
			payload: {
				kind: "flagged",
				actors,
			},
		};

		return alert;
	},
};
