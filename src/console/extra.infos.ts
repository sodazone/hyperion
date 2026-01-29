const BASE_CDN =
	"https://cdn.jsdelivr.net/gh/sodazone/intergalactic-asset-metadata";
const BASE_ASSETS_URL = `${BASE_CDN}/v2`;

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
	let lastErr: unknown;
	for (let i = 0; i <= retries; i++) {
		try {
			return await fn();
		} catch (e) {
			lastErr = e;
		}
	}
	throw lastErr;
}

type NetworkInfo = {
	runtimeChain: string;
	chainDecimals?: number[];
	chainTokens?: string[];
	urn: string;
};

const CHAINS: NetworkInfo[] = [
	{
		runtimeChain: "Ethereum Mainnet",
		urn: "urn:ocn:ethereum:1",
		chainDecimals: [18],
		chainTokens: ["ETH"],
	},
	{
		runtimeChain: "Ethereum Sepolia (Testnet)",
		urn: "urn:ocn:ethereum:11155111",
		chainDecimals: [18],
		chainTokens: ["ETH"],
	},
	{ runtimeChain: "Bitcoin", urn: "urn:ocn:bitcoin:0" },
	{ runtimeChain: "Sui", urn: "urn:ocn:sui:0x35834a8a" },
	{ runtimeChain: "Solana", urn: "urn:ocn:solana:101" },
	{ runtimeChain: "Celo", urn: "urn:ocn:ethereum:42220" },
	{ runtimeChain: "Base", urn: "urn:ocn:ethereum:8453" },
	{ runtimeChain: "Arbitrum", urn: "urn:ocn:ethereum:42161" },
	{ runtimeChain: "Optimism", urn: "urn:ocn:ethereum:10" },
	{ runtimeChain: "BNB Chain", urn: "urn:ocn:ethereum:56" },
	{ runtimeChain: "Polygon", urn: "urn:ocn:ethereum:137" },
	{ runtimeChain: "Avalanche", urn: "urn:ocn:ethereum:43114" },
	{ runtimeChain: "Fantom", urn: "urn:ocn:ethereum:250" },
	{ runtimeChain: "Harmony", urn: "urn:ocn:ethereum:1666600000" },
	{ runtimeChain: "Aptos", urn: "urn:ocn:aptos:1" },
];

let networkInfos: Record<string, NetworkInfo> | null = null;
let chainIcons: string[] | null = null;
const iconCache: Record<string, string | null> = {};

function initNetworkInfos() {
	return Object.fromEntries(CHAINS.map((c) => [c.urn, c]));
}

async function fetchChainIcons() {
	const { items } = await withRetry(async () => {
		const res = await fetch(`${BASE_CDN}/chains-v2.json`);
		return res.json();
	});
	return items as string[];
}

export function resolveNetworkIcon(urn: string) {
	if (iconCache[urn] !== undefined) {
		return iconCache[urn];
	}

	if (!chainIcons) return null;

	const [, , chain, id = "0"] = urn.split(":");
	const path = `${chain}/${id}`;

	const match = chainIcons.find((p) => p.slice(0, p.lastIndexOf("/")) === path);

	const icon = match ? `${BASE_ASSETS_URL}/${match}` : null;
	iconCache[urn] = icon;

	return icon;
}

export type NetworkInfos = Awaited<ReturnType<typeof loadExtraInfos>>;

export async function loadExtraInfos() {
	if (!networkInfos) {
		networkInfos = initNetworkInfos();
	}

	if (!chainIcons) {
		chainIcons = await fetchChainIcons();
	}

	return {
		resolveNetworkName: (urn: string) =>
			networkInfos?.[urn]?.runtimeChain ?? null,
		resolveNetworkIcon,
	};
}
