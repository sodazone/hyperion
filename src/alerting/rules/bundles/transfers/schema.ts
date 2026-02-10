import z from "zod";
import { NetworkMap, topLevelCategories } from "@/intel/mapping";

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

export const schema = z
	.object({
		networks: z
			.array(z.string())
			.optional()
			.meta({
				label: "Networks",
				options: [
					...NetworkMap.entries().map(([key, value]) => ({
						label: key,
						value: value.toString(),
					})),
				],
				multiple: true,
				help: "By default applies to all networks. If specified, only transfers on the selected networks will be monitored.",
			}),
		infoUsd: z.number().min(0).meta({
			label: "Informative",
			suffix: "USD",
			placeholder: "10000",
			help: "Transfers ≥ this amount and < warning will trigger as INFO.",
		}),
		warningUsd: z.number().min(0).meta({
			label: "Warning",
			suffix: "USD",
			placeholder: 100000,
			help: "Transfers ≥ this amount and < critical will triiger as WARNING.",
		}),
		criticalUsd: z.number().min(0).meta({
			label: "Critical",
			suffix: "USD",
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
