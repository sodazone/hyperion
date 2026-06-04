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
			driftThresholdDrop: 0.15,
			driftThresholdSpike: 0.5,
			minTvlUSD: 10_000,
			minTicks: 1,
			windowMs: 600_000,
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
		const now = Date.now();

		let event = mockExchangeEvent({ suppliedUSD: 100_000, timestamp: now });
		await ExchangeLiquidityRule.matcher(event, ctx as any);

		// Immediate 20% TVL loss (exceeds 15% drop threshold)
		event = mockExchangeEvent({ suppliedUSD: 80_000, timestamp: now + 1000 });
		const result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(result.matched).toBe(true);
		expect(result.data?.driftPercent).toBeCloseTo(-0.2, 4);
	});

	it("fires instantly on massive TVL pool spikes", async () => {
		const ctx = makeCtx({ driftThresholdSpike: 0.5 });
		const now = Date.now();

		let event = mockExchangeEvent({ suppliedUSD: 100_000, timestamp: now });
		await ExchangeLiquidityRule.matcher(event, ctx as any);

		// Inflow spike of 60% (exceeds 50% spike threshold)
		event = mockExchangeEvent({ suppliedUSD: 160_000, timestamp: now + 1000 });
		const result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(result.matched).toBe(true);
		expect(result.data?.driftPercent).toBeCloseTo(0.6, 4);
	});

	it("does NOT fire alerts on normal, non-disruptive organic TVL fluctuations", async () => {
		const ctx = makeCtx({ driftThresholdDrop: 0.15 });
		const now = Date.now();

		// Base line setup
		let event = mockExchangeEvent({ suppliedUSD: 100_000, timestamp: now });
		await ExchangeLiquidityRule.matcher(event, ctx as any);

		// Minor 3% normal fluctuation
		event = mockExchangeEvent({ suppliedUSD: 103_000, timestamp: now + 1000 });
		const result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(result.matched).toBe(false);
	});

	it("enforces networks restriction matrices cleanly", async () => {
		const ctx = makeCtx({
			networks: ["urn:ocn:ethereum:1"],
		});
		const now = Date.now();

		// Large drop occurs, but on Polkadot Asset Hub
		// while filter explicitly expects Ethereum Mainnet
		const event = mockExchangeEvent({
			chainURN: "urn:ocn:polkadot:1000",
			suppliedUSD: 200_000,
			timestamp: now,
		});
		await ExchangeLiquidityRule.matcher(event, ctx as any);

		const shiftedEvent = mockExchangeEvent({
			chainURN: "urn:ocn:polkadot:1000",
			suppliedUSD: 100_000,
			timestamp: now + 1000,
		}); // severe drop

		const result = await ExchangeLiquidityRule.matcher(
			shiftedEvent,
			ctx as any,
		);
		expect(result.matched).toBe(false);
	});

	it("detects a step-by-step slow drain exploit over time via anchor matching", async () => {
		const ctx = makeCtx({ driftThresholdDrop: 0.15, windowMs: 600_000 }); // 10 mins window
		const startTime = Date.now();

		let event = mockExchangeEvent({
			suppliedUSD: 100_000,
			timestamp: startTime,
		});
		let result = await ExchangeLiquidityRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);

		// Siphon drop 1 (-8%).
		event = mockExchangeEvent({
			suppliedUSD: 92_000,
			timestamp: startTime + 60_000,
		}); // +1 min
		result = await ExchangeLiquidityRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);

		// Siphon drop 2 (-17% total against anchor).
		event = mockExchangeEvent({
			suppliedUSD: 83_000,
			timestamp: startTime + 120_000,
		}); // +2 mins
		result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(result.matched).toBe(true);
		expect(result.data?.driftPercent).toBeCloseTo(-0.17, 4);
	});

	it("handles the ghost baseline edge case correctly after prolonged event silence", async () => {
		const ctx = makeCtx({ driftThresholdDrop: 0.15, windowMs: 600_000 }); // 10 mins window
		const startTime = Date.now();

		let event = mockExchangeEvent({
			suppliedUSD: 100_000,
			timestamp: startTime,
		});
		await ExchangeLiquidityRule.matcher(event, ctx as any);

		// Simulate 5 days of silence. No liquidity shifts occur, so no events are received.
		// Suddenly, a pool drain event hits. TVL drops down to $50k.
		const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;
		event = mockExchangeEvent({
			suppliedUSD: 50_000,
			timestamp: startTime + fiveDaysInMs,
		});

		const result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(result.matched).toBe(true);
		expect(result.data?.driftPercent).toBeCloseTo(-0.5, 4);
	});
});
