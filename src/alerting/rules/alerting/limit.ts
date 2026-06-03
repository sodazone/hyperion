import type { StateStore } from "../types";

export interface RateLimitOptions {
	state: StateStore;
	scope: string;
	key: string;
	limit: number;
	windowMs: number;
}

/**
 * Checks and records rate limits against a scope/key pair.
 */
export function checkAndRecordRateLimit({
	state,
	scope,
	key,
	limit,
	windowMs,
}: RateLimitOptions): boolean {
	const currentTimestamps = (state.get(scope, key) ?? []) as number[];
	const now = Date.now();

	const validTimestamps = currentTimestamps.filter((ts) => now - ts < windowMs);

	if (validTimestamps.length >= limit) {
		return false;
	}

	validTimestamps.push(now);
	state.set(scope, key, validTimestamps);

	return true;
}
