import { describe, expect, it } from "bun:test";
import { InMemoryStateStore } from "@/alerting/rules/state/memory";
import { type ExchangeAlertPayload, ExchangeLiquidityRule } from "../dex.rule";
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

	it("updates state even when below minTvlUSD to prevent stale state false positives on recovery", async () => {
		const ctx = makeCtx({ minTvlUSD: 10_000, driftThresholdDrop: 0.15 });

		// Step 1: Establish high initial TVL ($100k)
		let event = mockExchangeEvent({ suppliedUSD: 100_000 });
		await ExchangeLiquidityRule.matcher(event, ctx as any);

		// Step 2: TVL temporarily drops below minTvlUSD ($5k) -> bypassed, but lastTvl must update to 5,000
		event = mockExchangeEvent({ suppliedUSD: 5_000 });
		let result = await ExchangeLiquidityRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);

		// Step 3: TVL recovers slightly to $12k.
		// If lastTvl was stuck at 100,000, this would incorrectly trigger a -88% drop alert!
		event = mockExchangeEvent({ suppliedUSD: 12_000 });
		result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		// Should NOT trigger a false drop alert (calculated against $5k, drift is positive +140%)
		if (result.matched) {
			expect(result.data?.driftPercent).toBeGreaterThan(0);
		} else {
			expect(result.matched).toBe(false);
		}
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

	it("populates tvlUSD and driftPercent correctly in alertTemplate payload", async () => {
		const ctx = makeCtx({ driftThresholdDrop: 0.15 });

		const event = mockExchangeEvent({
			suppliedUSD: 85_000,
			protocol: "uniswap-v3",
			marketId: "eth-usdc",
		});
		const matchData: { driftPercent: number; reason: "instant-drop" } = {
			driftPercent: -0.15,
			reason: "instant-drop",
		};

		const alert = await ExchangeLiquidityRule.alertTemplate?.(
			event,
			ctx as any,
			matchData,
		);

		expect(alert).not.toBeUndefined();
		expect(alert?.name).toBe("exchange-liquidity");
		expect(alert?.payload as ExchangeAlertPayload).toEqual({
			kind: "exchange-liquidity",
			protocol: "uniswap-v3",
			marketId: "eth-usdc",
			reason: "instant-drop",
			tvlUSD: 85_000,
			driftPercent: -0.15,
		});
	});

	it("prevents alert flapping by calculating drift against the last alerted TVL", async () => {
		const ctx = makeCtx({ driftThresholdDrop: 0.15, driftThresholdSpike: 0.5 });

		let event = mockExchangeEvent({ suppliedUSD: 100_000 });
		await ExchangeLiquidityRule.matcher(event, ctx as any);

		// Drop to $80k (-20%). Exceeds the 15% drop threshold.
		event = mockExchangeEvent({ suppliedUSD: 80_000 });
		let result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(result.matched).toBe(true);

		// Compared to 80k, this is a +25% spike (below the 50% spike threshold).
		event = mockExchangeEvent({ suppliedUSD: 100_000 });
		result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(result.matched).toBe(false);

		// Since it calculates from lastAlertedTvl (80k), drift is 0%, preventing spam.
		event = mockExchangeEvent({ suppliedUSD: 80_000 });
		result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(result.matched).toBe(false);
	});

	it("accumulates 'slow bleeds' and alerts when cumulative drift exceeds the threshold", async () => {
		const ctx = makeCtx({ driftThresholdDrop: 0.15 });

		let event = mockExchangeEvent({ suppliedUSD: 100_000 });
		await ExchangeLiquidityRule.matcher(event, ctx as any);

		// Drop to $90k (-10%). Below the 15% threshold.
		event = mockExchangeEvent({ suppliedUSD: 90_000 });
		let result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(result.matched).toBe(false);

		// Drop further to $82k.
		event = mockExchangeEvent({ suppliedUSD: 82_000 });
		result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(result.matched).toBe(true);
		expect(result.data?.driftPercent).toBeCloseTo(-0.18, 4);
	});

	it("alerts on cumulative drawdown across multi-step drains without triggering instant drop alerts", async () => {
		const ctx = makeCtx({
			driftThresholdDrop: 0.15, // 15% instant TWAP drop threshold
			cumulativeDrawdownThreshold: 0.2, // 20% cumulative drawdown threshold
		});

		const NOW = Date.now();
		const FIVE_MINS = 5 * 60 * 1000;

		// Step 1 (t=0): Establish initial $100k baseline
		let event = mockExchangeEvent({ suppliedUSD: 100_000, timestamp: NOW });
		await ExchangeLiquidityRule.matcher(event, ctx as any);

		// Step 2 (t=+5m): Drop to $92k (TWAP drift = -8.0%). Below both thresholds.
		event = mockExchangeEvent({
			suppliedUSD: 92_000,
			timestamp: NOW + FIVE_MINS,
		});
		let result = await ExchangeLiquidityRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);

		// Step 3 (t=+10m): Drop to $86k (TWAP drift ~-9.4%). Cumulative drawdown = -14%. Below 20%.
		event = mockExchangeEvent({
			suppliedUSD: 86_000,
			timestamp: NOW + FIVE_MINS * 2,
		});
		result = await ExchangeLiquidityRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);

		// Step 4 (t=+15m): Drop to $78k (TWAP drift ~-12.7% < 15%).
		// Cumulative drawdown from $100k = -22.0% (exceeds 20% threshold!).
		event = mockExchangeEvent({
			suppliedUSD: 78_000,
			timestamp: NOW + FIVE_MINS * 3,
		});
		result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(result.matched).toBe(true);
		expect(result.data?.reason).toBe("cumulative-drawdown");
		expect(result.data?.driftPercent).toBeCloseTo(-0.22, 2);

		// Step 5 (t=+16m): TVL remains at $78k. Re-anchoring prevents duplicate alerts.
		event = mockExchangeEvent({
			suppliedUSD: 78_000,
			timestamp: NOW + FIVE_MINS * 3 + 60_000,
		});
		result = await ExchangeLiquidityRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);

		// Step 6a (t=+21m): Drop to $72k (TWAP drift ~-7.7% < 15%).
		event = mockExchangeEvent({
			suppliedUSD: 72_000,
			timestamp: NOW + FIVE_MINS * 4,
		});
		await ExchangeLiquidityRule.matcher(event, ctx as any);

		// Step 6b (t=+26m): Drop to $67k (TWAP drift ~-9.7% < 15%).
		event = mockExchangeEvent({
			suppliedUSD: 67_000,
			timestamp: NOW + FIVE_MINS * 5,
		});
		await ExchangeLiquidityRule.matcher(event, ctx as any);

		// Step 6c (t=+31m): Drop to $62k (TWAP drift ~-11.0% < 15%).
		// Cumulative drawdown relative to re-anchored $78k baseline = -20.51% (exceeds 20%!).
		event = mockExchangeEvent({
			suppliedUSD: 62_000,
			timestamp: NOW + FIVE_MINS * 6,
		});
		result = await ExchangeLiquidityRule.matcher(event, ctx as any);

		expect(result.matched).toBe(true);
		expect(result.data?.reason).toBe("cumulative-drawdown");
		expect(result.data?.driftPercent).toBeCloseTo(-0.2051, 2);
	});
});
