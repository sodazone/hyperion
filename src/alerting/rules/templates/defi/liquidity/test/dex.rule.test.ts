import { describe, expect, it } from "bun:test";
import { ExchangeLiquidityRule } from "../dex.rule";
import { mockExchangeEvent } from "./_mock";

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
			level: 1,
			driftThresholdDrop: 0.15, // 15% instant drop
			driftThresholdSpike: 0.5, // 50% instant spike
			stepThreshold: 0.1, // 10% multi-step shift
			minTvlUSD: 10_000,
			...configOverrides,
		},
		global: { state: stateApi },
		id: 1,
	};
}

describe("Exchange Liquidity Rule", () => {
	it("ignores unrelated event types or non-exchange categories", async () => {
		const ctx = makeCtx();

		// Wrong type
		let event = mockExchangeEvent({ type: "arbitrary-event" });
		let result = await ExchangeLiquidityRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);

		// Wrong category
		event = mockExchangeEvent({ category: "money-market" });
		result = await ExchangeLiquidityRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);
	});

	it("bypasses evaluation completely if TVL falls below configured threshold parameters", async () => {
		const ctx = makeCtx({ minTvlUSD: 50_000 });

		// Event drops massively, but its raw TVL is insignificant ($5k)
		const event = mockExchangeEvent({ suppliedUSD: 5_000 });
		const result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(result.matched).toBe(false);
	});

	it("fires instantly on severe TVL drop (liquidity crash shock)", async () => {
		const ctx = makeCtx({ driftThresholdDrop: 0.15 });

		// Step 1: Establish baseline TVL state
		let event = mockExchangeEvent({ suppliedUSD: 100_000 });
		await ExchangeLiquidityRule.matcher(event, ctx as any);

		// Step 2: Immediate 20% TVL loss (exceeds 15% drop threshold)
		event = mockExchangeEvent({ suppliedUSD: 80_000 });
		const result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(result.matched).toBe(true);
		expect(result.data?.driftPercent).toBeCloseTo(-0.2, 4);
	});

	it("fires instantly on massive TVL pool spikes", async () => {
		const ctx = makeCtx({ driftThresholdSpike: 0.5 });

		// Step 1: Base TVL state
		let event = mockExchangeEvent({ suppliedUSD: 100_000 });
		await ExchangeLiquidityRule.matcher(event, ctx as any);

		// Step 2: Inflow spike of 60% (exceeds 50% spike threshold)
		event = mockExchangeEvent({ suppliedUSD: 160_000 });
		const result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(result.matched).toBe(true);
		expect(result.data?.driftPercent).toBeCloseTo(0.6, 4);
	});

	it("does NOT fire alerts on normal, non-disruptive organic TVL fluctuations", async () => {
		const ctx = makeCtx({ stepThreshold: 0.1 });

		// Base line setup
		let event = mockExchangeEvent({ suppliedUSD: 100_000 });
		await ExchangeLiquidityRule.matcher(event, ctx as any);

		// Minor 3% normal fluctuation
		event = mockExchangeEvent({ suppliedUSD: 103_000 });
		const result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(result.matched).toBe(false);
	});

	it("triggers multi-step stepThreshold shifts over continuous progressive updates", async () => {
		const ctx = makeCtx({
			driftThresholdDrop: 0.3, // Large instant barrier
			stepThreshold: 0.1, // Modest structural barrier
		});

		// Event 1: Fresh state setup at $100k
		let event = mockExchangeEvent({ suppliedUSD: 100_000 });
		const res1 = await ExchangeLiquidityRule.matcher(event, ctx as any);
		// Note: The rule design marks lastAlertedTvl = currentTvl on initialization
		// when it satisfies `marketState.lastAlertedTvl === 0 && Math.abs(tickDrift) >= stepThresh` (0 >= 0.1 is false, but baseline tickDrift check on step 1 is 0. If it did alert on tick 1, res1 would be true. Here it initializes silently if tickDrift is 0)
		expect(res1.matched).toBe(false);

		// Event 2: TVL drops by 12% ($88k). Does not cross 30% drop boundary, but crosses 10% multi-step threshold from initial $100k anchor.
		event = mockExchangeEvent({ suppliedUSD: 88_000 });
		const res2 = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(res2.matched).toBe(true);
		expect(res2.data?.driftPercent).toBeCloseTo(-0.12, 4);

		// Event 3: Minor drift down to $86k. Drift from updated anchor ($88k) is minor, shouldn't trigger.
		event = mockExchangeEvent({ suppliedUSD: 86_000 });
		const res3 = await ExchangeLiquidityRule.matcher(event, ctx as any);
		expect(res3.matched).toBe(false);

		// Event 4: Progressive bleeding drops TVL down to $75k. Shift from anchor ($88k) is ~14.7%, crossing the 10% step boundary again.
		event = mockExchangeEvent({ suppliedUSD: 75_000 });
		const res4 = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(res4.matched).toBe(true);
	});

	it("enforces networks restriction matrices cleanly", async () => {
		const ctx = makeCtx({
			networks: ["urn:ocn:ethereum:1"],
		});

		// Large drop occurs, but on Polkadot Asset Hub while filter explicitly expects Ethereum Mainnet
		const event = mockExchangeEvent({
			chainURN: "urn:ocn:polkadot:1000",
			suppliedUSD: 200_000,
		});
		await ExchangeLiquidityRule.matcher(event, ctx as any); // initialize

		const shiftedEvent = mockExchangeEvent({
			chainURN: "urn:ocn:polkadot:1000",
			suppliedUSD: 100_000,
		}); // severe drop

		const result = await ExchangeLiquidityRule.matcher(
			shiftedEvent,
			ctx as any,
		);
		expect(result.matched).toBe(false);
	});
});
