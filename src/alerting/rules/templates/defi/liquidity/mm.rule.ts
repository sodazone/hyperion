import type { Alert, AlertPayload } from "@/db";
import type { DefiLiquidityEvent, RuleDefinition } from "../../../types";
import { makeNetworks } from "../../common/helpers";
import { type Configs, schemas } from "./schema";

const ruleName = "money-market-health";
const STATE_KEY = "mm_health";

export interface MoneyMarketAlertPayload extends AlertPayload {
	kind: "money-market-health";
	protocol: string;
	marketId: string;
	reason: "insolvency" | "bad-debt" | "utilization" | "paused";
	details: string;
}

interface MarketState {
	hasAlertedBadDebt: boolean;
}

export const MoneyMarketHealthRule: RuleDefinition<
	DefiLiquidityEvent,
	{ reason: MoneyMarketAlertPayload["reason"]; details: string },
	Configs["mm"]
> = {
	id: ruleName,
	title: "Money Market Health",
	description:
		"Monitors solvency, bad debt, and utilization crunches for lending protocols.",
	schema: schemas.mm,
	defaults: {
		alertOnBadDebt: true,
		minSolvencyRatio: 1.05,
		maxUtilization: 0.95,
	},
	autoDependencies: [{ kind: "defi-liquidity" }],

	matcher: async (event, { config, global: { state } }) => {
		if (
			event.type !== "defi-liquidity" ||
			event.payload.category !== "money-market"
		) {
			return { matched: false };
		}

		const { payload } = event;

		if (payload.lending === undefined) {
			return { matched: false };
		}

		const { lending } = payload;

		if (
			config.networks?.length &&
			!config.networks.includes(event.origin.chainURN)
		) {
			return { matched: false };
		}

		const ns = `${ruleName}:${payload.protocol}:${payload.marketId}`;
		const marketState = (state.get(ns, STATE_KEY) ?? {
			hasAlertedBadDebt: false,
		}) as MarketState;

		if (lending.isPaused) {
			return {
				matched: true,
				data: {
					reason: "paused",
					details: "Market operations are PAUSED on-chain.",
				},
			};
		}

		if (
			config.alertOnBadDebt &&
			lending.health?.badDebtUSD &&
			lending.health.badDebtUSD > 0
		) {
			if (!marketState.hasAlertedBadDebt) {
				marketState.hasAlertedBadDebt = true;
				state.set(ns, STATE_KEY, marketState);
				return {
					matched: true,
					data: {
						reason: "bad-debt",
						details: `Insolvency leak: $${lending.health.badDebtUSD.toLocaleString()} bad debt.`,
					},
				};
			}
		} else {
			marketState.hasAlertedBadDebt = false;
		}
		state.set(ns, STATE_KEY, marketState);

		if (
			config.minSolvencyRatio &&
			lending.health?.solvencyRatio &&
			lending.health.solvencyRatio < config.minSolvencyRatio
		) {
			return {
				matched: true,
				data: {
					reason: "insolvency",
					details: `Solvency ratio critical: ${lending.health.solvencyRatio.toFixed(3)}`,
				},
			};
		}

		if (
			config.maxUtilization &&
			lending.utilization !== undefined &&
			lending.utilization > config.maxUtilization
		) {
			return {
				matched: true,
				data: {
					reason: "utilization",
					details: `Liquidity freeze: Market utilization hit ${(lending.utilization * 100).toFixed(2)}%`,
				},
			};
		}

		return { matched: false };
	},

	alertTemplate: (event, { config }, data) => {
		const payload = event.payload;
		const headers: Record<MoneyMarketAlertPayload["reason"], string> = {
			insolvency: "Solvency Invariant Failure",
			"bad-debt": "Protocol Bad Debt Detected",
			utilization: "Capital Liquidity Crunch",
			paused: "Protocol Market Paused",
		};

		return {
			timestamp: Date.now(),
			level: config.level,
			name: ruleName,
			remark: `Protocol: ${payload.protocol} | Market: ${payload.marketId}`,
			networks: makeNetworks(event),
			message: [
				["t", `${headers[data.reason]} on ${payload.protocol}`],
				["t", `Condition: ${data.details}`],
			],
			payload: {
				kind: "money-market-health",
				protocol: payload.protocol,
				marketId: payload.marketId,
				reason: data.reason,
				details: data.details,
			},
		} as Alert<MoneyMarketAlertPayload>;
	},
};
