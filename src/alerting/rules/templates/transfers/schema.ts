import z from "zod";
import { level, networks } from "../common/schema";

export type LocalEntityData = {
	address: string | Uint8Array;
	exchangeName?: string;
	walletType?: string;
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
	networks,
});

export type Config = z.infer<typeof schema>;
