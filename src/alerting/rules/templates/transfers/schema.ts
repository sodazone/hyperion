import z from "zod";
import {
	categoriesMeta,
	includePublicEntitiesMeta,
	level,
	networks,
	tagsMeta,
} from "../common/schema";

export type LocalEntityData = {
	address: string | Uint8Array;
	tags?: string[];
	categories?: number[];
};

export type LocalData = {
	addresses: Set<string>;
	entities: Record<string, LocalEntityData>;
};

export const schema = z.object({
	level,
	minUsd: z.number().min(0).meta({
		label: "Threshold",
		suffix: "USD",
		placeholder: "10000",
		help: "Transfers ≥ this amount will trigger the alert.",
	}),
	categories: z.array(z.number()).optional().meta(categoriesMeta),
	includePublicEntities: z
		.boolean()
		.default(true)
		.meta(includePublicEntitiesMeta),
	tags: z.array(z.string()).optional().meta(tagsMeta),
	assetSymbols: z.string().optional().meta({
		label: "Asset Symbols",
		help: "Comma-separated list of asset symbols. Case-insensitive and spaces are automatically trimmed.",
	}),
	networks,
});

export type Config = z.infer<typeof schema>;
