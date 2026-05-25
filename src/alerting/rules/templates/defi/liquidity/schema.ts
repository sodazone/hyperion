import z from "zod";
import { level, networks } from "../../common/schema";

export const schemas = {
	dex: z.object({
		level,
		networks,
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
		stepThreshold: z.number().min(0).max(1).meta({
			label: "Step Threshold",
			decimals: true,
			unit: "%",
			help: "Alerts if TVL continues drifting in either direction by this % from the last alert.",
		}),
		minTvlUSD: z.number().min(0).meta({
			label: "Minimum Liquidity Floor",
			unit: "USD",
			help: "Ignore pools with a TVL below this USD amount.",
		}),
	}),
	mm: z.object({
		level,
		networks,
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
		alertOnBadDebt: z.boolean().meta({
			label: "Alert on Bad Debt",
			help: "Instantly trigger high-severity notifications if the pool accumulates uncollateralized or unrecoverable debt.",
		}),
	}),
};

export type Configs = {
	dex: z.infer<typeof schemas.dex>;
	mm: z.infer<typeof schemas.mm>;
};
