import type { HyperionDB } from "@/db";
import { CategoriesMap } from "@/mapping";
import { CAT } from "@/mapping/categories";
import { computeRisk } from "./risk";
import type { AddressAnalysis, SanctionsResult } from "./types";

export function checkSanctions(
	db: HyperionDB,
	address: string,
	networkId: number,
): SanctionsResult {
	const entries = db.getCategories({
		address,
		networkId,
		categoryCode: CAT.SANCTIONS,
	});

	if (entries.length === 0) {
		return { sanctioned: false, lists: [] };
	}

	return {
		sanctioned: true,
		lists: entries.map(
			(e) =>
				CategoriesMap.getLabel(e.category.code, e.subcategory.code) ??
				"Unknown",
		),
	};
}

function computeSanctionsFromAttribution(
	attribution: Array<{
		category: { code: number };
		subcategory: { code: number };
	}>,
): SanctionsResult {
	const sanctions = attribution.filter(
		(a) => a.category.code === CAT.SANCTIONS,
	);

	if (sanctions.length === 0) {
		return { sanctioned: false, lists: [] };
	}

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
	const categories = db.getCategories({ address });
	const tags = db.getTags({ address });

	type Bucket = {
		attribution: typeof categories;
		tags: typeof tags;
	};

	const byNetwork = new Map<number, Bucket>();

	for (const c of categories) {
		if (c.networkId === undefined) continue;
		const bucket = byNetwork.get(c.networkId) ?? { attribution: [], tags: [] };

		bucket.attribution.push(c);
		byNetwork.set(c.networkId, bucket);
	}

	for (const t of tags) {
		if (t.networkId === undefined) continue;

		const bucket = byNetwork.get(t.networkId) ?? { attribution: [], tags: [] };

		bucket.tags.push(t);
		byNetwork.set(t.networkId, bucket);
	}

	const networks: Array<{
		networkId: number;
		analysis: AddressAnalysis;
	}> = [];

	for (const [networkId, { attribution, tags }] of byNetwork) {
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

export function analyzeAddress(
	db: HyperionDB,
	address: string,
	networkId: number,
): AddressAnalysis {
	const attribution = db.getCategories({ address, networkId });
	const tags = db.getTags({ address, networkId });

	const sanctioned = checkSanctions(db, address, networkId);
	const risk = computeRisk(sanctioned, attribution, tags);

	return {
		sanctioned,
		risk,
		attribution,
		tags,
	};
}
