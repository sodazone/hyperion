type KpiMode = "volume" | "state";

export interface KpiConfig<T> {
	key: keyof T;
	mode: KpiMode;
}

export interface KpiOutput {
	total: number;
	deltaPct: number;
}

/**
 * Computes total quantities and trend percentage deltas
 * for both volume and state time series data.
 */
export function calculateKpis<
	T extends Record<string, any>,
	const C extends readonly KpiConfig<T>[],
>(
	series: T[],
	configs: C,
	options?: {
		dateKey?: keyof T;
		entityKey?: (row: T) => string;
	},
): Record<C[number]["key"] & string, KpiOutput> {
	const dateKey = options?.dateKey ?? ("ts" as keyof T);
	const entityKey = options?.entityKey;

	const results = {} as Record<string, KpiOutput>;
	for (const config of configs) {
		results[config.key as string] = { total: 0, deltaPct: 0 };
	}

	if (!series || series.length === 0) {
		return results;
	}

	// Enforce absolute chronological order
	const sorted = [...series].sort(
		(a, b) => new Date(a[dateKey]).getTime() - new Date(b[dateKey]).getTime(),
	);

	for (const { key, mode } of configs) {
		if (mode === "volume") {
			let totalSum = 0;
			for (const item of sorted) {
				totalSum += Number(item[key] ?? 0);
			}

			const midPoint = Math.ceil(sorted.length / 2);
			const firstHalf = sorted.slice(0, midPoint);
			const secondHalf = sorted.slice(midPoint);

			let firstHalfSum = 0;
			let secondHalfSum = 0;
			for (const item of firstHalf) firstHalfSum += Number(item[key] ?? 0);
			for (const item of secondHalf) secondHalfSum += Number(item[key] ?? 0);

			results[key as string] = {
				total: totalSum,
				deltaPct:
					firstHalfSum > 0
						? ((secondHalfSum - firstHalfSum) / firstHalfSum) * 100
						: 0,
			};
		} else {
			let currentSum = 0;
			let baselineSum = 0;

			if (entityKey) {
				const latestMap = new Map<string, T>();
				const earliestMap = new Map<string, T>();

				// Forward sweep for latest state entries
				for (const item of sorted) {
					latestMap.set(entityKey(item), item);
				}
				// Reverse sweep for earliest base entries
				for (let i = sorted.length - 1; i >= 0; i--) {
					const entry = sorted[i];
					if (entry !== undefined) {
						earliestMap.set(entityKey(entry), entry);
					}
				}

				for (const item of latestMap.values())
					currentSum += Number(item[key] ?? 0);
				for (const item of earliestMap.values())
					baselineSum += Number(item[key] ?? 0);
			} else {
				// Fallback
				const last = sorted[sorted.length - 1];
				const first = sorted[0];
				currentSum = last ? Number(last[key] ?? 0) : 0;
				baselineSum = first ? Number(first[key] ?? 0) : 0;
			}

			results[key as string] = {
				total: currentSum,
				deltaPct:
					baselineSum > 0
						? ((currentSum - baselineSum) / baselineSum) * 100
						: 0,
			};
		}
	}

	return results;
}

export function Kpi({
	qty,
	title,
	delta,
	description,
}: {
	qty: string;
	title: string;
	delta?: {
		pct: number;
		period?: string;
	};
	description?: string;
}) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs text-zinc-400 font-medium">{title}</span>

			<span className="text-lg font-bold text-zinc-100 font-mono tracking-tight">
				{qty}
			</span>

			{delta === undefined ? (
				<span className="text-zinc-500 text-xs">{description ?? ""}</span>
			) : (
				<div className="flex items-center gap-1 text-xs">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						role="img"
						aria-hidden="true"
						className={`transform transition-transform duration-200 ${
							delta.pct < 0 ? "rotate-180 text-pink-400" : "text-cyan-400"
						}`}
					>
						<path
							d="M13.3021 7.7547L17.6821 14.2475C18.4182 15.3388 17.7942 17 16.6482 17L7.3518 17C6.2058 17 5.5818 15.3376 6.3179 14.2475L10.6979 7.7547C11.377 6.7484 12.623 6.7484 13.3021 7.7547Z"
							fill="currentColor"
						/>
					</svg>
					<div className="flex gap-2">
						<span className="font-mono font-semibold">
							{Math.abs(delta.pct).toFixed(2)}%
						</span>
						<span className="text-zinc-500">{delta.period}</span>
					</div>
				</div>
			)}
		</div>
	);
}
