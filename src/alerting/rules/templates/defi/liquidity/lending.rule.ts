import { checkAndRecordRateLimit } from "@/alerting/rules/util/limit";
import type { Alert, AlertPayload } from "@/db";
import type { DefiLiquidityEvent, RuleDefinition } from "../../../types";
import { makeNetworks } from "../../common/helpers";
import { type Configs, schemas } from "./schema";

const RULE_NAME = "money-market-health";

const MAX_ALERTS_NUM = 1;
const MAX_ALERTS_WINDOW_MS = 3_600_000;

export interface MoneyMarketAlertPayload extends AlertPayload {
	kind: "money-market-health";
	protocol: string;
	marketId: string;
	reason: "insolvency" | "utilization" | "paused";
	details: string;
}

export const MoneyMarketHealthRule: RuleDefinition<
	DefiLiquidityEvent,
	{ reason: MoneyMarketAlertPayload["reason"]; details: string },
	Configs["lending"]
> = {
	id: RULE_NAME,
	title: "Money Market Health",
	description:
		"Monitors solvency and utilization crunches for lending protocols.",
	schema: schemas.lending,
	defaults: {
		minSolvencyRatio: 0.98,
		maxUtilization: 0.95,
	},
	autoDependencies: [{ kind: "defi-liquidity" }],

	matcher: async (event, { config, id }) => {
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

		let matchedReason: MoneyMarketAlertPayload["reason"] | null = null;
		let details = "";

		if (lending.isPaused) {
			matchedReason = "paused";
			details = "Market operations are paused.";
		} else if (
			config.minSolvencyRatio &&
			lending.health?.solvencyRatio &&
			lending.health.solvencyRatio < config.minSolvencyRatio
		) {
			matchedReason = "insolvency";
			details = `ratio ${lending.health.solvencyRatio.toFixed(3)}`;
		} else if (
			config.maxUtilization &&
			lending.utilization !== undefined &&
			lending.utilization > config.maxUtilization
		) {
			matchedReason = "utilization";
			details = `${(lending.utilization * 100).toFixed(2)}%`;
		}

		if (!matchedReason) {
			return { matched: false };
		}

		const key = `${RULE_NAME}:${id}:${payload.protocol}:${payload.marketId}:${matchedReason}`;
		const isAllowed = checkAndRecordRateLimit({
			key,
			limit: MAX_ALERTS_NUM,
			windowMs: MAX_ALERTS_WINDOW_MS,
		});

		if (!isAllowed) {
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
		const headers: Record<MoneyMarketAlertPayload["reason"], string> = {
			insolvency: "Insolvency",
			utilization: "Utilization",
			paused: "Market Paused",
		};

		return {
			timestamp: Date.now(),
			level: config.level,
			name: RULE_NAME,
			remark: `${payload.marketId} (${payload.protocol})`,
			networks: makeNetworks(event),
			message: [
				["t", `${headers[data.reason]} on ${payload.protocol}`],
				["t", data.details],
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
