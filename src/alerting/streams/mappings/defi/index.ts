import type { defi, Message } from "@sodazone/ocelloids-client";
import type {
	DefiLiquidityEvent,
	LiquidityAsset,
	MoneyMarketPayload,
} from "@/alerting/rules";
import { deriveMarketLabel } from "./labels";

export function mapDefiLiquidity(
	message: Message<defi.DefiSubscriptionPayload>,
): DefiLiquidityEvent | null {
	const payload = message.payload;

	if (payload.type !== "liquidity") {
		return null;
	}

	const mappedAssets: LiquidityAsset[] = (payload.assets ?? []).map(
		(asset) => ({
			assetId: asset.assetId,
			symbol: asset.symbol,
			decimals: asset.decimals,
			priceUSD: asset.priceUSD,
			role: asset.role,
			balances: {
				total: asset.balances?.total,
				available: asset.balances?.available,
				borrowed: asset.balances?.borrowed,
				holdingCap: asset.balances?.holdingCap,
				mintCap: asset.balances?.mintCap,
				reserves: asset.balances?.reserves ?? "0",
			},
		}),
	);

	let mappedLending: MoneyMarketPayload | undefined;
	if (payload.lending) {
		mappedLending = {
			utilization: payload.lending.utilization,
			borrowedUSD: payload.lending.borrowedUSD,
			borrowAPR: payload.lending.borrowAPR,
			supplyAPR: payload.lending.supplyAPR,
			isPaused: payload.lending.isPaused,
			canBorrow: payload.lending.canBorrow,
			borrowCap: payload.lending.borrowCap,
			supplyCap: payload.lending.supplyCap,
			health: payload.lending.health
				? {
						solvencyRatio: payload.lending.health.solvencyRatio,
						tokenDeficitUSD: payload.lending.health.tokenDeficitUSD,
					}
				: undefined,
		};
	}

	const { metadata } = message;
	const chainURN = metadata.networkId ?? payload.networkId;

	const resolvedMarketLabel = deriveMarketLabel({
		category: payload.category,
		marketId: payload.marketId,
		protocol: payload.protocol,
		assets: mappedAssets,
	});

	return {
		type: "defi-liquidity",
		origin: {
			chainURN,
		},
		payload: {
			type: "liquidity",
			category: payload.category,
			networkId: payload.networkId,
			protocol: payload.protocol,
			marketId: payload.marketId,
			label: resolvedMarketLabel,
			subscriptionId: metadata.subscriptionId,
			suppliedUSD: payload.suppliedUSD,
			assets: mappedAssets,
			lending: mappedLending,
		},
	};
}
