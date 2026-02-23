import type { Alert, AlertActor, AlertMessagePart, AlertPayload } from "@/db";
import { CategoriesMap } from "@/intel/mapping";
import { capFirst } from "@/utils/strings";
import type { BaseEvent, RuleDefinition } from "../../types";
import { getName, makeNetworks } from "../common/helpers";
import { toOwners } from "../common/owner";
import {
	type Config,
	type LocalData,
	type LocalEntityData,
	schema,
} from "./schema";

const ruleName = "watched";

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
	categories: [],
	tags: [],
	networks: [],
	includePublicEntities: false,
};

interface WatchedAlertPayload extends AlertPayload {
	kind: "watched";
}

export const WatchedRule: RuleDefinition<BaseEvent, LocalData, Config> = {
	id: ruleName,
	title: "Watched Entities",
	description: "Watches entities that match configured categories and tags.",
	schema,
	defaults,

	matcher: async (event, { config, global: { db }, owner }) => {
		if (
			event.addresses === undefined ||
			event.addresses.length === 0 ||
			(config.networks?.length &&
				!(
					config.networks.includes(event.origin.chainURN) ||
					(event.destination !== undefined &&
						config.networks.includes(event.destination.chainURN))
				))
		) {
			return { matched: false };
		}

		const owners = toOwners(owner, config.includePublicEntities);

		const local: LocalData = { entities: [] };
		let matched = false;

		for (const addr of event.addresses) {
			const entity = db.entities.findEntity({
				owner: owners,
				address: addr,
				categories: config.categories,
				tags: config.tags,
			});

			if (!entity) continue;

			const categories = entity.categories?.map((c) => c.category) ?? [];
			const subcategories =
				entity.categories?.map((c) => c.subcategory).filter(Boolean) ?? [];
			const tags = entity.tags?.map((t) => t.tag) ?? [];

			let role: "seen" | "watched" = "seen";
			if (categories.some((c) => config.categories.includes(c))) {
				role = "watched";
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

	alertTemplate: (event, { config }, local): Alert<WatchedAlertPayload> => {
		const actors: AlertActor[] = local.entities.map((entity) => ({
			role: entity.role,
			address: entity.address,
			address_formatted: entity.addressFormatted,
			labels: makeLabels(entity),
			name: getName(entity),
		}));

		const alert: Alert<WatchedAlertPayload> = {
			timestamp: Date.now(),
			level: config.level,
			name: ruleName,
			networks: makeNetworks(event),
			message: [
				["t", `${capFirst(event.type)} involving`],
				...actors
					.filter((a) => a.role === "watched")
					.map(
						(a) =>
							(a.name
								? ["e", a.name]
								: ["addr", a.address_formatted]) as AlertMessagePart,
					),
				["t", "observed"],
			],
			payload: {
				kind: "watched",
				actors,
			},
		};

		return alert;
	},
};
