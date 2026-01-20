import type { HyperionDB } from "@/db";

export type SanctionsResult = {
	sanctioned: boolean;
	lists: string[];
};

export type AttributionResult = {
	type: "CEX" | "DEX" | "INFRA" | "SERVICE" | "UNKNOWN";
	label?: string;
	source?: string;
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
	attribution: AttributionResult;
	risk: RiskResult;
	categories: ReturnType<HyperionDB["getCategories"]>;
	tags: unknown[];
};
