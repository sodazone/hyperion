import { CAT } from "@/mapping";
import type { TagValue } from "@/mapping/tags";
import type { AddressCategory } from "@/types";
import type { RiskResult, SanctionsResult } from "./types";

export function computeRisk(
	sanctions: SanctionsResult,
	categories: Array<AddressCategory>,
	tags: Array<TagValue>,
): RiskResult {
	const reasons: string[] = [];
	let score = 0;

	// Sanctions
	if (sanctions.sanctioned) {
		reasons.push("Address is sanctioned");
		return { level: "critical", score: 100, reasons };
	}

	// Category-based risk
	for (const { category, subcategory } of categories) {
		switch (category.code) {
			case CAT.CYBERCRIME:
				score += 100;
				reasons.push(`Linked to cybercrime (${subcategory.label})`);
				break;
			case CAT.SANCTIONS:
				score += 100;
				reasons.push(`Linked to sanctioned entity (${subcategory.label})`);
				break;
			case CAT.EXCHANGE:
				if (subcategory.code === 0x0002) {
					score += 10;
					reasons.push(subcategory.label);
				}
				break;
			case CAT.HIGH_RISK:
				score += 15;
				reasons.push(category.label);
				break;
			case CAT.ANONYMIZING:
				score += 50;
				reasons.push(category.label);
				break;
			default:
				break;
		}
	}

	// Tag-based risk
	if (tags.length > 0) {
		const tagIndex = tags.findIndex(
			(tag) => tag.type === "tx_class" && tag.name === "high_count",
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
