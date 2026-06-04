import { beforeEach, describe, expect, it } from "bun:test";

import { InMemoryStateStore } from "../state/memory";
import type { StateStore } from "../types";
import {
	calculateDelta,
	calculateRollingMetric,
	pushAndRollWindow,
	type TimeSeriesTick,
} from "./time-series";

describe("TimeSeries Stream Engine Utilities", () => {
	let store: StateStore;
	const scope = "test_rule_scope";
	const metricKey = "price";

	beforeEach(() => {
		store = new InMemoryStateStore();
	});

	describe("pushAndRollWindow", () => {
		it("should add ticks, sort them chronologically, and persist to state store", () => {
			const tick1: TimeSeriesTick = { timestampMs: 2000, price: 100 };
			const tick2: TimeSeriesTick = { timestampMs: 1000, price: 105 }; // out-of-order

			let window = pushAndRollWindow(store, scope, metricKey, tick1, 5000);
			expect(window).toHaveLength(1);

			window = pushAndRollWindow(store, scope, metricKey, tick2, 5000);
			expect(window).toHaveLength(2);
			expect(window[0]?.timestampMs).toBe(1000);
			expect(window[1]?.timestampMs).toBe(2000);

			const stored = store.get(scope, `${metricKey}_rolling_history`);
			expect(stored).toEqual(window);
		});

		it("should prune and evict expired ticks outside the time window", () => {
			const windowSize = 1000; // 1-second

			const tick1: TimeSeriesTick = { timestampMs: 1000, price: 10 };
			const tick2: TimeSeriesTick = { timestampMs: 1500, price: 20 };
			const tick3: TimeSeriesTick = { timestampMs: 2100, price: 30 }; // tick1 expires

			pushAndRollWindow(store, scope, metricKey, tick1, windowSize);
			pushAndRollWindow(store, scope, metricKey, tick2, windowSize);

			const dynamicWindow = pushAndRollWindow(
				store,
				scope,
				metricKey,
				tick3,
				windowSize,
			);

			// Tick1 should be evicted
			expect(dynamicWindow).toHaveLength(2);
			expect(dynamicWindow[0]?.timestampMs).toBe(1500);
			expect(dynamicWindow[1]?.timestampMs).toBe(2100);
		});
	});

	describe("calculateDelta", () => {
		it("should yield zero metrics on cold boot first tick initialization", () => {
			const tick: TimeSeriesTick = { timestampMs: 1000, price: 50 };
			const res = calculateDelta(store, scope, metricKey, tick);

			expect(res.delta).toBe(0);
			expect(res.timeDeltaMs).toBe(0);
		});

		it("should evaluate clean deltas and time frames between successive events", () => {
			const tick1: TimeSeriesTick = { timestampMs: 1000, price: 100 };
			const tick2: TimeSeriesTick = { timestampMs: 1500, price: 120 };

			calculateDelta(store, scope, metricKey, tick1);
			const res = calculateDelta(store, scope, metricKey, tick2);

			expect(res.delta).toBe(20);
			expect(res.timeDeltaMs).toBe(500);
		});
	});

	describe("computeRollingMetric", () => {
		const mockWindow: TimeSeriesTick[] = [
			{ timestampMs: 1000, price: 10 },
			{ timestampMs: 2000, price: 20 },
			{ timestampMs: 3000, price: 30 },
			{ timestampMs: 4000, price: 40 },
		];

		it("should default safely to zero on empty input streams", () => {
			expect(calculateRollingMetric([], "price", "mean")).toBe(0);
		});

		it("should match standard pandas aggregation functions accurately", () => {
			expect(calculateRollingMetric(mockWindow, "price", "sum")).toBe(100);
			expect(calculateRollingMetric(mockWindow, "price", "max")).toBe(40);
			expect(calculateRollingMetric(mockWindow, "price", "min")).toBe(10);
			expect(calculateRollingMetric(mockWindow, "price", "mean")).toBe(25);
		});

		it("should handle missing or fallback keys dynamically using zero default assumptions", () => {
			const skewedWindow: TimeSeriesTick[] = [
				{ timestampMs: 1000, price: 10 },
				{ timestampMs: 2000 },
			];
			expect(calculateRollingMetric(skewedWindow, "price", "sum")).toBe(10);
		});
	});
});
