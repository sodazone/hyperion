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

export const schema = z
	.object({
		infoUsd: z.number().min(0).meta({
			label: "Informative",
			unit: "$",
			step: 1000,
			placeholder: "10000",
			help: "Transfers ≥ this amount and < warning will trigger as INFO.",
		}),
		warningUsd: z.number().min(0).meta({
			label: "Warning",
			unit: "$",
			step: 1000,
			placeholder: 100000,
			help: "Transfers ≥ this amount and < critical will triiger as WARNING.",
		}),
		criticalUsd: z.number().min(0).meta({
			label: "Critical",
			unit: "$",
			step: 1000,
			placeholder: 1000000,
			help: "Transfers ≥ this amount will trigger as CRITICAL.",
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
			help: "If a transfer matches any of the selected risk categories and is ≥ informative, it will trigger as CRITICAL.",
		}),
	})
	.refine(
		(data) =>
			data.infoUsd < data.warningUsd && data.warningUsd < data.criticalUsd,
		{
			message: "Thresholds must increase: info < warning < critical",
		},
	);

export type Config = z.infer<typeof schema>;
