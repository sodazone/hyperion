interface CacheEntry {
	timestamps: number[];
	windowMs: number;
	lastUpdated: number;
}

const memoryCache = new Map<string, CacheEntry>();

export interface RateLimitOptions {
	key: string;
	limit: number;
	windowMs: number;
}

/**
 * Checks and records rate limits using an in-memory sliding window.
 * Stale tracking entries are automatically evicted by a background sweeper.
 *
 * @param options.key - A unique compound identifier (e.g., `${instanceId}:${ruleName}:${marketId}:${reason}`).
 * @param options.limit - The maximum number of allowed alerts within the window.
 * @param options.windowMs - The rolling time window duration in milliseconds.
 * @returns `true` if the alert is within limits and recorded; `false` if suppressed by the rate limiter.
 */
export function checkAndRecordRateLimit({
	key,
	limit,
	windowMs,
}: RateLimitOptions): boolean {
	const now = Date.now();
	const entry = memoryCache.get(key);
	const currentTimestamps = entry ? entry.timestamps : [];
	const validTimestamps = currentTimestamps.filter((ts) => now - ts < windowMs);

	if (validTimestamps.length >= limit) {
		memoryCache.set(key, {
			timestamps: validTimestamps,
			windowMs,
			lastUpdated: now,
		});
		return false;
	}

	validTimestamps.push(now);

	memoryCache.set(key, {
		timestamps: validTimestamps,
		windowMs,
		lastUpdated: now,
	});

	return true;
}

setInterval(
	() => {
		const now = Date.now();

		for (const [key, entry] of memoryCache.entries()) {
			if (now - entry.lastUpdated > entry.windowMs) {
				memoryCache.delete(key);
			}
		}
	},
	60 * 60 * 1000,
).unref();
