import z from "zod";
import { categories, level, networks, tags } from "../common/schema";

export type LocalEntityData = {
	address: string;
	addressFormatted: string;
	role: "seen" | "watched";
	categories?: number[];
	subcategories?: number[];
	tags?: string[];
};

export type LocalData = {
	entities: LocalEntityData[];
};

export const schema = z.object({
	level,
	categories,
	includePublicEntities: z.boolean().default(false).meta({
		label: "Include Public Registry",
		help: "If public entities are included in the classification.",
	}),
	tags,
	networks,
});

export type Config = z.infer<typeof schema>;
