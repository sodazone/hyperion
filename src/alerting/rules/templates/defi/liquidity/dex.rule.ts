import type { Alert, AlertPayload } from "@/db";
import { formatNumberSI } from "@/utils/amounts";
import type { DefiLiquidityEvent, RuleDefinition } from "../../../types";
import { evaluateDelta, makeNetworks } from "../../common";
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

		const result = evaluateDelta({
			state,
			scope,
			key: STATE_KEY,
			currentValue: currentTvl,
			dropThreshold:
				config.driftThresholdDrop ??
				ExchangeLiquidityRule.defaults.driftThresholdDrop,
			spikeThreshold:
				config.driftThresholdSpike ??
				ExchangeLiquidityRule.defaults.driftThresholdSpike,
			minFloor: config.minTvlUSD ?? ExchangeLiquidityRule.defaults.minTvlUSD,
		});

		if (!result.matched) {
			return { matched: false };
		}

		return {
			matched: true,
			data: { driftPercent: result.driftPercent },
		};
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
			remark: `TVL ${direction} ≥ ${((thresholdUsed ?? 0) * 100).toFixed(2)}%`,
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
