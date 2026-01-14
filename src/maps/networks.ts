const NetworkURNMap: Record<string, number> = {
	any: 0x0000,
	// TODO: review ranges... maybe bigger? :D
	// ─────────────────────────────────────────────
	// Polkadot ecosystem (0x0001–0x00FF)
	// ─────────────────────────────────────────────
	"urn:ocn:polkadot:0": 0x0001,
	"urn:ocn:polkadot:1000": 0x0002,
	"urn:ocn:polkadot:1002": 0x0003,
	"urn:ocn:polkadot:1005": 0x0004,
	"urn:ocn:polkadot:2000": 0x0005,
	"urn:ocn:polkadot:2004": 0x0006,
	"urn:ocn:polkadot:2006": 0x0007,
	"urn:ocn:polkadot:2030": 0x0008,
	"urn:ocn:polkadot:2031": 0x0009,
	"urn:ocn:polkadot:2032": 0x000a,
	"urn:ocn:polkadot:2034": 0x000b,
	"urn:ocn:polkadot:3367": 0x000c,
	"urn:ocn:polkadot:3369": 0x000d,

	// ─────────────────────────────────────────────
	// Kusama ecosystem (0x0100–0x01FF)
	// ─────────────────────────────────────────────
	"urn:ocn:kusama:0": 0x0100,
	"urn:ocn:kusama:1000": 0x0101,
	"urn:ocn:kusama:1002": 0x0102,
	"urn:ocn:kusama:1005": 0x0103,

	// ─────────────────────────────────────────────
	// Ethereum & EVM networks (0x0200–0x02FF)
	// ─────────────────────────────────────────────
	"urn:ocn:ethereum:1": 0x0200, // Ethereum Mainnet
	"urn:ocn:ethereum:56": 0x0201, // BSC
	"urn:ocn:ethereum:8453": 0x0202, // Base
	"urn:ocn:ethereum:10": 0x0203, // Optimism
	"urn:ocn:ethereum:42161": 0x0204, // Arbitrum
	"urn:ocn:ethereum-classic:61": 0x0205, // Ethereum Classic

	// ─────────────────────────────────────────────
	// Test networks (0x0300–0x03FF)
	// ─────────────────────────────────────────────
	"urn:ocn:paseo:0": 0x0300,
	"urn:ocn:paseo:1000": 0x0301,

	// ─────────────────────────────────────────────
	// Bitcoin-family / UTXO chains (0x0400–0x04FF)
	// ─────────────────────────────────────────────
	"urn:ocn:bitcoin:0": 0x0400,
	"urn:ocn:bitcoin-cash:0": 0x0401,
	"urn:ocn:bitcoin-gold:0": 0x0402,
	"urn:ocn:bitcoin-sv:0": 0x0403,

	// ─────────────────────────────────────────────
	// Other UTXO chains (0x0500–0x05FF)
	// ─────────────────────────────────────────────
	"urn:ocn:litecoin:0": 0x0500,
	"urn:ocn:dash:0": 0x0501,
	"urn:ocn:zcash:0": 0x0502,
	"urn:ocn:verge:0": 0x0503,

	// ─────────────────────────────────────────────
	// Account-based non-EVM chains (0x0600–0x06FF)
	// ─────────────────────────────────────────────
	"urn:ocn:tron:0": 0x0600,
	"urn:ocn:ripple:0": 0x0601,
	"urn:ocn:solana:0": 0x0602,
	"urn:ocn:monero:0": 0x0603,
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
};
