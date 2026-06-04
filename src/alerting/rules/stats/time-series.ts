import type { StateStore } from "../types";

export interface TimeSeriesTick {
	timestampMs: number; // Unix timestamp ms
	[key: string]: any;
}

/**
 * Pushes a new tick into the state store and prunes expired records out of the window.
 * Returns the fully updated rolling time-series window.
 */
export function pushAndRollWindow(
	store: StateStore,
	scope: string,
	key: string,
	newTick: TimeSeriesTick,
	windowTimeMs: number,
): TimeSeriesTick[] {
	const storageKey = `${key}_rolling_history`;
	const storedHistory =
		(store.get(scope, storageKey) as TimeSeriesTick[]) || [];

	const cutoff = newTick.timestampMs - windowTimeMs;

	let filtered = storedHistory.filter((tick) => tick.timestampMs > cutoff);

	// If everything expired because updates are infrequent (i.e. only on changes),
	// retain the single newest historical tick to act as our baseline anchor.
	if (filtered.length === 0 && storedHistory.length > 0) {
		const lastKnownHistorical = storedHistory.sort(
			(a, b) => b.timestampMs - a.timestampMs,
		)[0];
		if (lastKnownHistorical) filtered = [lastKnownHistorical];
	}

	const updatedWindow = [...filtered, newTick].sort(
		(a, b) => a.timestampMs - b.timestampMs,
	);

	store.set(scope, storageKey, updatedWindow);
	return updatedWindow;
}

/**
 * Calculates a delta value relative to the previous stored event.
 */
export function calculateDelta(
	store: StateStore,
	scope: string,
	key: string,
	currentTick: TimeSeriesTick,
): { delta: number; percentChange: number; timeDeltaMs: number } {
	const storageKey = `${key}_last_tick`;
	const lastTick = store.get(scope, storageKey) as TimeSeriesTick | undefined;

	store.set(scope, storageKey, currentTick);

	if (!lastTick) {
		return { delta: 0, percentChange: 0, timeDeltaMs: 0 };
	}

	const currentVal = Number(currentTick[key] ?? 0);
	const lastVal = Number(lastTick[key] ?? 0);

	const delta = currentVal - lastVal;
	const percentChange = lastVal === 0 ? 0 : delta / lastVal;
	const timeDeltaMs = currentTick.timestampMs - lastTick.timestampMs;

	return { delta, percentChange, timeDeltaMs };
}

/**
 * Calculates aggregations on a rolling window.
 */
export function calculateRollingMetric(
	window: TimeSeriesTick[],
	key: string,
	metric: "mean" | "sum" | "max" | "min" | "anchor" | "stdev",
): number {
	const len = window.length;
	if (len === 0) return 0;

	const values = window.map((t) => Number(t[key] ?? 0));

	switch (metric) {
		case "anchor":
			return values[0] ?? 0; // Oldest tick value

		case "sum":
			return values.reduce((acc, val) => acc + val, 0);

		case "max":
			return values.reduce(
				(max, val) => (val > max ? val : max),
				values[0] ?? 0,
			);

		case "min":
			return values.reduce(
				(min, val) => (val < min ? val : min),
				values[0] ?? 0,
			);

		case "mean":
			return values.reduce((acc, val) => acc + val, 0) / len;

		case "stdev": {
			const mean = values.reduce((acc, val) => acc + val, 0) / len;
			const variance =
				values.reduce((acc, val) => acc + (val - mean) ** 2, 0) / len;
			return Math.sqrt(variance);
		}
	}
}
