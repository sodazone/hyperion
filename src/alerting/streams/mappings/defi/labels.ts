const MARKET_LABEL_OVERRIDES: Record<string, string> = {
	"hydration.omnipool0x6d6f646c6f6d6e69706f6f6c0000000000000000000000000000000000000000":
		"Omnipool",
};

/**
 * Derives a clean market label using symbols or override mappings.
 */
export function deriveMarketLabel(payload: {
	category: string;
	marketId: string;
	protocol: string;
	assets: any[];
}): string {
	const lowerId = `${payload.protocol}${payload.marketId}`.toLowerCase();

	if (MARKET_LABEL_OVERRIDES[lowerId]) {
		return MARKET_LABEL_OVERRIDES[lowerId];
	}

	const symbols = (payload.assets ?? []).map((a) => a.symbol).filter(Boolean);

	if (symbols.length === 0) {
		return payload.marketId;
	}

	if (payload.category === "money-market") {
		return symbols[0];
	}

	return symbols.join("/");
}
