import type { Alert, AlertPayload } from "@/db";
import type { DefiLiquidityEvent, RuleDefinition } from "../../../types";
import { makeNetworks } from "../../common/helpers";
import { type Configs, schemas } from "./schema";

const RULE_NAME = "liquid-staking-health";

const COOL_DOWN_MS = 3_600_000;

export interface LiquidStakingAlertPayload extends AlertPayload {
	kind: "liquid-staking-health";
	protocol: string;
	marketId: string;
	reason: "min-exchange-rate" | "max-exchange-rate";
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
		"Monitors minimum and maximum exchange rate thresholds for liquid staking protocols.",
	schema: schemas.liquidStaking,
	defaults: {},
	cooldownMs: COOL_DOWN_MS,
	autoDependencies: [{ kind: "defi-liquidity" }],

	matcher: async (event, { config }) => {
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

		const { liquidStaking } = payload;

		if (
			config.networks?.length &&
			!config.networks.includes(event.origin.chainURN)
		) {
			return { matched: false };
		}

		const { exchangeRate } = liquidStaking;

		if (exchangeRate === undefined || exchangeRate === null) {
			return { matched: false };
		}

		let matchedReason: LiquidStakingAlertPayload["reason"] | null = null;
		let details = "";

		if (
			config.minExchangeRate !== undefined &&
			exchangeRate < config.minExchangeRate
		) {
			matchedReason = "min-exchange-rate";
			details = `rate ${exchangeRate.toFixed(4)} < min threshold ${config.minExchangeRate}`;
		} else if (
			config.maxExchangeRate !== undefined &&
			exchangeRate > config.maxExchangeRate
		) {
			matchedReason = "max-exchange-rate";
			details = `rate ${exchangeRate.toFixed(4)} > max threshold ${config.maxExchangeRate}`;
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
			"min-exchange-rate": "Min Exch. Rate",
			"max-exchange-rate": "Max Exch. Rate",
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
