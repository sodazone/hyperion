import z from "zod";
import { topLevelCategories } from "@/intel/mapping";

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

export type FieldMeta = {
	label?: string;
	help?: string;
	unit?: string;
	suffix?: string;
	placeholder?: string;
	step?: number;
	input?: "text" | "number" | "select" | "checkbox";
	options?: { label: string; value: string | number }[];
	multiple?: boolean;
};

export const schema = z.object({
	infoUsd: z.number().min(0).meta({
		label: "Informative",
		unit: "$",
		step: 1000,
		placeholder: "10000",
		help: "Ignore transfers below this value",
	}),
	warningUsd: z.number().min(0).meta({
		label: "Warning",
		unit: "$",
		step: 1000,
		placeholder: 100000,
		help: "Transfers above this value trigger a warning",
	}),
	criticalUsd: z.number().min(0).meta({
		label: "Critical",
		unit: "$",
		step: 1000,
		placeholder: 1000000,
		help: "Transfers above this value trigger critical alerts",
	}),
	riskCategories: z.array(z.number()).meta({
		label: "Risk Categories",
		options: [
			...topLevelCategories.map((c) => ({
				label: c.label,
				value: c.category.toString(),
			})),
		],
		multiple: true,
		help: "Select risk categories to be raised as critical",
	}),
});

export type Config = z.infer<typeof schema>;
