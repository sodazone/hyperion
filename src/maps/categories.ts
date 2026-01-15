import { LabeledBimap } from "./bimap";

const categories = new LabeledBimap();

// Category 0x0001 - Centralized Exchange
categories.add(0x0001, 0x0000, "Exchange");
categories.add(0x0001, 0x0001, "User Wallet");
categories.add(0x0001, 0x0002, "Hot Wallet");
categories.add(0x0001, 0x0003, "Cold Wallet");
categories.add(0x0001, 0x0004, "Staking Wallet");

// Category 0x0002 - DeFi Protocol
categories.add(0x0002, 0x0000, "DeFi Protocol");
categories.add(0x0002, 0x0001, "Swap");
categories.add(0x0002, 0x0002, "Lending");
categories.add(0x0002, 0x0003, "Staking");
categories.add(0x0002, 0x0005, "Perpetuals");
categories.add(0x0002, 0x0006, "Derivatives");
categories.add(0x0002, 0x0007, "Insurance");

// Category 0x0003 - Infrastructure
categories.add(0x0003, 0x0000, "Infrastructure");
categories.add(0x0003, 0x0001, "Bridge");
categories.add(0x0003, 0x0002, "Oracle");

// Category 0x0004 - Sanctions
categories.add(0x0004, 0x0000, "Sanctions");
categories.add(0x0004, 0x0001, "OFAC Sanctioned Entity");
categories.add(0x0004, 0x0002, "EU Sanctioned Entity");

// Category 0x0005 - Compliance
categories.add(0x0005, 0x0000, "Compliance");
categories.add(0x0005, 0x0001, "FATF AML Monitoring");
categories.add(0x0005, 0x0002, "KYC Provider");
categories.add(0x0005, 0x0003, "Risk / Compliance Service");

export const CategoriesMap = {
	getLabel(cat: number, sub: number = 0x0) {
		return categories.getLabel(cat, sub);
	},
	entries: categories.entries,
};
