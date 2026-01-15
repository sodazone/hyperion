import { PUBLIC_OWNER } from "@/db";
import { encodeCategorizedKey, encodeValue } from "@/db/encoding/codec";
import { addressTo32Bytes, NetworkMap } from "@/mapping";
import { type HyperionRecord, KeyFamily } from "@/types";
import type { OfacResult } from "./parser";

// TODO map properly!
const ofacSymbolsToNetwork: Record<string, string | Record<string, string>> = {
	XBT: "urn:ocn:bitcoin:0",
	BCH: "urn:ocn:bitcoin-cash:0",
	BTG: "urn:ocn:bitcoin-gold:0",
	BSV: "urn:ocn:bitcoin-sv:0",
	XVG: "urn:ocn:verge:0",
	LTC: "urn:ocn:litecoin:0",
	ETH: "urn:ocn:ethereum:1",
	XMR: "urn:ocn:monero:0",
	ETC: "urn:ocn:ethereum-classic:61",
	DASH: "urn:ocn:dash:0",
	ZEC: "urn:ocn:zcash:0",
	XRP: "urn:ocn:ripple:0",
	TRX: "urn:ocn:tron:0",
	ARB: "urn:ocn:ethereum:42161",
	BSC: "urn:ocn:ethereum:56",
	USDC: {
		ERC20: "urn:ocn:ethereum:1",
	},
	SOL: "urn:ocn:solana:0",
	USDT: {
		ERC20: "urn:ocn:ethereum:1",
		TRC20: "urn:ocn:tron:0",
		OMNI: "urn:ocn:bitcoin:0",
	},
} as const;

function getNetworkForSymbol({
	symbol,
	address,
}: {
	symbol: string;
	address: string;
}): string | undefined {
	const candidates = ofacSymbolsToNetwork[symbol];

	if (!candidates) return undefined;

	if (typeof candidates === "string") {
		return candidates;
	}

	if (symbol === "USDT") {
		if (address.startsWith("0x")) return candidates.ERC20;
		if (address.startsWith("T")) return candidates.TRC20;
		if (/^[13]/.test(address)) return candidates.OMNI;
		if (address.startsWith("bc1")) return candidates.OMNI;
	}

	if (symbol === "USDC") {
		if (address.startsWith("0x")) return candidates.ERC20;
	}

	throw new Error(`Unsupported address format for symbol ${symbol} ${address}`);
}

export function ofacToHyperionKey(r: OfacResult) {
	const network = getNetworkForSymbol({ symbol: r.symbol, address: r.address });
	if (!network) throw new Error(`Unsupported symbol ${r.symbol}`);

	const networkId = NetworkMap.fromURN(network);
	if (networkId === undefined) throw new Error(`Unknown network ${network}`);

	const address = addressTo32Bytes(r.address);
	const family = KeyFamily.Categorized;
	const categoryCode = 0x0004;
	const subcategoryCode = 0x0001;

	return encodeCategorizedKey({
		owner: PUBLIC_OWNER,
		family,
		address,
		networkId,
		categoryCode,
		subcategoryCode,
	});
}

export function ofacToHyperion(r: OfacResult): HyperionRecord {
	const network = getNetworkForSymbol({ symbol: r.symbol, address: r.address });

	if (!network) {
		throw new Error(`Unsupported symbol ${r.symbol}`);
	}

	return {
		key: ofacToHyperionKey(r),
		value: encodeValue(r),
	};
}
