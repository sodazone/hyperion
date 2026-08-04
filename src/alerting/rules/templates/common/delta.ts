import z from "zod";

interface DriftSchemaOptions {
	metricName?: string;
	dropHelp?: string;
	spikeHelp?: string;
	drawdownHelp?: string;
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
					`Alerts on rapid single-tick drops of ${metric} against TWAP.`,
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
					`Alerts on rapid single-tick spikes of ${metric} against TWAP.`,
			}),
		cumulativeDrawdownThreshold: z
			.number()
			.min(0)
			.max(1)
			.optional()
			.meta({
				label: "Cumulative Drawdown",
				decimals: true,
				unit: "%",
				help:
					options.drawdownHelp ??
					`Alerts if ${metric} suffers a cumulative drawdown exceeding this percentage across the trailing window.`,
			}),
	};
}

export interface ValueSnapshot {
	timestamp: number;
	value: number;
}

export interface AdvancedDeltaState {
	twap: number;
	lastTimestamp: number;
	lastAlertedValue: number;
	snapshots: ValueSnapshot[];
	lastAlertedTrailingValue?: number;
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
	cumulativeDrawdownThreshold?: number;
	minFloor?: number;
	twapWindowMs?: number;
	trailingWindowMs?: number;
}

export interface DeltaResult {
	matched: boolean;
	driftPercent: number;
	direction?: "drop" | "spike" | "cumulative-drawdown";
	baselineUsed: "twap" | "window";
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
		cumulativeDrawdownThreshold,
		minFloor,
		twapWindowMs = 300_000, // 5m
		trailingWindowMs = 86_400_000, // 24h
	} = options;

	const rawState = (state.get(scope, key) ?? {}) as Partial<AdvancedDeltaState>;

	const deltaState: AdvancedDeltaState = {
		twap: rawState.twap ?? currentValue,
		lastTimestamp: rawState.lastTimestamp ?? timestamp,
		lastAlertedValue: rawState.lastAlertedValue ?? currentValue,
		snapshots: rawState.snapshots ?? [],
		lastAlertedTrailingValue: rawState.lastAlertedTrailingValue,
	};

	if (minFloor !== undefined && currentValue < minFloor) {
		deltaState.twap = currentValue;
		deltaState.lastTimestamp = timestamp;
		deltaState.lastAlertedValue = currentValue;
		deltaState.snapshots = [{ timestamp, value: currentValue }];
		deltaState.lastAlertedTrailingValue = undefined;
		state.set(scope, key, deltaState);
		return { matched: false, driftPercent: 0, baselineUsed: "twap" };
	}

	const cutoff = timestamp - trailingWindowMs;
	deltaState.snapshots = deltaState.snapshots.filter(
		(s) => s.timestamp >= cutoff,
	);
	deltaState.snapshots.push({ timestamp, value: currentValue });

	// Decay α = 1 - e^(-Δt / τ)
	const dt = Math.max(0, timestamp - deltaState.lastTimestamp);
	const alpha = dt > 0 ? 1 - Math.exp(-dt / twapWindowMs) : 0;
	const baselineTwap = deltaState.twap;

	deltaState.twap = alpha * currentValue + (1 - alpha) * deltaState.twap;
	deltaState.lastTimestamp = timestamp;

	const twapDrift =
		baselineTwap > 0 ? (currentValue - baselineTwap) / baselineTwap : 0;

	let matched = false;
	let direction: DeltaResult["direction"];
	let baselineUsed: DeltaResult["baselineUsed"] = "twap";

	if (
		dropThreshold !== undefined &&
		twapDrift < 0 &&
		Math.abs(twapDrift) >= dropThreshold
	) {
		matched = true;
		direction = "drop";
	} else if (
		spikeThreshold !== undefined &&
		twapDrift > 0 &&
		twapDrift >= spikeThreshold
	) {
		matched = true;
		direction = "spike";
	}

	let windowDrift = 0;
	if (
		!matched &&
		cumulativeDrawdownThreshold !== undefined &&
		deltaState.snapshots.length > 1
	) {
		const baselineValue =
			deltaState.lastAlertedTrailingValue ??
			deltaState.snapshots[0]?.value ??
			0;

		windowDrift =
			baselineValue > 0 ? (currentValue - baselineValue) / baselineValue : 0;

		if (
			windowDrift < 0 &&
			Math.abs(windowDrift) >= cumulativeDrawdownThreshold
		) {
			matched = true;
			direction = "cumulative-drawdown";
			baselineUsed = "window";
		}
	}

	if (matched) {
		deltaState.lastAlertedValue = currentValue;
		deltaState.twap = currentValue;

		if (direction === "cumulative-drawdown") {
			deltaState.lastAlertedTrailingValue = currentValue;
		}
	}

	state.set(scope, key, deltaState);

	return {
		matched,
		driftPercent: direction === "cumulative-drawdown" ? windowDrift : twapDrift,
		direction,
		baselineUsed,
	};
}
