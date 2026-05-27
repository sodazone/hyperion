const MARKET_LABEL_OVERRIDES: Record<string, string> = {
	hydration0x0000000000000000000000000000000000000000: "Omnipool",
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

	// 1. Check explicit string match overrides first
	if (MARKET_LABEL_OVERRIDES[lowerId]) {
		return MARKET_LABEL_OVERRIDES[lowerId];
	}

	// 2. Extract and clean asset symbols
	const symbols = (payload.assets ?? []).map((a) => a.symbol).filter(Boolean);

	if (symbols.length === 0) {
		return payload.marketId; // Fallback to raw ID if no assets exist
	}

	// 3. Category formatting rules
	if (payload.category === "money-market") {
		// Lending markets are typically isolated around a primary collateral or reserve asset
		return `${symbols[0]} Market`;
	}

	// Exchanges/Stability Pools: Join multiple pair paths cleanly (e.g., DOT/USDC)
	return symbols.join("/");
}
