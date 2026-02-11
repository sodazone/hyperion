import z from "zod";
import { level, networks, riskCategories, riskTags } from "../common/schema";

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
	riskCategories,
	riskTags,
	networks,
});

export type Config = z.infer<typeof schema>;
