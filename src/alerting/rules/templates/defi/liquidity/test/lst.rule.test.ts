import { describe, expect, it } from "bun:test";
import { InMemoryStateStore } from "@/alerting/rules/state/memory";
import {
	type LiquidStakingAlertPayload,
	LiquidStakingHealthRule,
} from "../lst.rule";
import { mockLstEvent } from "./_mock";

function makeCtx(configOverrides = {}) {
	const state = new InMemoryStateStore();

	return {
		config: {
			subscriptionId: "sub-lst-1",
			level: 1,
			...configOverrides,
		},
		global: { state },
		id: 1,
	};
}

describe("Liquid Staking Health Rule", () => {
	it("ignores unrelated event types, non-LST categories, or missing exchange rates", async () => {
		const ctx = makeCtx({ minExchangeRate: 1.0 });

		// Wrong type
		let event = mockLstEvent({ type: "arbitrary-event" });
		let result = await LiquidStakingHealthRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);

		// Wrong category
		event = mockLstEvent({ category: "exchange" });
		result = await LiquidStakingHealthRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);

		// Missing liquidStaking field
		event = mockLstEvent({ exchangeRate: null });
		result = await LiquidStakingHealthRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);
	});

	it("triggers when exchange rate breaches minimum static threshold", async () => {
		const ctx = makeCtx({ minExchangeRate: 1.02 });

		// Exchange rate below min threshold
		const event = mockLstEvent({ exchangeRate: 0.98 });
		const result = await LiquidStakingHealthRule.matcher(event, ctx as any);

		expect(result.matched).toBe(true);
		expect(result.data?.reason).toBe("min-rate");
		expect(result.data?.details).toContain("0.9800 < 1.02");
	});

	it("triggers when exchange rate breaches maximum static threshold", async () => {
		const ctx = makeCtx({ maxExchangeRate: 1.1 });

		// Exchange rate above max threshold
		const event = mockLstEvent({ exchangeRate: 1.15 });
		const result = await LiquidStakingHealthRule.matcher(event, ctx as any);

		expect(result.matched).toBe(true);
		expect(result.data?.reason).toBe("max-rate");
		expect(result.data?.details).toContain("1.1500 > 1.1");
	});

	it("fires on sudden exchange rate drop (slashing / pool de-peg drift)", async () => {
		const ctx = makeCtx({ driftThresholdDrop: 0.05 });

		// Step 1: Initialize baseline rate at 1.0
		let event = mockLstEvent({ exchangeRate: 1.0 });
		await LiquidStakingHealthRule.matcher(event, ctx as any);

		// Step 2: Sudden 8% drop in rate (exceeds 5% drop threshold)
		event = mockLstEvent({ exchangeRate: 0.92 });
		const result = await LiquidStakingHealthRule.matcher(event, ctx as any);

		expect(result.matched).toBe(true);
		expect(result.data?.reason).toBe("rate-drop");
		expect(result.data?.details).toContain("-8.00%");
	});

	it("fires on sudden exchange rate spike drift", async () => {
		const ctx = makeCtx({ driftThresholdSpike: 0.1 });

		// Step 1: Initialize baseline rate
		let event = mockLstEvent({ exchangeRate: 1.0 });
		await LiquidStakingHealthRule.matcher(event, ctx as any);

		// Step 2: 12% rate spike (exceeds 10% spike threshold)
		event = mockLstEvent({ exchangeRate: 1.12 });
		const result = await LiquidStakingHealthRule.matcher(event, ctx as any);

		expect(result.matched).toBe(true);
		expect(result.data?.reason).toBe("rate-spike");
		expect(result.data?.details).toContain("12.00%");
	});

	it("prevents alert flapping by tracking drift against last alerted rate", async () => {
		const ctx = makeCtx({ driftThresholdDrop: 0.05, driftThresholdSpike: 0.1 });

		// Step 1: Establish baseline at 1.0
		let event = mockLstEvent({ exchangeRate: 1.0 });
		await LiquidStakingHealthRule.matcher(event, ctx as any);

		// Step 2: Drop to 0.94 (-6%). Triggers alert and sets lastAlertedValue to 0.94
		event = mockLstEvent({ exchangeRate: 0.94 });
		let result = await LiquidStakingHealthRule.matcher(event, ctx as any);
		expect(result.matched).toBe(true);

		// Step 3: Rate moves back to 0.98 (+4.25% relative to 0.94). Should NOT trigger spike alert (<10%)
		event = mockLstEvent({ exchangeRate: 0.98 });
		result = await LiquidStakingHealthRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);

		// Step 4: Rate drops back to 0.94. Calculated against 0.94, drift is 0%, preventing duplicate spam.
		event = mockLstEvent({ exchangeRate: 0.94 });
		result = await LiquidStakingHealthRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);
	});

	it("accumulates slow bleed rate drops until threshold is crossed", async () => {
		const ctx = makeCtx({ driftThresholdDrop: 0.05 });

		// Step 1: Base state at 1.0
		let event = mockLstEvent({ exchangeRate: 1.0 });
		await LiquidStakingHealthRule.matcher(event, ctx as any);

		// Step 2: Drop to 0.98 (-2%). Below threshold
		event = mockLstEvent({ exchangeRate: 0.98 });
		let result = await LiquidStakingHealthRule.matcher(event, ctx as any);
		expect(result.matched).toBe(false);

		// Step 3: Cumulative drop to 0.94 (-6%). Crosses 5% threshold!
		event = mockLstEvent({ exchangeRate: 0.94 });
		result = await LiquidStakingHealthRule.matcher(event, ctx as any);
		expect(result.matched).toBe(true);
		expect(result.data?.reason).toBe("rate-drop");
	});

	it("enforces network restriction filtering", async () => {
		const ctx = makeCtx({
			networks: ["urn:ocn:polkadot:2030"],
			driftThresholdDrop: 0.05,
		});

		// Base event on mismatched URN
		let event = mockLstEvent({
			chainURN: "urn:ocn:polkadot:2000",
			exchangeRate: 1.0,
		});
		await LiquidStakingHealthRule.matcher(event, ctx as any);

		// Rate crashes on non-monitored network
		event = mockLstEvent({
			chainURN: "urn:ocn:polkadot:2000",
			exchangeRate: 0.8,
		});
		const result = await LiquidStakingHealthRule.matcher(event, ctx as any);

		expect(result.matched).toBe(false);
	});

	it("correctly populates payload in alertTemplate", async () => {
		const ctx = makeCtx({ minExchangeRate: 1.0 });

		const event = mockLstEvent({
			protocol: "bifrost",
			marketId: "vDOT",
			exchangeRate: 0.95,
		});

		const matchData = {
			reason: "min-rate" as const,
			details: "0.9500 < 1.0",
		};

		const alert = await LiquidStakingHealthRule.alertTemplate?.(
			event,
			ctx as any,
			matchData,
		);

		expect(alert).not.toBeUndefined();
		expect(alert?.name).toBe("liquid-staking-health");
		expect(alert?.payload as LiquidStakingAlertPayload).toEqual({
			kind: "liquid-staking-health",
			protocol: "bifrost",
			marketId: "vDOT",
			reason: "min-rate",
			details: "0.9500 < 1.0",
			exchangeRate: 0.95,
		});
	});
});
