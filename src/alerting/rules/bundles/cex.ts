import { PUBLIC_OWNER } from "@/db";
import { CAT } from "@/intel/mapping";
import type { AnyEvent, Rule } from "../types";

const USD_THRESHOLD = 50_000;

export const exchangeLargeTransferRule: Rule<AnyEvent> = {
	id: "exchange-large-transfer",

	dependencies: [
		{
			kind: "transfer",
		},
	],

	matcher: async (event, ctx) => {
		if (event.type !== "transfer") return false;

		const { from, to, amountUsd } = event.payload;

		console.log(from, to, amountUsd);

		if (!amountUsd || amountUsd < USD_THRESHOLD) return false;

		const isExchange =
			ctx.db.hasCategory({
				owner: PUBLIC_OWNER,
				address: from,
				category: CAT.EXCHANGE,
			}) ||
			ctx.db.hasCategory({
				owner: PUBLIC_OWNER,
				address: to,
				category: CAT.EXCHANGE,
			});

		console.log(isExchange);

		if (!isExchange) return false;

		return true;
	},

	alertTemplate: (event, _ctx) => {
		if (event.type !== "transfer") {
			throw new Error("Invalid event type");
		}

		const { from, to, amountUsd, asset } = event.payload;

		return {
			ruleId: "exchange-large-transfer",
			level: 7,
			message: `Large transfer involving exchange: $${amountUsd.toLocaleString()}`,
			metadata: {
				from,
				to,
				asset,
				amountUsd,
			},
		};
	},
};
