import { CAT } from "@/intel/mapping";
import type { AddressCategory, AddressTag } from "../types";
import type { RiskResult, SanctionsResult } from "./types";

export function computeRisk(
	sanctions: SanctionsResult,
	categories: Array<AddressCategory>,
	tags: Array<AddressTag>,
): RiskResult {
	const reasons: string[] = [];
	let score = 0;

	// Hard stop: sanctions
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

			case CAT.ANONYMIZING:
				score += 50;
				reasons.push(subcategory.label);
				break;

			case CAT.COMPROMISED:
				// Victim, but high operational risk
				switch (subcategory.code) {
					case 0x0001:
						score += 50;
						reasons.push("Compromised wallet");
						break;
					case 0x0004:
						score += 50;
						reasons.push("Drained wallet (victim)");
						break;
					case 0x0005:
						score += 40;
						reasons.push("Leaked private key");
						break;
					default:
						score += 30;
						reasons.push(subcategory.label);
						break;
				}
				break;

			case CAT.AUTOMATED:
				// Behavioral, not malicious
				switch (subcategory.code) {
					case 0x0002:
						score += 30;
						reasons.push("MEV bot");
						break;
					case 0x0003:
						score += 15;
						reasons.push("Market making bot");
						break;
					default:
						score += 20;
						reasons.push(subcategory.label);
						break;
				}
				break;

			case CAT.HIGH_RISK:
				score += 15;
				reasons.push(category.label);
				break;

			case CAT.EXCHANGE:
				if (subcategory.code === 0x0002) {
					score += 10;
					reasons.push(subcategory.label);
				}
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
	if (score >= 90) level = "critical";
	else if (score >= 70) level = "high";
	else if (score >= 40) level = "medium";

	return { level, score, reasons };
}
