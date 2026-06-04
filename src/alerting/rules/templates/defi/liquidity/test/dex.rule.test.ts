import { describe, expect, it } from "bun:test";
import { InMemoryStateStore } from "@/alerting/rules/state/memory";
import { ExchangeLiquidityRule } from "../dex.rule";
import { mockExchangeEvent } from "./_mock";

function makeCtx(configOverrides = {}) {
	const state = new InMemoryStateStore();

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
		global: { state },
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
