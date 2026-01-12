const NetworkURNMap: Record<string, number> = {
	// 2 bytes
	// Polkadot ecosystem
	"urn:ocn:polkadot:0": 0x0000,
	"urn:ocn:polkadot:1000": 0x0001,
	"urn:ocn:polkadot:1002": 0x0002,
	"urn:ocn:polkadot:1005": 0x0003,
	"urn:ocn:polkadot:2000": 0x0004,
	"urn:ocn:polkadot:2004": 0x0005,
	"urn:ocn:polkadot:2006": 0x0006,
	"urn:ocn:polkadot:2030": 0x0007,
	"urn:ocn:polkadot:2031": 0x0008,
	"urn:ocn:polkadot:2032": 0x0009,
	"urn:ocn:polkadot:2034": 0x000a,
	"urn:ocn:polkadot:3367": 0x000b,
	"urn:ocn:polkadot:3369": 0x000c,

	// Kusama ecosystem
	"urn:ocn:kusama:0": 0x0100,
	"urn:ocn:kusama:1000": 0x0101,
	"urn:ocn:kusama:1002": 0x0102,
	"urn:ocn:kusama:1005": 0x0103,

	// Ethereum & EVM networks
	"urn:ocn:ethereum:1": 0x0200,
	"urn:ocn:ethereum:56": 0x0201,
	"urn:ocn:ethereum:8453": 0x0202,
	"urn:ocn:ethereum:10": 0x0203,
	"urn:ocn:ethereum:42161": 0x0204,

	// Test networks
	"urn:ocn:paseo:0": 0x0300,
	"urn:ocn:paseo:1000": 0x0301,

	// Bitcoin
	"urn:ocn:bitcoin:0": 0x0400,

	// Litecoin
	"urn:ocn:litecoin:0": 0x0500,
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
