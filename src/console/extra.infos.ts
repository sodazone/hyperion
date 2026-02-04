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
	{ runtimeChain: "Bitcoin Cash", urn: "urn:ocn:bitcoin-cash:0" },
	{ runtimeChain: "Bitcoin Gold", urn: "urn:ocn:bitcoin-gold:0" },
	{ runtimeChain: "BSV", urn: "urn:ocn:bitcoin-sv:0" },
	{ runtimeChain: "Litecoin", urn: "urn:ocn:litecoin:0" },
	{ runtimeChain: "Solana", urn: "urn:ocn:solana:0" },
	{ runtimeChain: "Monero", urn: "urn:ocn:monero:0" },
	{ runtimeChain: "Dash", urn: "urn:ocn:dash:0" },
	{ runtimeChain: "Zcash", urn: "urn:ocn:zcash:0" },
	{ runtimeChain: "Tron", urn: "urn:ocn:tron:0" },
	{ runtimeChain: "Verge", urn: "urn:ocn:verge:0" },
	{ runtimeChain: "Ripple", urn: "urn:ocn:ripple:0" },
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
	{ runtimeChain: "Ethereum Classic", urn: "urn:ocn:ethereum-classic:61" },
	{ runtimeChain: "Polkadot Relay", urn: "urn:ocn:polkadot:0" },
	{ runtimeChain: "Polkadot Asset Hub", urn: "urn:ocn:polkadot:1000" },
	{ runtimeChain: "Polkadot Bridge Hub", urn: "urn:ocn:polkadot:1002" },
	{ runtimeChain: "Polkadot People Chain", urn: "urn:ocn:polkadot:1005" },
	{ runtimeChain: "Polkadot Coretime", urn: "urn:ocn:polkadot:1005" },
	{ runtimeChain: "Acala", urn: "urn:ocn:polkadot:2000" },
	{ runtimeChain: "Moonbeam", urn: "urn:ocn:polkadot:2004" },
	{ runtimeChain: "Astar", urn: "urn:ocn:polkadot:2006" },
	{ runtimeChain: "Bifrost", urn: "urn:ocn:polkadot:2030" },
	{ runtimeChain: "Centrifuge", urn: "urn:ocn:polkadot:2031" },
	{ runtimeChain: "Interlay", urn: "urn:ocn:polkadot:2032" },
	{ runtimeChain: "Hydration", urn: "urn:ocn:polkadot:2034" },
	{ runtimeChain: "Hyperbridge", urn: "urn:ocn:polkadot:3367" },
	{ runtimeChain: "Mythos", urn: "urn:ocn:polkadot:3369" },
	{ runtimeChain: "Kusama Relay", urn: "urn:ocn:kusama:0" },
	{ runtimeChain: "Kusama Asset Hub", urn: "urn:ocn:kusama:1000" },
	{ runtimeChain: "Kusama Bridge Hub", urn: "urn:ocn:kusama:1002" },
	{ runtimeChain: "Kusama People Chain", urn: "urn:ocn:kusama:1005" },
	{ runtimeChain: "Paseo Relay", urn: "urn:ocn:paseo:0" },
	{ runtimeChain: "Paseo Asset Hub", urn: "urn:ocn:paseo:1000" },
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
