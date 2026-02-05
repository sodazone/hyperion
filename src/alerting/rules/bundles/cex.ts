import { PUBLIC_OWNER } from "@/db";
import { CAT } from "@/intel/mapping";
import type { AnyEvent, Rule } from "../types";

const USD_THRESHOLD = 30_000;

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

		if (!isExchange) return false;

		return true;
	},

	alertTemplate: (event, ctx) => {
		if (event.type !== "transfer") {
			throw new Error("Invalid event type");
		}

		const { from, to, amountUsd, asset } = event.payload;

		const fromEntity = ctx.db.findEntity({
			owner: PUBLIC_OWNER,
			address: from,
		});
		const toEntity = ctx.db.findEntity({
			owner: PUBLIC_OWNER,
			address: to,
		});

		return {
			ruleId: "exchange-large-transfer",
			level: 7,
			message: `Large transfer involving exchange: $${amountUsd.toLocaleString()}`,
			metadata: {
				event,
				from: {
					address: from,
					tags: fromEntity?.tags || [],
					categories: fromEntity?.categories || [],
				},
				to: {
					address: to,
					tags: toEntity?.tags || [],
					categories: toEntity?.categories || [],
				},
				asset,
				amountUsd,
			},
		};
	},
};
