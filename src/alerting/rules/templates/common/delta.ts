import z from "zod";

interface DriftSchemaOptions {
	metricName?: string;
	dropHelp?: string;
	spikeHelp?: string;
}

export function createDriftSchema(options: DriftSchemaOptions = {}) {
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
					`Alerts if ${metric} drops by this percentage in one update. Set lower to catch exploits early.`,
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
					`Alerts if ${metric} spikes by this percentage in one update.`,
			}),
	};
}

export interface DeltaState {
	lastValue: number;
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
	dropThreshold?: number;
	spikeThreshold?: number;
	minFloor?: number;
}

export interface DeltaResult {
	matched: boolean;
	driftPercent: number;
	direction?: "drop" | "spike";
}

export function evaluateDelta(options: EvaluateDeltaOptions): DeltaResult {
	const {
		state,
		scope,
		key,
		currentValue,
		dropThreshold,
		spikeThreshold,
		minFloor,
	} = options;

	const deltaState = (state.get(scope, key) ?? {
		lastValue: currentValue,
		lastAlertedValue: currentValue,
	}) as DeltaState;

	const baseline = deltaState.lastAlertedValue;
	deltaState.lastValue = currentValue;

	// Ignore evaluation if value is under the minimum floor
	if (minFloor !== undefined && currentValue < minFloor) {
		deltaState.lastAlertedValue = currentValue;
		state.set(scope, key, deltaState);
		return { matched: false, driftPercent: 0 };
	}

	const driftPercent = baseline > 0 ? (currentValue - baseline) / baseline : 0;

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
	}

	state.set(scope, key, deltaState);

	return { matched, driftPercent, direction };
}
