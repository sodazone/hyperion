import type { AnyEvent, Rule } from "../types";

const __crossChainCompareRule: Rule<AnyEvent> = {
	id: "cross-chain-compare",
	dependencies: [
		{
			kind: "storage",
			chain: "urn:ocn:polkadot:1000",
			key: "0x01",
		},
	],

	matcher: (event, ctx) => {
		if (event.type !== "metric_update") return false;

		const { metricKey, value } = event.payload;
		if (event.chain !== "chainA") return false;

		const other = ctx.state.get("metric", `chainB:${metricKey}`);
		if (typeof other !== "number" && typeof other !== "bigint") return false;

		return value > (other as bigint);
	},

	alertTemplate: (event, ctx) => {
		if (event.type !== "metric_update") throw new Error("Invalid event type");

		const { metricKey, value } = event.payload;
		const other = ctx.state.get("metric", `chainB:${metricKey}`);

		return {
			ruleId: "cross-chain-compare",
			level: 10,
			message: `Metric ${metricKey} drift: chainA=${value}, chainB=${other}`,
		};
	},
};
