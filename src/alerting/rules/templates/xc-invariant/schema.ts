import z from "zod";
import { level } from "../common/schema";

const IssuanceSubscriptions = [
	{
		id: "hyperion:polkadot-hydration_xcm",
		name: "XCM Polkadot → Hydration",
	},
	{
		id: "hyperion:astar-hydration_xcm",
		name: "XCM Astar → Hydration",
	},
	{
		id: "hyperion:bifrost-hydration_xcm",
		name: "XCM Bifrost → Hydration",
	},
	{
		id: "hyperion:polkadot-bifrost_xcm",
		name: "XCM Polkadot → Bifrost",
	},
	{
		id: "hyperion:polkadot-astar_xcm",
		name: "XCM Polkadot → Astar",
	},
	{
		id: "hyperion:polkadot-moonbeam_xcm",
		name: "XCM Polkadot → Moonbeam",
	},
	{
		id: "hyperion:hydration-polkadot_xcm",
		name: "XCM Hydration → Polkadot",
	},
	{
		id: "hyperion:hydration-astar_xcm",
		name: "XCM Hydration → Astar",
	},
	{
		id: "hyperion:hydration-moonbeam_xcm",
		name: "XCM Hydration → Moonbeam",
	},
	{
		id: "hyperion:moonbeam-bifrost_xcm",
		name: "XCM Moonbeam → Bifrost",
	},
	{
		id: "hyperion:moonbeam-hydration_xcm",
		name: "XCM Moonbeam → Hydration",
	},
	{
		id: "hyperion:moonbeam-astar_xcm",
		name: "XCM Moonbeam → Astar",
	},
	{
		id: "hyperion:astar-bifrost_xcm",
		name: "XCM Astar → Bifrost",
	},
	{
		id: "hyperion:astar-moonbeam_xcm",
		name: "XCM Astar → Moonbeam",
	},
	{
		id: "hyperion:bifrost-polkadot_xcm",
		name: "XCM Bifrost → Polkadot",
	},
	{
		id: "hyperion:bifrost-astar_xcm",
		name: "XCM Bifrost → Astar",
	},
	{
		id: "hyperion:bifrost-moonbeam_xcm",
		name: "XCM Bifrost → Moonbeam",
	},
	{
		id: "hyperion:ethereum-polkadot_snowbridge",
		name: "Snowbridge Polkadot → Ethereum",
	},
	{
		id: "hyperion:kusama-polkadot_xcm",
		name: "XCM Kusama → Polkadot",
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
	help: "Select a bridge route to monitor the backing on the reserve chain against the issued supply on the remote chain.",
};

const assetsMeta = {
	label: "Assets",
	options: [
		{
			label: "ASTR",
			value: "ASTR",
		},
		{
			label: "AAVE",
			value: "AAVE",
		},
		{
			label: "BNC",
			value: "BNC",
		},
		{
			label: "BNCS",
			value: "BNCS",
		},
		{
			label: "CGT2.0",
			value: "CGT2.0",
		},
		{
			label: "DAI",
			value: "DAI",
		},
		{
			label: "DOT",
			value: "DOT",
		},
		{
			label: "ENA",
			value: "ENA",
		},
		{
			label: "ETH",
			value: "ETH",
		},
		{
			label: "EURC",
			value: "EURC",
		},
		{
			label: "FIL",
			value: "FIL",
		},
		{
			label: "GLMR",
			value: "GLMR",
		},
		{
			label: "KSM",
			value: "KSM",
		},
		{
			label: "LDO",
			value: "LDO",
		},
		{
			label: "LINK",
			value: "LINK",
		},
		{
			label: "PAXG",
			value: "PAXG",
		},
		{
			label: "PRIME",
			value: "PRIME",
		},
		{
			label: "SKY",
			value: "SKY",
		},
		{
			label: "SUI",
			value: "SUI",
		},
		{
			label: "tBTC",
			value: "tBTC",
		},
		{
			label: "TONCOIN",
			value: "TONCOIN",
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
			label: "USDC (snowbridge)",
			value: "USDC (snowbridge)",
		},
		{
			label: "USDT (snowbridge)",
			value: "USDT (snowbridge)",
		},
		{
			label: "USDC (wormhole)",
			value: "USDC (wormhole)",
		},
		{
			label: "USDT (wormhole)",
			value: "USDT (wormhole)",
		},
		{
			label: "vASTR",
			value: "vASTR",
		},
		{
			label: "vBNC",
			value: "vBNC",
		},
		{
			label: "vDOT",
			value: "vDOT",
		},
		{
			label: "vFIL",
			value: "vFIL",
		},
		{
			label: "vGLMR",
			value: "vGLMR",
		},
		{
			label: "vMANTA",
			value: "vMANTA",
		},
		{
			label: "WBTC",
			value: "WBTC",
		},
		{
			label: "WETH",
			value: "WETH",
		},
		{
			label: "wstETH",
			value: "wstETH",
		},
	].sort((a, b) => a.label.localeCompare(b.label)),
	multiple: true,
	help: "Optional list of asset symbols to monitor for reserve/remote balance divergence.",
};

export const schema = z.object({
	level,
	subscriptionId: z.enum(subscriptionIds).meta(subscriptionMeta),
	assetSymbols: z.array(z.string()).optional().meta(assetsMeta),
	hThreshold: z.number().min(0).max(1).meta({
		label: "Alert Threshold",
		decimals: true,
		unit: "%",
		help: "How big the difference between reserve and issued assets must be to trigger an alert. Values range from 0 (no difference) to 1 (100% difference). For example, 0.02 means an alert triggers if issued assets are roughly 2% higher than reserve assets.",
	}),
	minConsecutive: z.number().min(0).max(50).meta({
		label: "Minimum Consecutive Deficit Ticks",
		help: "Number of consecutive checks the deviation must persist before triggering an alert. Each check happens whenever the reserve or issued balance changes onchain. For example, 3 means the difference must exceed the threshold across 3 consecutive balance updates to trigger an alert.",
	}),
});

export type Config = z.infer<typeof schema>;
