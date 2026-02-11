import z from "zod";
import { topLevelCategories } from "@/intel/mapping";
import { level, networks } from "../common/schema";

export type LocalEntityData = {
	address: string;
	addressFormatted: string;
	role: "seen" | "flagged";
	categories?: number[];
	subcategories?: number[];
	tags?: string[];
};

export type LocalData = {
	entities: LocalEntityData[];
};

export const schema = z.object({
	level,
	riskCategories: z.array(z.number()).meta({
		label: "Risk Categories",
		options: [
			...topLevelCategories.map((c) => ({
				label: c.label,
				value: c.category.toString(),
			})),
		],
		multiple: true,
		help: "If a activity matches any of the selected risk categories.",
	}),
	riskTags: z.array(z.string()).meta({
		label: "Risk Tags",
		help: "If a activity matches any of the selected risk tags.",
	}),
	networks,
});

export type Config = z.infer<typeof schema>;
