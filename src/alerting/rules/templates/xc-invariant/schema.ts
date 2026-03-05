import z from "zod";
import { level } from "../common/schema";

const IssuanceSubscriptions = [
	{
		id: "hyperion:polkadot-hydration_xcm",
		name: "XCM Polkadot Hydration",
	},
	{
		id: "hyperion:astar-hydration_xcm",
		name: "XCM Astar Hydration",
	},
	{
		id: "hyperion:bifrost-hydration_xcm",
		name: "XCM Bifrost Hydration",
	},
	{
		id: "hyperion:polkadot-bifrost_xcm",
		name: "XCM Polkadot Bifrost",
	},
	{
		id: "hyperion:polkadot-astar_xcm",
		name: "XCM Polkadot Astar",
	},
	{
		id: "hyperion:polkadot-moonbeam_xcm",
		name: "XCM Polkadot Moonbeam",
	},
	{
		id: "hyperion:hydration-polkadot_xcm",
		name: "XCM Hydration Polkadot",
	},
	{
		id: "hyperion:hydration-astar_xcm",
		name: "XCM Hydration Astar",
	},
	{
		id: "hyperion:hydration-moonbeam_xcm",
		name: "XCM Hydration Moonbeam",
	},
	{
		id: "hyperion:moonbeam-bifrost_xcm",
		name: "XCM Moonbeam Bifrost",
	},
	{
		id: "hyperion:moonbeam-hydration_xcm",
		name: "XCM Moonbeam Hydration",
	},
	{
		id: "hyperion:moonbeam-astar_xcm",
		name: "XCM Moonbeam Astar",
	},
	{
		id: "hyperion:astar-bifrost_xcm",
		name: "XCM Astar Bifrost",
	},
	{
		id: "hyperion:astar-moonbeam_xcm",
		name: "XCM Astar Moonbeam",
	},
	{
		id: "hyperion:bifrost-polkadot_xcm",
		name: "XCM Bifrost Polkadot",
	},
	{
		id: "hyperion:bifrost-astar_xcm",
		name: "XCM Bifrost Astar",
	},
	{
		id: "hyperion:bifrost-moonbeam_xcm",
		name: "XCM Bifrost Moonbeam",
	},
	{
		id: "hyperion:ethereum-polkadot_snowbridge",
		name: "Snowbridge Polkadot Ethereum",
	},
	{
		id: "hyperion:kusama-polkadot_xcm",
		name: "XCM Kusama Polkadot",
	},
] as const;

export const subscriptionIds = IssuanceSubscriptions.map(
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

const assetsMeta = {
	label: "Assets",
	options: [
		{
			label: "DOT",
			value: "DOT",
		},
		{
			label: "PAXG",
			value: "PAXG",
		},
		{
			label: "LINK",
			value: "LINK",
		},
		{
			label: "tBTC",
			value: "tBTC",
		},
		{
			label: "ASTR",
			value: "ASTR",
		},
		{
			label: "GLMR",
			value: "GLMR",
		},
		{
			label: "USDt",
			value: "USDt",
		},
		{
			label: "USDC",
			value: "USDC",
		},
		{
			label: "vDOT",
			value: "vDOT",
		},
		{
			label: "BNC",
			value: "BNC",
		},
		{
			label: "BNCS",
			value: "BNCS",
		},
	].sort((a, b) => a.label.localeCompare(b.label)),
	multiple: true,
	help: "Filter the monitored asset symbols.",
};

export const schema = z.object({
	level,
	subscriptionId: z.enum(subscriptionIds).meta(subscriptionMeta),
	assetSymbols: z.array(z.string()).optional().meta(assetsMeta),
	kSlack: z.number().min(0).meta({
		label: "Slack per tick",
		help: "Small allowance to ignore minor fluctuations when computing the cumulative deficit.",
	}),
	hThreshold: z.number().min(0).meta({
		label: "Deficit Threshold",
		decimals: true,
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
