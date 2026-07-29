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
	description: "Alerts on TVL liquidity drops and spikes.",
	schema: schemas.dex,
	defaults: {
		driftThresholdDrop: 0.15,
		driftThresholdSpike: 0.5,
		minTvlUSD: 0,
	},
	autoDependencies: [{ kind: "defi-liquidity" }],

	matcher: async (event, { config, id, global: { state } }) => {
		if (
			event.type !== "defi-liquidity" ||
			event.payload.category !== "exchange"
		) {
			return { matched: false };
		}

		if (
			config.networks?.length &&
			!config.networks.includes(event.origin.chainURN)
		) {
			return { matched: false };
		}

		const payload = event.payload;
		const currentTvl = payload.suppliedUSD;

		const scope = `${RULE_NAME}:${id}:${payload.protocol}:${payload.marketId}`;

		const marketState = (state.get(scope, STATE_KEY) ?? {
			lastTvl: currentTvl,
			lastAlertedTvl: currentTvl,
		}) as MarketState;

		const baselineTvl = marketState.lastAlertedTvl;
		marketState.lastTvl = currentTvl;

		const minTvl = config.minTvlUSD ?? ExchangeLiquidityRule.defaults.minTvlUSD;

		if (currentTvl < minTvl) {
			marketState.lastAlertedTvl = currentTvl;

			state.set(scope, STATE_KEY, marketState);
			return { matched: false };
		}

		const tickDrift =
			baselineTvl > 0 ? (currentTvl - baselineTvl) / baselineTvl : 0;

		const dropThreshold =
			config.driftThresholdDrop ??
			ExchangeLiquidityRule.defaults.driftThresholdDrop;
		const spikeThreshold =
			config.driftThresholdSpike ??
			ExchangeLiquidityRule.defaults.driftThresholdSpike;

		let shouldAlert = false;

		if (tickDrift < 0 && Math.abs(tickDrift) >= dropThreshold) {
			shouldAlert = true;
		} else if (tickDrift > 0 && tickDrift >= spikeThreshold) {
			shouldAlert = true;
		}

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
		const isDrop = data.driftPercent < 0;
		const direction = isDrop ? "down" : "up";
		const thresholdUsed = isDrop
			? config.driftThresholdDrop
			: config.driftThresholdSpike;
		return {
			timestamp: Date.now(),
			level: config.level,
			name: RULE_NAME,
			remark: `TVL ${direction} ≥ ${(thresholdUsed * 100).toFixed(2)}%`,
			networks: makeNetworks(event),
			message: [
				["t", `DEX TVL ${direction} on ${payload.protocol}`],
				["a", `${(data.driftPercent * 100).toFixed(2)}%`],
				["a", `($${formatNumberSI(payload.suppliedUSD, 2)})`],
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
