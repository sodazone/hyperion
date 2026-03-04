import z from "zod";
import { level } from "../common/schema";

const IssuanceSubscriptions = [
	{
		id: "hyperion:polkadot-DOT-hydration_xcm",
		name: "XCM DOT Polkadot Hydration",
	},
	{
		id: "hyperion:polkadot-DOT-bifrost_xcm",
		name: "XCM DOT Polkadot Bifrost",
	},
	{
		id: "hyperion:polkadot-DOT-astar_xcm",
		name: "XCM DOT Polkadot Astar",
	},
	{
		id: "hyperion:polkadot-DOT-kusama_xcm",
		name: "XCM DOT Polkadot Kusama",
	},
	{
		id: "hyperion:polkadot-DOT-moonbeam_xcm",
		name: "XCM DOT Polkadot Moonbeam",
	},
] as const;

const subscriptionIds = IssuanceSubscriptions.map(
	(s) => s.id,
) as readonly string[];

const subscriptionMeta = {
	label: "Subscription",
	options: IssuanceSubscriptions.map(({ id, name }) => ({
		label: name,
		value: id,
	})),
	multiple: false,
	help: "Select the subscription to monitor crosschain balances.",
};

export const schema = z.object({
	level,
	subscriptionId: z.enum(subscriptionIds).meta(subscriptionMeta),
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
