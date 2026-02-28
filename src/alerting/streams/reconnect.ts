export function withReconnect({
	start,
	maxDelay = 30_000,
	minDelay = 1_000,
	maxIdle,
}: {
	start: (hooks: {
		onOpen: () => void;
		onMessage: () => void;
		onClose: (err?: any) => void;
		onError: (err?: any) => void;
	}) => Promise<{ close: () => void }>;
	maxDelay?: number;
	minDelay?: number;
	maxIdle?: number;
}) {
	let stopped = false;
	let current: { close: () => void } | null = null;
	let retryDelay = minDelay;
	let reconnectTimer: Timer | null = null;
	let idleTimer: Timer | null = null;
	let connecting = false;
	let hasReceivedMessage = false;

	const clearReconnectTimer = () => {
		if (reconnectTimer) clearTimeout(reconnectTimer);
		reconnectTimer = null;
	};

	const clearIdleTimer = () => {
		if (idleTimer) clearTimeout(idleTimer);
		idleTimer = null;
	};

	const resetIdleTimer = () => {
		clearIdleTimer();
		if (!maxIdle) return; // only start idle timer if maxIdle is provided
		idleTimer = setTimeout(() => {
			console.info("Idle timeout reached, reconnecting...");
			handleCloseOrError(new Error("Idle timeout"));
		}, maxIdle);
	};

	const scheduleReconnect = () => {
		if (stopped || reconnectTimer || connecting) return;

		const jitter = Math.random() * 0.3 + 0.85;
		const delay = Math.min(retryDelay * jitter, maxDelay);

		console.info(`Reconnecting in ${Math.round(delay)}ms`);

		reconnectTimer = setTimeout(() => {
			reconnectTimer = null;
			retryDelay = Math.min(retryDelay * 2, maxDelay);
			connect();
		}, delay);
	};

	const handleCloseOrError = (err?: any) => {
		if (stopped) return;

		console.warn("Connection lost", err ?? "");
		clearIdleTimer();
		try {
			current?.close();
		} catch {
			//
		}
		current = null;

		scheduleReconnect();
	};

	const connect = async () => {
		if (stopped || connecting) return;

		connecting = true;
		hasReceivedMessage = false;

		try {
			current = await start({
				onOpen: () => {
					console.log("Connected");
					resetIdleTimer();
				},
				onMessage: () => {
					if (!hasReceivedMessage) {
						hasReceivedMessage = true;
						retryDelay = minDelay;
					}
					resetIdleTimer();
				},
				onClose: handleCloseOrError,
				onError: handleCloseOrError,
			});
		} catch (err) {
			console.error("Initial connection failed", err);
			scheduleReconnect();
		} finally {
			connecting = false;
		}
	};

	const startWrapper = async () => {
		await connect();
	};

	const stop = () => {
		stopped = true;
		clearReconnectTimer();
		clearIdleTimer();
		current?.close();
		current = null;
	};

	return { start: startWrapper, stop };
}
