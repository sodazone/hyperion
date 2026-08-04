import type { Alert, AlertPayload } from "@/db";
import type { DefiLiquidityEvent, RuleDefinition } from "../../../types";
import { evaluateDelta, makeNetworks } from "../../common";
import { type Configs, schemas } from "./schema";

const RULE_NAME = "liquid-staking-health";
const STATE_KEY = "lst_exchange_rate";
const COOL_DOWN_MS = 3_600_000;

export interface LiquidStakingAlertPayload extends AlertPayload {
	kind: "liquid-staking-health";
	protocol: string;
	marketId: string;
	reason:
		| "min-rate"
		| "max-rate"
		| "rate-drop"
		| "rate-spike"
		| "cumulative-drawdown";
	details: string;
	exchangeRate: number;
}

export const LiquidStakingHealthRule: RuleDefinition<
	DefiLiquidityEvent,
	{ reason: LiquidStakingAlertPayload["reason"]; details: string },
	Configs["liquidStaking"]
> = {
	id: RULE_NAME,
	title: "Liquid Staking Health",
	description:
		"Monitors exchange rate bounds, TWAP drift, and sustained cumulative drawdown.",
	schema: schemas.liquidStaking,
	defaults: {},
	cooldownMs: COOL_DOWN_MS,
	autoDependencies: [{ kind: "defi-liquidity" }],

	matcher: async (event, { config, id, global: { state } }) => {
		if (
			event.type !== "defi-liquidity" ||
			event.payload.category !== "liquid-staking"
		) {
			return { matched: false };
		}

		const { payload } = event;

		if (payload.liquidStaking === undefined) {
			return { matched: false };
		}

		if (
			config.networks?.length &&
			!config.networks.includes(event.origin.chainURN)
		) {
			return { matched: false };
		}

		const { exchangeRate } = payload.liquidStaking;

		if (exchangeRate === undefined || exchangeRate === null) {
			return { matched: false };
		}

		let matchedReason: LiquidStakingAlertPayload["reason"] | null = null;
		let details = "";

		// 1. Static Threshold Checks
		if (
			config.minExchangeRate !== undefined &&
			exchangeRate < config.minExchangeRate
		) {
			matchedReason = "min-rate";
			details = `${exchangeRate.toFixed(4)} < ${config.minExchangeRate}`;
		} else if (
			config.maxExchangeRate !== undefined &&
			exchangeRate > config.maxExchangeRate
		) {
			matchedReason = "max-rate";
			details = `${exchangeRate.toFixed(4)} > ${config.maxExchangeRate}`;
		}

		// 2. Dynamic Delta / Drift Checks
		if (!matchedReason) {
			const scope = `${RULE_NAME}:${id}:${payload.protocol}:${payload.marketId}`;
			const delta = evaluateDelta({
				state,
				scope,
				key: STATE_KEY,
				currentValue: exchangeRate,
				timestamp: event.origin.timestamp,
				dropThreshold: config.driftThresholdDrop,
				spikeThreshold: config.driftThresholdSpike,
				cumulativeDrawdownThreshold: config.cumulativeDrawdownThreshold,
				trailingWindowMs: 86_400_000, // 24h
			});

			if (delta.matched) {
				if (delta.direction === "cumulative-drawdown") {
					matchedReason = "cumulative-drawdown";
					details = `24h ${(Math.abs(delta.driftPercent) * 100).toFixed(2)}% (rate: ${exchangeRate.toFixed(4)})`;
				} else {
					matchedReason =
						delta.direction === "drop" ? "rate-drop" : "rate-spike";
					details = `TWAP ${(delta.driftPercent * 100).toFixed(2)}% (rate: ${exchangeRate.toFixed(4)})`;
				}
			}
		}

		if (!matchedReason) {
			return { matched: false };
		}

		return {
			matched: true,
			data: {
				reason: matchedReason,
				details,
			},
		};
	},

	alertTemplate: (event, { config }, data) => {
		const payload = event.payload;
		const headers: Record<LiquidStakingAlertPayload["reason"], string> = {
			"min-rate": "Rate",
			"max-rate": "Rate",
			"rate-drop": "Rate Drop",
			"rate-spike": "Rate Spike",
			"cumulative-drawdown": "Drawdown",
		};

		return {
			timestamp: Date.now(),
			level: config.level,
			name: RULE_NAME,
			remark: `${payload.label ?? payload.marketId} (${payload.protocol})`,
			networks: makeNetworks(event),
			message: [
				["t", `${headers[data.reason]} on ${payload.protocol}`],
				["t", data.details],
			],
			payload: {
				kind: "liquid-staking-health",
				protocol: payload.protocol,
				marketId: payload.marketId,
				reason: data.reason,
				details: data.details,
				exchangeRate: payload.liquidStaking?.exchangeRate ?? 0,
			},
		} as Alert<LiquidStakingAlertPayload>;
	},
};
