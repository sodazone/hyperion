import z from "zod";
import { level, networks } from "../../common/schema";

const DefiLiquiditySubscriptions = [
	{
		id: "hyperion:hydration-liquidity",
		name: "Hydration",
		urn: "urn:ocn:polkadot:2034",
	},
] as const;

export const subscriptionIds = DefiLiquiditySubscriptions.map(
	(s) => s.id,
) as readonly string[];

// TODO: supported protocols
const protocols = z.array(z.string()).optional().meta({
	label: "Protocols",
	input: "select",
	multiple: true,
	help: "Filter by protocol name.",
});

export const schemas = {
	dex: z.object({
		level,
		networks,
		protocols,
		driftThreshold: z.number().min(0).max(1).meta({
			label: "Drift Threshold",
			decimals: true,
			unit: "%",
			help: "Alerts instantly if TVL changes by this much in a single update (e.g. 0.15 = 15%).",
		}),
		stepThreshold: z.number().min(0).max(1).meta({
			label: "Step Threshold",
			decimals: true,
			unit: "%",
			help: "Alerts when TVL continues to drop or spike by this percentage from the last alert, catching multi-step drains.",
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
		protocols,
		minSolvencyRatio: z.number().min(0).default(1.05),
		maxUtilization: z.number().min(0).max(1).default(0.95),
		alertOnBadDebt: z.boolean().default(true),
	}),
};

export type Configs = {
	dex: z.infer<typeof schemas.dex>;
	mm: z.infer<typeof schemas.mm>;
};
