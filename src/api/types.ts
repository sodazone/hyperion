import type { HyperionDB } from "@/db";

export type SanctionsResult = {
	sanctioned: boolean;
	lists: string[];
};

export type RiskResult = {
	level: "low" | "medium" | "high" | "critical";
	score: number;
	reasons: string[];
};

export type AddressAnalysis = {
	address: string;
	networkId: number;
	sanctioned: SanctionsResult;
	attribution: Array<{
		type: string;
		detail?: string;
		code: string;
	}>;
	risk: RiskResult;
	categories: ReturnType<HyperionDB["getCategories"]>;
	tags: unknown[];
};
