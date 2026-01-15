const NetworkURNMap: Record<string, number> = {
	// ────────────────────────────────
	// Reserved / special (0x0000–0x00FF)
	// ────────────────────────────────
	any: 0x0000, // global / wildcard

	// ────────────────────────────────
	// Polkadot ecosystem (0x0100–0x01FF)
	// ────────────────────────────────
	"urn:ocn:polkadot:0": 0x0100,
	"urn:ocn:polkadot:1000": 0x0101,
	"urn:ocn:polkadot:1002": 0x0102,
	"urn:ocn:polkadot:1005": 0x0103,
	"urn:ocn:polkadot:2000": 0x0104,
	"urn:ocn:polkadot:2004": 0x0105,
	"urn:ocn:polkadot:2006": 0x0106,
	"urn:ocn:polkadot:2030": 0x0107,
	"urn:ocn:polkadot:2031": 0x0108,
	"urn:ocn:polkadot:2032": 0x0109,
	"urn:ocn:polkadot:2034": 0x010a,
	"urn:ocn:polkadot:3367": 0x010b,
	"urn:ocn:polkadot:3369": 0x010c,

	// ────────────────────────────────
	// Kusama ecosystem (0x0200–0x02FF)
	// ────────────────────────────────
	"urn:ocn:kusama:0": 0x0200,
	"urn:ocn:kusama:1000": 0x0201,
	"urn:ocn:kusama:1002": 0x0202,
	"urn:ocn:kusama:1005": 0x0203,

	// ────────────────────────────────
	// Ethereum & EVM networks (0x0300–0x03FF)
	// ────────────────────────────────
	"urn:ocn:ethereum:1": 0x0300, // Ethereum Mainnet
	"urn:ocn:ethereum:56": 0x0301, // BSC
	"urn:ocn:ethereum:8453": 0x0302, // Base
	"urn:ocn:ethereum:10": 0x0303, // Optimism
	"urn:ocn:ethereum:42161": 0x0304, // Arbitrum
	"urn:ocn:ethereum-classic:61": 0x0305, // Ethereum Classic

	// ────────────────────────────────
	// Test networks (0x0400–0x04FF)
	// ────────────────────────────────
	"urn:ocn:paseo:0": 0x0400,
	"urn:ocn:paseo:1000": 0x0401,

	// ────────────────────────────────
	// Bitcoin-family / UTXO chains (0x0500–0x05FF)
	// ────────────────────────────────
	"urn:ocn:bitcoin:0": 0x0500,
	"urn:ocn:bitcoin-cash:0": 0x0501,
	"urn:ocn:bitcoin-gold:0": 0x0502,
	"urn:ocn:bitcoin-sv:0": 0x0503,

	// ────────────────────────────────
	// Other UTXO chains (0x0600–0x06FF)
	// ────────────────────────────────
	"urn:ocn:litecoin:0": 0x0600,
	"urn:ocn:dash:0": 0x0601,
	"urn:ocn:zcash:0": 0x0602,
	"urn:ocn:verge:0": 0x0603,

	// ────────────────────────────────
	// Account-based non-EVM chains (0x0700–0x07FF)
	// ────────────────────────────────
	"urn:ocn:tron:0": 0x0700,
	"urn:ocn:ripple:0": 0x0701,
	"urn:ocn:solana:0": 0x0702,
	"urn:ocn:monero:0": 0x0703,
} as const;

const NetworkURNMapReverse: Record<number, string> = Object.fromEntries(
	Object.entries(NetworkURNMap).map(([k, v]) => [v, k]),
);

export const NetworkMap = {
	fromURN(urn: string): number | undefined {
		return NetworkURNMap[urn];
	},
	toURN(networkId: number): string | undefined {
		return NetworkURNMapReverse[networkId];
	},
	entries() {
		return NetworkURNMap;
	},
};
