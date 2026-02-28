import {
	createCrosschainAgent,
	createTransfersAgent,
} from "@sodazone/ocelloids-client";
import type { AnyEvent } from "../rules";
import { mapJourney, mapTransfer } from "./mapper";
import { createPointerStorage } from "./pointers";
import { withReconnect } from "./reconnect";

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
	transfers: Bun.env.OC_TRANSFERS_SUB_ID || "transfers-all-networks",
	xc: Bun.env.OC_XC_SUB_ID || "xc-all-networks",
};

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

					console.log("[crosschain] lastSeenId", lastSeenId);

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
							onAuthError: onError,
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

					console.log("[transfers] lastSeenId", lastSeenId);

					return transfers.subscribeWithReplay(
						subIds.transfers,
						{
							onMessage: ({ payload }) => {
								onMessage();
								emit(mapTransfer(payload));
							},
							onError,
							onClose,
							onAuthError: onError,
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
