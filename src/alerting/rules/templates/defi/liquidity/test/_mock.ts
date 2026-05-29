import type { DefiLiquidityEvent } from "@/alerting/rules/types";

export function mockLendingEvent(
	overrides: {
		protocol?: string;
		marketId?: string;
		type?: string;
		category?: string;
		isPaused?: boolean;
		tokenDeficitUSD?: number;
		solvencyRatio?: number;
		utilization?: number;
		chainURN?: string;
	} = {},
): DefiLiquidityEvent {
	return {
		type: (overrides.type ?? "defi-liquidity") as any,
		origin: {
			chainURN: overrides.chainURN ?? "urn:ocn:polkadot:1000",
		},
		payload: {
			category: overrides.category ?? "money-market",
			protocol: overrides.protocol ?? "aave",
			marketId: overrides.marketId ?? "USDC-pool",
			lending: {
				isPaused: overrides.isPaused ?? false,
				utilization: overrides.utilization,
				health: {
					tokenDeficitUSD: overrides.tokenDeficitUSD ?? 0,
					solvencyRatio: overrides.solvencyRatio ?? 1.1,
				},
			},
		} as any,
	};
}

export function mockExchangeEvent(
	overrides: {
		protocol?: string;
		marketId?: string;
		type?: string;
		category?: string;
		suppliedUSD?: number;
		chainURN?: string;
	} = {},
): DefiLiquidityEvent {
	return {
		type: (overrides.type ?? "defi-liquidity") as any,
		origin: {
			chainURN: overrides.chainURN ?? "urn:ocn:polkadot:1000",
		},
		payload: {
			category: overrides.category ?? "exchange",
			protocol: overrides.protocol ?? "uniswap-v3",
			marketId: overrides.marketId ?? "DOT-USDT-pool",
			suppliedUSD: overrides.suppliedUSD ?? 100_000,
		} as any,
	};
}
