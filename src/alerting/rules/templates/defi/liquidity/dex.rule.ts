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
	reason: "instant-drop" | "instant-spike" | "cumulative-drawdown";
}

export const ExchangeLiquidityRule: RuleDefinition<
	DefiLiquidityEvent,
	{
		driftPercent: number;
		reason: ExchangeAlertPayload["reason"];
	},
	Configs["dex"]
> = {
	id: RULE_NAME,
	title: "DEX Liquidity",
	description:
		"Alerts on TWAP liquidity drifts and sustained cumulative pool drawdowns.",
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
			timestamp: event.origin.timestamp,
			dropThreshold:
				config.driftThresholdDrop ??
				ExchangeLiquidityRule.defaults.driftThresholdDrop,
			spikeThreshold:
				config.driftThresholdSpike ??
				ExchangeLiquidityRule.defaults.driftThresholdSpike,
			cumulativeDrawdownThreshold: config.cumulativeDrawdownThreshold,
			minFloor: config.minTvlUSD ?? ExchangeLiquidityRule.defaults.minTvlUSD,
			trailingWindowMs: 86_400_000, // 24h
		});

		if (!result.matched || !result.direction) {
			return { matched: false };
		}

		const reasonMap: Record<
			NonNullable<typeof result.direction>,
			ExchangeAlertPayload["reason"]
		> = {
			drop: "instant-drop",
			spike: "instant-spike",
			"cumulative-drawdown": "cumulative-drawdown",
		};

		return {
			matched: true,
			data: {
				driftPercent: result.driftPercent,
				reason: reasonMap[result.direction],
			},
		};
	},

	alertTemplate: (event, { config }, data) => {
		const payload = event.payload;

		const headers: Record<ExchangeAlertPayload["reason"], string> = {
			"instant-drop": "TWAP TVL Drop",
			"instant-spike": "TWAP TVL Spike",
			"cumulative-drawdown": "24h TVL Drawdown",
		};

		const formattedPct = `${(Math.abs(data.driftPercent) * 100).toFixed(2)}%`;
		const formattedUSD = `$${formatNumberSI(payload.suppliedUSD, 2)}`;

		return {
			timestamp: Date.now(),
			level: config.level,
			name: RULE_NAME,
			remark: `${headers[data.reason]} ≥ ${formattedPct}`,
			networks: makeNetworks(event),
			message: [
				["t", `${headers[data.reason]} on ${payload.protocol}`],
				["a", formattedPct],
				["a", `(${formattedUSD})`],
			],
			payload: {
				kind: "exchange-liquidity",
				protocol: payload.protocol,
				marketId: payload.marketId,
				tvlUSD: payload.suppliedUSD,
				driftPercent: data.driftPercent,
				reason: data.reason,
			},
		} as Alert<ExchangeAlertPayload>;
	},
};
