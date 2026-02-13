import { LabeledBimap } from "./bimap";

function createCategoriesMap() {
	const categories = new LabeledBimap();

	// Category 0x0001 - Centralized Exchange
	categories.add(0x0001, 0x0000, "Exchange");
	categories.add(0x0001, 0x0001, "Mandatory KYC and AML");
	categories.add(0x0001, 0x0002, "Optional KYC and AML");
	categories.add(0x0001, 0x0003, "Inactive");
	categories.add(0x0001, 0x0004, "OTC");

	// Category 0x0002 - DeFi Protocol
	categories.add(0x0002, 0x0000, "DeFi Protocol");
	categories.add(0x0002, 0x0001, "Swap");
	categories.add(0x0002, 0x0002, "Lending");
	categories.add(0x0002, 0x0003, "Staking");
	categories.add(0x0002, 0x0005, "Perpetuals");
	categories.add(0x0002, 0x0006, "Derivatives");
	categories.add(0x0002, 0x0007, "Insurance");
	categories.add(0x0002, 0x0008, "Pool");

	// Category 0x0003 - Infrastructure
	categories.add(0x0003, 0x0000, "Infrastructure");
	categories.add(0x0003, 0x0001, "Bridge");
	categories.add(0x0003, 0x0002, "Oracle");

	// Category 0x0004 - Sanctions
	categories.add(0x0004, 0x0000, "Sanctions");
	categories.add(0x0004, 0x0001, "OFAC Sanctioned Entity");
	categories.add(0x0004, 0x0002, "EU Sanctioned Entity");

	// Category 0x0005 - Regulatory Oversight
	categories.add(0x0005, 0x0000, "Regulatory Oversight");
	categories.add(0x0005, 0x0001, "AML/CFT Obligations");
	categories.add(0x0005, 0x0002, "KYC Provider");
	categories.add(0x0005, 0x0003, "Regulated Entity");

	// Category 0x0006 - Services
	categories.add(0x0006, 0x0000, "Services");
	categories.add(0x0006, 0x0001, "Financial Service");
	categories.add(0x0006, 0x0002, "Custody");
	categories.add(0x0006, 0x0003, "Market Making");

	// Category 0x0007 - High Risk Organization
	categories.add(0x0007, 0x0000, "High Risk Organization");
	categories.add(0x0007, 0x0001, "High Risk Exchanges");

	// Category 0x0008 - Anonymizing Services
	categories.add(0x0008, 0x0000, "Anonymizing Services");
	categories.add(0x0008, 0x0001, "Decentralized Mixer");
	categories.add(0x0008, 0x0002, "Centralized Mixer");

	// Category 0x0009 - Cybercrime
	categories.add(0x0009, 0x0000, "Cybercrime");
	categories.add(0x0009, 0x0001, "Ponzi Scheme");
	categories.add(0x0009, 0x0002, "Scam");
	categories.add(0x0009, 0x0003, "Ransomware");
	categories.add(0x0009, 0x0004, "Malware");
	categories.add(0x0009, 0x0005, "Phishing");
	categories.add(0x0009, 0x0006, "Darknet Market");
	categories.add(0x0009, 0x0007, "Exploit Attacker");
	categories.add(0x0009, 0x0008, "Drainer Wallet");
	categories.add(0x0009, 0x0009, "Rug Pull Operator");
	categories.add(0x0009, 0x000a, "Scam Operator");
	categories.add(0x0009, 0x000b, "Key Theft Attacker");

	// Category 0x000A - Automated Actors
	categories.add(0x000a, 0x0000, "Automated Actors");
	categories.add(0x000a, 0x0001, "Arbitrage Bot");
	categories.add(0x000a, 0x0002, "MEV Bot");
	categories.add(0x000a, 0x0003, "Market Making Bot");
	categories.add(0x000a, 0x0004, "Liquidation Bot");
	categories.add(0x000a, 0x0005, "Trading Bot");

	// Category 0x000B - Compromised & Exposed
	categories.add(0x000b, 0x0000, "Compromised & Exposed");
	categories.add(0x000b, 0x0001, "Compromised Wallet");
	categories.add(0x000b, 0x0002, "Suspected Compromise");
	categories.add(0x000b, 0x0003, "Phished Victim");
	categories.add(0x000b, 0x0004, "Drained Wallet (Victim)");
	categories.add(0x000b, 0x0005, "Leaked Private Key");
	categories.add(0x000b, 0x0006, "Dusting Victim");

	return categories;
}

const categories = createCategoriesMap();

export const CategoriesMap = {
	getLabel: (cat: number, sub: number = 0x0) => categories.getLabel(cat, sub),
	entries: () => categories.entries(),
};

export const CAT = {
	EXCHANGE: 0x0001,
	DEFI: 0x0002,
	INFRA: 0x0003,
	SANCTIONS: 0x0004,
	REGULATORY: 0x0005,
	EXTERNAL: 0x0006,
	HIGH_RISK: 0x0007,
	ANONYMIZING: 0x0008,
	CYBERCRIME: 0x0009,
	AUTOMATED: 0x000a,
	COMPROMISED: 0x000b,
} as const;

export const topLevelCategories = CategoriesMap.entries()
	.filter((e) => e.subcategory === 0x0000)
	.sort((a, b) =>
		a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
	);
