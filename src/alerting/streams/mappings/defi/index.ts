import type { defi, Message } from "@sodazone/ocelloids-client";
import type {
	DefiEvent,
	DefiEventAsset,
	DefiLiquidityEvent,
	LiquidityAsset,
	LiquidStakingPayload,
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

	let label: string | undefined;

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

	let mappedStaking: LiquidStakingPayload | undefined;
	if (payload.liquidStaking) {
		const { liquidStaking } = payload;
		const stakedAsset = mappedAssets.find((a) => a.role === "staked");
		const liquidAsset = mappedAssets.find((a) => a.role === "lst");

		label = liquidAsset?.symbol;
		mappedStaking = {
			exchangeRate: liquidStaking.exchangeRate,
			stakingNetwork: liquidStaking.stakingNetwork,
			totalStaked: liquidStaking.totalStaked,
			liquidAsset,
			stakedAsset,
		};
	}

	const { metadata } = message;
	const chainURN = metadata.networkId ?? payload.networkId;

	const resolvedLabel =
		label ??
		deriveMarketLabel({
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
			label: resolvedLabel,
			subscriptionId: metadata.subscriptionId,
			suppliedUSD: payload.suppliedUSD,
			assets: mappedAssets,
			lending: mappedLending,
			liquidStaking: mappedStaking,
		},
	};
}

export function mapDefiEvent(
	message: Message<defi.DefiSubscriptionPayload>,
): DefiEvent | null {
	if (!message || !message.payload) {
		return null;
	}

	const raw = message.payload;

	if (raw.type !== "event") {
		return null;
	}

	const basePayload = {
		id: raw.id,
		marketId: raw.marketId,
	};

	const origin = {
		chainURN: message.metadata.networkId,
		blockHash: raw.blockHash ?? undefined,
		blockNumber: raw.blockNumber ?? undefined,
		txHash: raw.txHash ?? undefined,
		timestamp: message.metadata.blockTimestamp ?? message.metadata.timestamp,
		protocol: raw.protocol,
	};

	switch (raw.name) {
		case "swap": {
			return {
				type: "defi-event",
				origin,
				payload: {
					...basePayload,
					name: "swap",
					data: {
						origin: raw.data.origin,
						in: mapToDefiEventAsset(raw.data.in),
						out: mapToDefiEventAsset(raw.data.out),
					},
				},
			};
		}
		case "lst_mint": {
			return {
				type: "defi-event",
				origin,
				payload: {
					...basePayload,
					name: raw.name,
					data: {
						provider: raw.data.provider,
						supplied: mapToDefiEventAsset(raw.data.supplied),
						minted: mapToDefiEventAsset(raw.data.minted),
					},
				},
			};
		}
		case "lst_redeem":
		case "mint":
		case "burn": {
			return {
				type: "defi-event",
				origin,
				payload: {
					...basePayload,
					name: raw.name,
					data: {
						provider: raw.data.provider,
						assets: Array.isArray(raw.data.assets)
							? raw.data.assets.map(mapToDefiEventAsset)
							: [],
					},
				},
			};
		}

		case "borrow":
		case "repay":
		case "withdraw":
		case "supply": {
			return {
				type: "defi-event",
				origin,
				payload: {
					...basePayload,
					name: raw.name,
					data: {
						provider: raw.data.provider,
						assets: Array.isArray(raw.data.assets)
							? raw.data.assets.map(mapToDefiEventAsset)
							: [],
					},
				},
			};
		}

		case "liquidate": {
			return {
				type: "defi-event",
				origin,
				payload: {
					...basePayload,
					name: "liquidate",
					data: {
						origin: raw.data.origin,
						counterparty: raw.data.counterparty,
						debt: mapToDefiEventAsset(raw.data.debt),
						collateral: mapToDefiEventAsset(raw.data.collateral),
					},
				},
			};
		}

		default:
			console.warn("[mapDefiEvent] Unsupported event name encountered", raw);
			return null;
	}
}

function mapToDefiEventAsset(sourceAsset: any): DefiEventAsset {
	return {
		assetId: sourceAsset?.assetId ?? sourceAsset?.address ?? "unknown",
		symbol: sourceAsset?.symbol ?? "UNKNOWN",
		amount: sourceAsset?.amount?.toString() ?? "0",
		amountUSD:
			sourceAsset?.amountUSD !== undefined
				? Number(sourceAsset.amountUSD)
				: undefined,
	};
}
