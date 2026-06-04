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
 * Pandas Equivalent: df['col'].diff()
 */
export function calculateDelta(
	store: StateStore,
	scope: string,
	key: string,
	currentTick: TimeSeriesTick,
): { delta: number; timeDeltaMs: number } {
	const storageKey = `${key}_last_tick`;
	const lastTick = store.get(scope, storageKey) as TimeSeriesTick | undefined;

	store.set(scope, storageKey, currentTick);

	if (!lastTick) {
		return { delta: 0, timeDeltaMs: 0 };
	}

	return {
		delta: Number(currentTick[key] || 0) - Number(lastTick[key] || 0),
		timeDeltaMs: currentTick.timestampMs - lastTick.timestampMs,
	};
}

/**
 * Computes aggregations on an active rolling time array window.
 * Pandas Equivalent: df['col'].rolling('5m').mean()
 */
export function computeRollingMetric(
	window: TimeSeriesTick[],
	key: string,
	metric: "mean" | "sum" | "max" | "min" | "anchor",
): number {
	if (window.length === 0) return 0;

	const values = window.map((t) => Number(t[key] || 0));

	switch (metric) {
		case "anchor":
			return window[0] ? Number(window[0][key] || 0) : 0; // Oldest tick value
		case "sum":
			return values.reduce((a, b) => a + b, 0);
		case "max":
			return Math.max(...values);
		case "min":
			return Math.min(...values);
		case "mean":
			return values.reduce((a, b) => a + b, 0) / values.length;
	}
}
