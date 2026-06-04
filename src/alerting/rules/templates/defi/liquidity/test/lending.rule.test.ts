import { describe, expect, it } from "bun:test";
import { MoneyMarketHealthRule } from "../lending.rule";
import { mockLendingEvent } from "./_mock";

function makeCtx(configOverrides = {}) {
	const fakeState = new Map();

	const stateApi = {
		get: (ns: string, key: string) => fakeState.get(`${ns}:${key}`),
		set: (ns: string, key: string, value: any) =>
			fakeState.set(`${ns}:${key}`, value),
	};

	return {
		config: {
			subscriptionId: "sub-1",
			level: 2,
			minSolvencyRatio: 1.05,
			maxUtilization: 0.95,
			...configOverrides,
		},
		global: { state: stateApi },
		id: 1,
	};
}

describe("Money Market Health Rule", () => {
	it("ignores unrelated events or non-lending categories", async () => {
		const ctx = makeCtx();

		// Wrong event type
		let event = mockLendingEvent({ type: "arbitrary-event" });
		let result = await MoneyMarketHealthRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);

		// Wrong category
		event = mockLendingEvent({ category: "dex-amm" });
		result = await MoneyMarketHealthRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);
	});

	it("fires if solvency ratio drops below configured minimum", async () => {
		const ctx = makeCtx({ minSolvencyRatio: 1.05 });

		// Safe ratio (1.08 > 1.05)
		let event = mockLendingEvent({ solvencyRatio: 1.08 });
		let result = await MoneyMarketHealthRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);

		// Critical breach (1.03 < 1.05)
		event = mockLendingEvent({ solvencyRatio: 1.03 });
		result = await MoneyMarketHealthRule.matcher(event, ctx as any);

		expect(result.matched).toBe(true);
		expect(result.data?.reason).toBe("insolvency");
	});

	it("fires if protocol utilization exceeds parameters", async () => {
		const ctx = makeCtx({ maxUtilization: 0.95 });

		// Normal operations (90%)
		let event = mockLendingEvent({ utilization: 0.9 });
		let result = await MoneyMarketHealthRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);

		// Liquidity freeze (98%)
		event = mockLendingEvent({ utilization: 0.98 });
		result = await MoneyMarketHealthRule.matcher(event, ctx as any);

		expect(result.matched).toBe(true);
		expect(result.data?.reason).toBe("utilization");
	});

	it("respects chain filters if network properties are provided", async () => {
		const ctx = makeCtx({
			networks: ["urn:ocn:ethereum:1"], // Alert only targets Mainnet
		});

		// Event arriving from Polkadot Asset Hub should be passed over
		const event = mockLendingEvent({
			chainURN: "urn:ocn:polkadot:1000",
			isPaused: true,
		});

		const result = await MoneyMarketHealthRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);
	});
});
