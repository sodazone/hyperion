import z from "zod";

import { createDriftSchema, level } from "../../common";

export type FeatureCategory = "dex" | "lending" | "lst";

interface NetworkDefinition {
	label: string;
	value: string;
	supports: FeatureCategory[];
}

const ALL_NETWORKS: NetworkDefinition[] = [
	{
		label: "Hydration",
		value: "urn:ocn:polkadot:2034",
		supports: ["dex", "lending"],
	},
	{
		label: "Bifrost",
		value: "urn:ocn:polkadot:2030",
		supports: ["lst"],
	},
	{
		label: "Polkadot Asset Hub",
		value: "urn:ocn:polkadot:1000",
		supports: ["dex"],
	},
	{
		label: "Acala",
		value: "urn:ocn:polkadot:2000",
		supports: ["dex", "lst"],
	},
];

function getSupportedNetworks(category: FeatureCategory) {
	return {
		label: "Networks",
		options: ALL_NETWORKS.filter((net) => net.supports.includes(category)).map(
			({ label, value }) => ({ label, value }),
		),
		multiple: true,
		help: "Applies to all supported networks by default. If specified, only selected networks will be monitored.",
	};
}

export const schemas = {
	dex: z.object({
		level,
		networks: z.array(z.string()).optional().meta(getSupportedNetworks("dex")),
		...createDriftSchema({
			metricName: "TVL",
			dropHelp:
				"Alerts if TVL drops rapidly relative to the TWAP baseline. Set lower to catch exploits early.",
			spikeHelp:
				"Alerts if TVL spikes rapidly relative to the TWAP baseline. Set higher to filter out normal whale deposits.",
			drawdownHelp:
				"Alerts if TVL suffers a sustained cumulative drawdown over 24 hours.",
		}),
		minTvlUSD: z.number().min(0).meta({
			label: "Minimum Liquidity Floor",
			unit: "USD",
			help: "Ignore pools with a TVL below this USD amount.",
		}),
	}),
	lending: z.object({
		level,
		networks: z
			.array(z.string())
			.optional()
			.meta(getSupportedNetworks("lending")),
		minSolvencyRatio: z.number().min(0).meta({
			label: "Minimum Solvency Ratio",
			decimals: true,
			unit: "x",
			help: "Trigger an alert if the market maker's total assets divided by total liabilities drops below this threshold.",
		}),
		maxUtilization: z.number().min(0).max(1).meta({
			label: "Maximum Pool Utilization",
			decimals: true,
			unit: "%",
			help: "Alert if capital utilization (borrowed funds / supplied funds) exceeds this ceiling.",
		}),
	}),
	liquidStaking: z.object({
		level,
		networks: z.array(z.string()).optional().meta(getSupportedNetworks("lst")),
		minExchangeRate: z.number().positive().optional().meta({
			decimals: true,
			label: "Minimum Exchange Rate",
			help: "The absolute lowest acceptable protocol exchange rate. Input as a decimal value (e.g., 1.05 means 1.05 underlying assets per 1 LST). An alert triggers immediately if the live exchange rate drops below this floor.",
		}),
		maxExchangeRate: z.number().positive().optional().meta({
			decimals: true,
			label: "Maximum Exchange Rate",
			help: "The absolute highest acceptable protocol exchange rate. Input as a decimal value (e.g., 2.15 means 2.15 underlying assets per 1 LST). An alert triggers immediately if the live exchange rate exceeds this ceiling.",
		}),
		...createDriftSchema({
			metricName: "exchange rate",
			dropHelp:
				"Triggers an alert if the exchange rate drops sharply within a short window compared to its Time-Weighted Average Price (TWAP). Input as a decimal fraction (e.g., 0.05 for a 5% sudden drop).",
			spikeHelp:
				"Triggers an alert if the exchange rate spikes sharply within a short window compared to its Time-Weighted Average Price (TWAP). Input as a decimal fraction (e.g., 0.1 for a 10% sudden increase).",
			drawdownHelp:
				"Triggers an alert if the exchange rate experiences a sustained decline relative to its rolling 24-hour peak. Input as a decimal fraction (e.g., 0.15 for a 15% sustained drawdown). Helps identify slow, continuous drain.",
		}),
	}),
};

export type Configs = {
	dex: z.infer<typeof schemas.dex>;
	lending: z.infer<typeof schemas.lending>;
	liquidStaking: z.infer<typeof schemas.liquidStaking>;
};
