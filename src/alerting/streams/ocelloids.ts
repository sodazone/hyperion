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
}: {
	start: () => Promise<WebSocket>;
	maxDelay?: number;
}) {
	let stopped = false;
	let socket: WebSocket | null = null;
	let retryDelay = 1_000;

	const connect = async () => {
		if (stopped) return;

		try {
			socket = await start();
			retryDelay = 1_000;
		} catch (err) {
			console.error("Subscription failed, retrying...", err);
			scheduleReconnect();
		}
	};

	const scheduleReconnect = () => {
		if (stopped) return;

		setTimeout(() => {
			retryDelay = Math.min(retryDelay * 2, maxDelay);
			connect();
		}, retryDelay);
	};

	const handleCloseOrError = () => {
		if (stopped) return;
		console.warn("Socket closed. Reconnecting...");
		scheduleReconnect();
	};

	const startWrapper = async () => {
		await connect();
		if (!socket) return;

		socket.addEventListener("close", handleCloseOrError);
		socket.addEventListener("error", handleCloseOrError);
	};

	const stop = () => {
		stopped = true;
		socket?.terminate();
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
				start: async () => {
					const lastSeenId = await pointers.load("x");

					return crosschain.subscribeWithReplay(
						subIds.xc,
						{
							onMessage: ({ payload }) => {
								const event = mapJourney(payload);
								if (event) emit(event);
							},
							onError: (error) => {
								console.error("XC error:", error);
							},
							onClose: () => {
								console.warn("XC closed");
							},
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
				start: async () => {
					const lastSeenId = await pointers.load("t");

					return transfers.subscribeWithReplay(
						subIds.transfers,
						{
							onMessage: ({ payload }) => {
								emit(mapTransfer(payload));
							},
							onError: (error) => {
								console.error("Transfers error:", error);
							},
							onClose: () => {
								console.warn("Transfers closed");
							},
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
