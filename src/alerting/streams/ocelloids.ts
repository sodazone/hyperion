import {
	createCrosschainAgent,
	createTransfersAgent,
} from "@sodazone/ocelloids-client";
import type { AnyEvent } from "../rules";
import { mapJourney, mapTransfer } from "./mapper";
import { createPointerStorage } from "./pointers";

const OC_CONFIG = {
	httpUrl: Bun.env.OC_HTTP_URL || "http://127.0.0.1:3000",
	wsUrl: Bun.env.OC_WS_URL || "ws://127.0.0.1:3000",
	apiKey: Bun.env.OC_API_KEY,
};

export type OcelloidsClient = {
	subscribeStorage: (
		params: { chain: string; key: string },
		emit: (msg: AnyEvent) => void,
	) => Promise<() => void> | (() => void);

	subscribeTransfers: (
		emit: (msg: AnyEvent) => void,
	) => Promise<() => void> | (() => void);

	subscribeXc: (
		emit: (msg: AnyEvent) => void,
	) => Promise<() => void> | (() => void);

	close: () => Promise<void>;
};

const subIds = {
	transfers: "transfers-all-networks",
	xc: "xc-all-networks",
};

function withReconnect({
	start,
	maxDelay = 30_000,
	minDelay = 1_000,
}: {
	start: (hooks: {
		onOpen: () => void;
		onMessage: () => void;
		onClose: (err?: any) => void;
		onError: (err?: any) => void;
	}) => Promise<{ close: () => void }>;
	maxDelay?: number;
	minDelay?: number;
}) {
	let stopped = false;
	let current: { close: () => void } | null = null;
	let retryDelay = minDelay;
	let reconnectTimer: Timer | null = null;
	let connecting = false;
	let hasReceivedMessage = false;

	const clearReconnectTimer = () => {
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
		}
	};

	const scheduleReconnect = () => {
		if (stopped) return;
		if (reconnectTimer) return;
		if (connecting) return;

		const jitter = Math.random() * 0.3 + 0.85;
		const delay = Math.min(retryDelay * jitter, maxDelay);

		console.warn(`Reconnecting in ${Math.round(delay)}ms`);

		reconnectTimer = setTimeout(() => {
			reconnectTimer = null;
			retryDelay = Math.min(retryDelay * 2, maxDelay);
			connect();
		}, delay);
	};

	const handleCloseOrError = (err?: any) => {
		if (stopped) return;

		console.warn("Connection lost", err ?? "");

		current?.close();
		current = null;

		scheduleReconnect();
	};

	const connect = async () => {
		if (stopped) return;
		if (connecting) return;

		connecting = true;
		hasReceivedMessage = false;

		try {
			current = await start({
				onOpen: () => {
					console.log("Connected");
				},
				onMessage: () => {
					if (!hasReceivedMessage) {
						hasReceivedMessage = true;
						retryDelay = minDelay;
					}
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
		current?.close();
		current = null;
	};

	return { start: startWrapper, stop };
}

export async function createOcelloidsClient({
	storagePath,
}: {
	storagePath: string;
}): Promise<OcelloidsClient> {
	const transfers = createTransfersAgent(OC_CONFIG);
	const crosschain = createCrosschainAgent(OC_CONFIG);
	const pointers = createPointerStorage(storagePath);

	const subscriptions: (() => void)[] = [];

	return {
		subscribeStorage: () => {
			throw new Error("Not implemented");
		},

		subscribeXc: async (emit) => {
			const reconnectable = withReconnect({
				start: async ({ onMessage, onClose, onError }) => {
					const lastSeenId = await pointers.load("x");

					return crosschain.subscribeWithReplay(
						subIds.xc,
						{
							onMessage: ({ payload }) => {
								onMessage();
								const event = mapJourney(payload);
								if (event) emit(event);
							},
							onError,
							onClose,
						},
						{
							onPersist: async (id: number) => {
								pointers.save("x", id);
							},
							lastSeenId,
						},
					);
				},
			});

			await reconnectable.start();
			subscriptions.push(reconnectable.stop);

			return reconnectable.stop;
		},

		subscribeTransfers: async (emit) => {
			const reconnectable = withReconnect({
				start: async ({ onMessage, onClose, onError }) => {
					const lastSeenId = await pointers.load("t");

					return transfers.subscribeWithReplay(
						subIds.transfers,
						{
							onMessage: ({ payload }) => {
								onMessage();
								emit(mapTransfer(payload));
							},
							onError,
							onClose,
						},
						{
							onPersist: async (id: number) => {
								pointers.save("t", id);
							},
							lastSeenId,
						},
					);
				},
			});

			await reconnectable.start();
			subscriptions.push(reconnectable.stop);

			return reconnectable.stop;
		},

		close: async () => {
			for (const stop of subscriptions) {
				stop();
			}
		},
	};
}
