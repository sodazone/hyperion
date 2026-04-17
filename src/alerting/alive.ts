type AliveOptions = {
	intervalMs: number;
};

export function createAliveTracker(opts: AliveOptions) {
	const lastSeen: Record<string, number> = Object.create(null);

	return function mark(type: string) {
		const now = Date.now();
		const last = lastSeen[type] || 0;

		if (now - last >= opts.intervalMs) {
			console.log(`[alive] ${type} (${now})`);
			lastSeen[type] = now;
		}
	};
}
