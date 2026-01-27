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
	sanctioned: SanctionsResult;
	risk: RiskResult;
	attribution: ReturnType<HyperionDB["getCategories"]>;
	tags: ReturnType<HyperionDB["getTags"]>;
};
