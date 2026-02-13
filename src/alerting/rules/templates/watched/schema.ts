import z from "zod";
import {
	categoriesMeta,
	includePublicEntitiesMeta,
	level,
	networks,
	tagsMeta,
} from "../common/schema";

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
	categories: z.array(z.number()).meta(categoriesMeta),
	includePublicEntities: z
		.boolean()
		.default(false)
		.meta(includePublicEntitiesMeta),
	tags: z.array(z.string()).optional().meta(tagsMeta),
	networks,
});

export type Config = z.infer<typeof schema>;
