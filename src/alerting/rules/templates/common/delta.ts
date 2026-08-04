import z from "zod";

export function createDriftSchema(
	options: { metricName?: string; dropHelp?: string; spikeHelp?: string } = {},
) {
	const metric = options.metricName ?? "value";
	return {
		driftThresholdDrop: z
			.number()
			.min(0)
			.max(1)
			.optional()
			.meta({
				label: "Drop Threshold",
				decimals: true,
				unit: "%",
				help:
					options.dropHelp ??
					`Alerts if ${metric} drops relative to the TWAP baseline.`,
			}),
		driftThresholdSpike: z
			.number()
			.min(0)
			.max(1)
			.optional()
			.meta({
				label: "Spike Threshold",
				decimals: true,
				unit: "%",
				help:
					options.spikeHelp ??
					`Alerts if ${metric} spikes relative to the TWAP baseline.`,
			}),
	};
}

export interface TwapDeltaState {
	twap: number;
	lastTimestamp: number;
	lastAlertedValue: number;
}

export interface EvaluateDeltaOptions {
	state: {
		get: (scope: string, key: string) => unknown;
		set: (scope: string, key: string, value: unknown) => void;
	};
	scope: string;
	key: string;
	currentValue: number;
	timestamp?: number;
	dropThreshold?: number;
	spikeThreshold?: number;
	minFloor?: number;
	twapWindowMs?: number;
}

export interface DeltaResult {
	matched: boolean;
	driftPercent: number;
	direction?: "drop" | "spike";
	twap: number;
}

export function evaluateDelta(options: EvaluateDeltaOptions): DeltaResult {
	const {
		state,
		scope,
		key,
		currentValue,
		timestamp = Date.now(),
		dropThreshold,
		spikeThreshold,
		minFloor,
		twapWindowMs = 300_000, // 5 minutes
	} = options;

	const deltaState = (state.get(scope, key) ?? {
		twap: currentValue,
		lastTimestamp: timestamp,
		lastAlertedValue: currentValue,
	}) as TwapDeltaState;

	if (minFloor !== undefined && currentValue < minFloor) {
		deltaState.twap = currentValue;
		deltaState.lastTimestamp = timestamp;
		deltaState.lastAlertedValue = currentValue;
		state.set(scope, key, deltaState);
		return { matched: false, driftPercent: 0, twap: currentValue };
	}

	// Time-weighted decay factor α = 1 - e^(-Δt / τ)
	const dt = Math.max(0, timestamp - deltaState.lastTimestamp);
	const alpha = dt > 0 ? 1 - Math.exp(-dt / twapWindowMs) : 0;

	const baselineTwap = deltaState.twap;

	deltaState.twap = alpha * currentValue + (1 - alpha) * deltaState.twap;
	deltaState.lastTimestamp = timestamp;

	const driftPercent =
		baselineTwap > 0 ? (currentValue - baselineTwap) / baselineTwap : 0;

	let matched = false;
	let direction: "drop" | "spike" | undefined;

	if (
		dropThreshold !== undefined &&
		driftPercent < 0 &&
		Math.abs(driftPercent) >= dropThreshold
	) {
		matched = true;
		direction = "drop";
	} else if (
		spikeThreshold !== undefined &&
		driftPercent > 0 &&
		driftPercent >= spikeThreshold
	) {
		matched = true;
		direction = "spike";
	}

	if (matched) {
		deltaState.lastAlertedValue = currentValue;
		deltaState.twap = currentValue;
	}

	state.set(scope, key, deltaState);

	return { matched, driftPercent, direction, twap: baselineTwap };
}
