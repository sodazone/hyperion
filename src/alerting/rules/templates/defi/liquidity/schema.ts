import z from "zod";
import { level } from "../../common/schema";

const supportedNetworks = {
	label: "Networks",
	options: [
		/*{
			label: "Bifrost",
			value: "urn:ocn:polkadot:2030",
		},*/
		{
			label: "Hydration",
			value: "urn:ocn:polkadot:2034",
		},
		{
			label: "Moonbeam",
			value: "urn:ocn:ethereum:1284",
		},
	],
	multiple: true,
	help: "Applies to all networks by default. If specified, only selected networks will be monitored.",
};

export const schemas = {
	dex: z.object({
		level,
		networks: z.array(z.string()).optional().meta(supportedNetworks),
		driftThresholdDrop: z.number().min(0).max(1).meta({
			label: "Drop Threshold",
			decimals: true,
			unit: "%",
			help: "Alerts if TVL drops by this much in one update. Set lower to catch exploits early.",
		}),
		driftThresholdSpike: z.number().min(0).max(1).meta({
			label: "Spike Threshold",
			decimals: true,
			unit: "%",
			help: "Alerts if TVL spikes by this much in one update. Set higher to filter out normal whale deposits.",
		}),
		minTvlUSD: z.number().min(0).meta({
			label: "Minimum Liquidity Floor",
			unit: "USD",
			help: "Ignore pools with a TVL below this USD amount.",
		}),

		windowMs: z.number().min(1_000).meta({
			label: "Rolling Window",
			unit: "ms",
			help: "The lookback duration. Compares the current value against the oldest data point inside this timeframe.",
		}),

		minTicks: z.number().min(1).meta({
			label: "Minimum Ticks",
			unit: "count",
			help: "The required number of data points inside the window before calculations trigger.",
		}),
	}),
	lending: z.object({
		level,
		networks: z.array(z.string()).optional().meta(supportedNetworks),
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
};

export type Configs = {
	dex: z.infer<typeof schemas.dex>;
	lending: z.infer<typeof schemas.lending>;
};
