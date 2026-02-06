import { type Category, type HyperionDB, PUBLIC_OWNER } from "@/db";
import { CategoriesMap } from "@/intel/mapping";
import { CAT } from "@/intel/mapping/categories";
import { computeRisk } from "./risk";
import type {
	AddressAnalysis,
	LabeledCategory,
	SanctionsResult,
} from "./types";

function asLabeledCategory(category: Category): LabeledCategory {
	return {
		category: {
			code: category.category,
			label: CategoriesMap.getLabel(category.category),
		},
		subcategory: {
			code: category.subcategory,
			label: CategoriesMap.getLabel(category.category, category.subcategory),
		},
	};
}

export function checkSanctions(
	db: HyperionDB,
	address: string,
	network: number,
): SanctionsResult {
	const entries = db.entities.findCategories({
		owner: PUBLIC_OWNER,
		address,
		network,
		category: CAT.SANCTIONS,
	});

	if (entries.length === 0) return { sanctioned: false, lists: [] };

	return {
		sanctioned: true,
		lists: entries.map(
			(e) => CategoriesMap.getLabel(e.category, e.subcategory) ?? "Unknown",
		),
	};
}

function computeSanctionsFromAttribution(
	attribution: Array<LabeledCategory>,
): SanctionsResult {
	const sanctions = attribution.filter(
		(a) => a.category.code === CAT.SANCTIONS,
	);

	if (sanctions.length === 0) return { sanctioned: false, lists: [] };

	return {
		sanctioned: true,
		lists: sanctions.map(
			(a) =>
				CategoriesMap.getLabel(a.category.code, a.subcategory.code) ??
				"Unknown",
		),
	};
}

export function analyzeAddressAllNetworks(db: HyperionDB, address: string) {
	const categories = db.entities.findCategories({
		owner: PUBLIC_OWNER,
		address,
	});
	const tags = db.entities.findTags({ owner: PUBLIC_OWNER, address });

	type Bucket = {
		attribution: Array<{
			category: { code: number; label?: string };
			subcategory: { code: number; label?: string };
		}>;
		tags: typeof tags;
	};

	const byNetwork = new Map<number, Bucket>();

	for (const c of categories) {
		if (c.network === undefined) continue;
		const bucket = byNetwork.get(c.network) ?? { attribution: [], tags: [] };
		bucket.attribution.push(asLabeledCategory(c));
		byNetwork.set(c.network, bucket);
	}

	for (const t of tags) {
		if (t.network === undefined) continue;
		const bucket = byNetwork.get(t.network) ?? { attribution: [], tags: [] };
		bucket.tags.push(t);
		byNetwork.set(t.network, bucket);
	}

	const networks: Array<{
		networkId: number;
		analysis: AddressAnalysis;
	}> = [];

	for (const [networkId, { attribution, tags: structuredTag }] of byNetwork) {
		const tags = structuredTag.map((tag) => tag.tag);
		const sanctioned = computeSanctionsFromAttribution(attribution);
		const risk = computeRisk(sanctioned, attribution, tags);

		networks.push({
			networkId,
			analysis: {
				sanctioned,
				risk,
				attribution,
				tags,
			},
		});
	}

	networks.sort((a, b) => a.networkId - b.networkId);

	return { address, networks };
}

export type AddressAnalysisAllNetworks = ReturnType<
	typeof analyzeAddressAllNetworks
>;

export function analyzeAddress(
	db: HyperionDB,
	address: string,
	network: number,
): AddressAnalysis {
	const attribution = db.entities
		.findCategories({
			owner: PUBLIC_OWNER,
			address,
			network,
		})
		.map(asLabeledCategory);
	const tags = db.entities
		.findTags({ owner: PUBLIC_OWNER, address, network })
		.map((tag) => tag.tag);

	const sanctioned = checkSanctions(db, address, network);
	const risk = computeRisk(sanctioned, attribution, tags);

	return { sanctioned, risk, attribution, tags };
}
