import type { HyperionDB } from "@/db";
import { CategoriesMap, NetworkMap } from "@/mapping";
import { CAT } from "@/mapping/categories";
import { computeRisk } from "./risk";
import type { AddressAnalysis, SanctionsResult } from "./types";

export function checkSanctions(
	db: HyperionDB,
	address: string,
	networkId: number,
): SanctionsResult {
	const sanctioned = db.existsInCategory({
		networkId,
		address,
		categoryCode: CAT.SANCTIONS,
	});

	if (!sanctioned) {
		return { sanctioned: false, lists: [] };
	}

	const entries = db.getCategories({
		networkId,
		address,
		categoryCode: CAT.SANCTIONS,
	});

	return {
		sanctioned: true,
		lists: entries.map(
			(e) =>
				CategoriesMap.getLabel(e.category.code, e.subcategory.code) ??
				"Unknown",
		),
	};
}

export async function analyzeAddressAllNetworks(
	db: HyperionDB,
	address: string,
) {
	const tasks = [];

	for (const networkId of Object.values(NetworkMap.entries())) {
		tasks.push(
			Promise.resolve().then(() => {
				if (
					!db.existsInCategory({
						address,
						networkId,
						categoryCode: 0,
					})
				)
					return null;

				return {
					networkId,
					analysis: analyzeAddress(db, address, networkId),
				};
			}),
		);
	}

	const resolved = await Promise.all(tasks);

	return {
		address,
		networks: resolved.filter(
			(r): r is { networkId: number; analysis: AddressAnalysis } => r !== null,
		),
	};
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
