export type SanctionsResult = {
	sanctioned: boolean;
	lists: string[];
};

export type RiskResult = {
	level: "low" | "medium" | "high" | "critical";
	score: number;
	reasons: string[];
};

export type LabeledCategory = {
	category: { code: number; label?: string };
	subcategory: { code: number; label?: string };
};

export type AddressAnalysis = {
	sanctioned: SanctionsResult;
	risk: RiskResult;
	attribution: Array<LabeledCategory>;
	tags: Array<string>;
};
