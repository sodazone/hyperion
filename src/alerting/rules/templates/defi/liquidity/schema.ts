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
			help: "Alerts if the protocol exchange rate drops below this threshold.",
		}),
		maxExchangeRate: z.number().positive().optional().meta({
			decimals: true,
			label: "Maximum Exchange Rate",
			help: "Alerts if the protocol exchange rate exceeds this threshold.",
		}),
		...createDriftSchema({
			metricName: "exchange rate",
			dropHelp: "Alerts on rapid exchange rate drops relative to TWAP.",
			spikeHelp: "Alerts on rapid exchange rate spikes relative to TWAP.",
			drawdownHelp:
				"Alerts if exchange rate suffers a sustained drawdown over 24 hours.",
		}),
	}),
};

export type Configs = {
	dex: z.infer<typeof schemas.dex>;
	lending: z.infer<typeof schemas.lending>;
	liquidStaking: z.infer<typeof schemas.liquidStaking>;
};
