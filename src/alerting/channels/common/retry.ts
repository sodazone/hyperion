type RetryConfig = {
	retryAttempts?: number;
	baseDelayMs?: number;
	maxDelayMs?: number;
	rateLimitDelayMs?: number;
};

const DEFAULTS = {
	retryAttempts: 5,
	baseDelayMs: 500,
	maxDelayMs: 10_000,
	rateLimitDelayMs: 50,
};

function computeBackoff(
	attempt: number,
	baseDelayMs: number,
	maxDelayMs: number,
) {
	const delay = baseDelayMs * 2 ** (attempt - 1);
	return Math.min(delay, maxDelayMs);
}

async function sleep(ms: number) {
	return Bun.sleep(ms);
}

export async function withRetry(fn: () => Promise<void>, config?: RetryConfig) {
	const {
		retryAttempts = DEFAULTS.retryAttempts,
		baseDelayMs = DEFAULTS.baseDelayMs,
		maxDelayMs = DEFAULTS.maxDelayMs,
		rateLimitDelayMs = DEFAULTS.rateLimitDelayMs,
	} = config ?? {};

	let attempt = 0;

	while (true) {
		try {
			await fn();

			if (rateLimitDelayMs > 0) {
				await sleep(rateLimitDelayMs);
			}

			return;
		} catch (err: any) {
			if (attempt >= retryAttempts) {
				throw err;
			}

			attempt++;

			const delay = computeBackoff(attempt, baseDelayMs, maxDelayMs);

			console.warn(
				`Retry ${attempt}/${retryAttempts} in ${delay}ms`,
				err?.message,
			);

			await sleep(delay);
		}
	}
}
