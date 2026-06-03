import type { Alert, AlertPayload } from "@/db";
import { formatNumberSI } from "@/utils/amounts";
import type { DefiLiquidityEvent, RuleDefinition } from "../../../types";
import { makeNetworks } from "../../common/helpers";
import { type Configs, schemas } from "./schema";

const RULE_NAME = "exchange-liquidity";
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
	id: RULE_NAME,
	title: "DEX Liquidity",
	description: "Alerts on TVL shocks or progressive liquidity drains/spikes.",
	schema: schemas.dex,
	defaults: {
		driftThresholdDrop: 0.15,
		driftThresholdSpike: 0.5,
		stepThreshold: 0.1,
		minTvlUSD: 0,
	},
	autoDependencies: [{ kind: "defi-liquidity" }],

	matcher: async (event, { config, id, global: { state } }) => {
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

		const currentTvl = payload.suppliedUSD;
		if (currentTvl < (config.minTvlUSD ?? 10000)) return { matched: false };

		const scope = `${RULE_NAME}:${id}:${payload.protocol}:${payload.marketId}`;

		const marketState = (state.get(scope, STATE_KEY) ?? {
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

		const stepThresh = config.stepThreshold ?? 0.1;

		// instant
		if (
			tickDrift < 0 &&
			Math.abs(tickDrift) >= (config.driftThresholdDrop ?? 0.15)
		) {
			shouldAlert = true;
		} else if (
			tickDrift > 0 &&
			tickDrift >= (config.driftThresholdSpike ?? 0.5)
		) {
			shouldAlert = true;
		}
		// multi-step
		else if (
			marketState.lastAlertedTvl > 0 &&
			Math.abs(cumulativeCascadeShift) >= stepThresh
		) {
			shouldAlert = true;
		} else if (
			marketState.lastAlertedTvl === 0 &&
			Math.abs(tickDrift) >= stepThresh
		) {
			shouldAlert = true;
		}

		marketState.lastTvl = currentTvl;
		if (shouldAlert) {
			marketState.lastAlertedTvl = currentTvl;
		}

		state.set(scope, STATE_KEY, marketState);

		return shouldAlert
			? { matched: true, data: { driftPercent: tickDrift } }
			: { matched: false };
	},

	alertTemplate: (event, { config }, data) => {
		const payload = event.payload;
		const direction = data.driftPercent < 0 ? "down" : "up";
		return {
			timestamp: Date.now(),
			level: config.level,
			name: RULE_NAME,
			remark: `TVL: $${formatNumberSI(payload.suppliedUSD, 2)}`,
			networks: makeNetworks(event),
			message: [
				["t", `DEX TVL ${direction} on ${payload.protocol}`],
				["t", `${(data.driftPercent * 100).toFixed(2)}%`],
			],
			payload: {
				kind: "exchange-liquidity",
				protocol: payload.protocol,
				marketId: payload.marketId,
			},
		} as Alert<ExchangeAlertPayload>;
	},
};
