import type { Alert, AlertPayload } from "@/db";
import type { DefiLiquidityEvent, RuleDefinition } from "../../../types";
import { makeNetworks } from "../../common/helpers";
import { type Configs, schemas, subscriptionIds } from "./schema";

const ruleName = "exchange-liquidity";
const STATE_KEY = "dex_tvl";

export interface ExchangeAlertPayload extends AlertPayload {
	kind: "exchange-liquidity";
	protocol: string;
	marketId: string;
	tvlUSD: number;
	driftPercent: number;
}

interface MarketState {
	lastTvl: number;
	lastAlertedTvl: number;
}

export const ExchangeLiquidityRule: RuleDefinition<
	DefiLiquidityEvent,
	{ driftPercent: number },
	Configs["dex"]
> = {
	id: ruleName,
	title: "DEX Liquidity Alerts",
	description: "Alerts on TVL shocks or progressive liquidity drains.",
	schema: schemas.dex,
	defaults: {},
	autoDependencies: subscriptionIds.map((id) => ({
		kind: "defi-liquidity",
		subscriptionId: id,
	})),

	matcher: async (event, { config, global: { state } }) => {
		if (
			event.type !== "defi-liquidity" ||
			event.payload.category !== "exchange"
		)
			return { matched: false };

		if (
			config.networks?.length &&
			!config.networks.includes(event.origin.chainURN)
		)
			return { matched: false };
		const payload = event.payload;
		if (
			config.protocols?.length &&
			!config.protocols.includes(payload.protocol)
		)
			return { matched: false };

		const currentTvl = payload.suppliedUSD;
		if (currentTvl < (config.minTvlUSD ?? 10000)) return { matched: false };

		const ns = `${ruleName}:${payload.protocol}:${payload.marketId}`;
		const marketState = (state.get(ns, STATE_KEY) ?? {
			lastTvl: currentTvl,
			lastAlertedTvl: 0,
		}) as MarketState;

		let shouldAlert = false;

		const tickDrift =
			(currentTvl - marketState.lastTvl) / Math.max(marketState.lastTvl, 1);

		const cumulativeCascadeShift =
			marketState.lastAlertedTvl > 0
				? (currentTvl - marketState.lastAlertedTvl) / marketState.lastAlertedTvl
				: 0;

		if (Math.abs(tickDrift) >= (config.driftThreshold ?? 0.15)) {
			shouldAlert = true;
		} else if (
			marketState.lastAlertedTvl > 0 &&
			Math.abs(cumulativeCascadeShift) >= (config.stepThreshold ?? 0.1)
		) {
			shouldAlert = true;
		} else if (
			marketState.lastAlertedTvl === 0 &&
			Math.abs(tickDrift) >= (config.stepThreshold ?? 0.1)
		) {
			shouldAlert = true;
		}

		marketState.lastTvl = currentTvl;
		if (shouldAlert) {
			marketState.lastAlertedTvl = currentTvl;
		}
		state.set(ns, STATE_KEY, marketState);

		return shouldAlert
			? { matched: true, data: { driftPercent: tickDrift } }
			: { matched: false };
	},

	alertTemplate: (event, { config }, data) => {
		const payload = event.payload;
		const direction = data.driftPercent < 0 ? "↘" : "↗";
		return {
			timestamp: Date.now(),
			level: config.level,
			name: ruleName,
			remark: `TVL: $${payload.suppliedUSD.toLocaleString()}`,
			networks: makeNetworks(event),
			message: [
				["t", `Exchange TVL Shift ${direction} on ${payload.protocol}`],
				["t", `Market: ${payload.marketId}`],
				["t", `Shift: ${(data.driftPercent * 100).toFixed(2)}%`],
			],
			payload: {
				kind: "exchange-liquidity",
				protocol: payload.protocol,
				marketId: payload.marketId,
				tvlUSD: payload.suppliedUSD,
				driftPercent: data.driftPercent,
			},
		} as Alert<ExchangeAlertPayload>;
	},
};
