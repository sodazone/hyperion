import z from "zod";
import { level } from "../common/schema";

const IssuanceSubscriptions = [
	{
		id: "hyperion:assethub-DOT-hydration",
		name: "DOT AssetHub Hydration",
		description: "Tracks DOT crosschain reserve and remote balance events.",
	},
	{
		id: "hyperion:assethub-tBTC-hydration",
		name: "tBTC AssetHub Hydration",
		description: "Tracks tBTC crosschain reserve and remote balance events.",
	},
	{
		id: "hyperion:assethub-DOT-bifrost",
		name: "DOT AssetHub Bifrost",
		description: "Tracks DOT crosschain reserve and remote balance events.",
	},
] as const;

const subscriptionIds = IssuanceSubscriptions.map(
	(s) => s.id,
) as readonly string[];

export const schema = z.object({
	level,
	subscriptionId: z.enum(subscriptionIds).meta({
		label: "Subscription",
		help: "Select the subscription to monitor crosschain balances.",
	}),
	kSlack: z.number().min(0).meta({
		label: "Slack per tick",
		help: "Small allowance to ignore minor fluctuations when computing the cumulative deficit.",
	}),
	hThreshold: z.number().min(0).meta({
		label: "Deficit Threshold",
		help: "Total cumulative deficit between reserve and remote that triggers an alert.",
	}),
	minConsecutive: z.number().min(0).meta({
		label: "Minimum Consecutive Deficit Ticks",
		help: "Number of consecutive ticks with deficit before accumulating towards an alert.",
	}),
	maxStep: z.number().min(1).optional().meta({
		label: "Maximum Step (Spike Tolerance)",
		help: "Caps the impact of a single large transfer to avoid false alerts on one-off spikes.",
	}),
});

export type Config = z.infer<typeof schema>;
