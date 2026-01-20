import type { HyperionDB } from "@/db";
import { CategoriesMap, NetworkMap } from "@/mapping";
import { CAT } from "@/mapping/categories";
import type {
	AddressAnalysis,
	AttributionResult,
	RiskResult,
	SanctionsResult,
} from "./types";

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

export function resolveAttribution(
	db: HyperionDB,
	address: string,
	networkId: number,
): AttributionResult {
	const cats = db.getCategories({ address, networkId });

	for (const c of cats) {
		switch (c.category.code) {
			case CAT.EXCHANGE:
				return {
					type: "CEX",
					label: c.subcategory.label,
					source: "hyperion",
				};

			case CAT.DEFI:
				return {
					type: "DEX",
					label: c.subcategory.label,
					source: "hyperion",
				};

			case CAT.INFRA:
				return {
					type: "INFRA",
					label: c.subcategory.label,
					source: "hyperion",
				};

			case CAT.EXTERNAL:
				return {
					type: "SERVICE",
					label: c.subcategory.label,
					source: "external",
				};
		}
	}

	return { type: "UNKNOWN" };
}

export function computeRisk(
	sanctions: SanctionsResult,
	attribution: AttributionResult,
	tags: unknown[],
): RiskResult {
	const reasons: string[] = [];
	let score = 0;

	if (sanctions.sanctioned) {
		reasons.push("Address is sanctioned");
		return {
			level: "critical",
			score: 100,
			reasons,
		};
	}

	if (attribution.type === "CEX") {
		score += 10;
	}

	if (attribution.type === "DEX") {
		score += 20;
	}

	if (tags.length > 0) {
		score += Math.min(tags.length * 5, 30);
		reasons.push("Tagged activity");
	}

	let level: RiskResult["level"] = "low";
	if (score >= 70) level = "high";
	else if (score >= 40) level = "medium";

	return { level, score, reasons };
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
	const categories = db.getCategories({ address, networkId });
	const tags = db.getTags({ address, networkId });

	const sanctioned = checkSanctions(db, address, networkId);
	const attribution = resolveAttribution(db, address, networkId);
	const risk = computeRisk(sanctioned, attribution, tags);

	return {
		address,
		networkId,
		sanctioned,
		attribution,
		risk,
		categories,
		tags,
	};
}
