import type { TagValue } from "@/mapping/tags";
import type { AddressCategory } from "@/types";
import type { AttributionResult, RiskResult, SanctionsResult } from "./types";

export function computeRisk(
	sanctions: SanctionsResult,
	attribution: AttributionResult,
	categories: Array<AddressCategory>,
	tags: Array<{ tag: TagValue }>,
): RiskResult {
	const reasons: string[] = [];
	let score = 0;

	// Sanctions
	if (sanctions.sanctioned) {
		reasons.push("Address is sanctioned");
		return { level: "critical", score: 100, reasons };
	}

	// Attribution-based risk
	switch (attribution.type) {
		case "CEX":
			score += 1;
			reasons.push("Linked to centralized exchange");
			break;
		case "DEX":
			score += 5;
			reasons.push("Linked to decentralized exchange");
			break;
	}

	// Category-based risk
	for (const { category } of categories) {
		switch (category.code) {
			case 7:
				score += 15;
				reasons.push(`High-risk service (${category.label})`);
				break;
			case 4:
				score += 50;
				reasons.push(`Watchlisted category (${category.label})`);
				break;
			default:
				break;
		}
	}

	// Tag-based risk
	if (tags.length > 0) {
		const tagIndex = tags.findIndex(
			({ tag }) => tag.type === "tx_class" && tag.name === "high_count",
		);
		if (tagIndex > -1) {
			score += 5;
			reasons.push("High volume activity detected");
		}
	}

	if (score > 100) score = 100;

	let level: RiskResult["level"] = "low";
	if (score >= 70) level = "high";
	else if (score >= 40) level = "medium";

	return { level, score, reasons };
}
