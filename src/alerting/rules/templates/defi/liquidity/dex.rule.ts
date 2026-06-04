import {
	computeRollingMetric,
	pushAndRollWindow,
	type TimeSeriesTick,
} from "@/alerting/rules/stats/time-series";
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
		windowMs: 600_000,
		minTicks: 2,
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

		const newTick: TimeSeriesTick = {
			timestampMs: event.origin.timestamp ?? Date.now(),
			tvl: currentTvl,
		};

		const activeWindow = pushAndRollWindow(
			state,
			scope,
			STATE_KEY,
			newTick,
			config.windowMs,
		);

		if (activeWindow.length <= config.minTicks) return { matched: false };

		const historicalWindow = activeWindow.slice(0, -1);
		const baselineTvl = computeRollingMetric(historicalWindow, "tvl", "anchor");

		if (baselineTvl === 0) return { matched: false };

		const tickDrift = (currentTvl - baselineTvl) / baselineTvl;
		let shouldAlert = false;

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
			},
		} as Alert<ExchangeAlertPayload>;
	},
};
