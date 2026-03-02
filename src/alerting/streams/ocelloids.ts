import {
	createCrosschainAgent,
	createCrosschainIssuanceAgent,
	createTransfersAgent,
} from "@sodazone/ocelloids-client";
import type { IssuanceEvent, TransferEvent } from "../rules";
import { mapIssuance, mapJourney, mapTransfer } from "./mapper";
import { createPointerStorage } from "./pointers";
import { withReconnect } from "./reconnect";

const OC_CONFIG = {
	httpUrl: Bun.env.OC_HTTP_URL || "http://127.0.0.1:3000",
	wsUrl: Bun.env.OC_WS_URL || "ws://127.0.0.1:3000",
	apiKey: Bun.env.OC_API_KEY,
};

export type StreamsClient = {
	subscribeIssuance: (
		params: { subscriptionId: string },
		emit: (msg: IssuanceEvent) => void,
	) => Promise<() => void> | (() => void);

	subscribeTransfers: (
		emit: (msg: TransferEvent) => void,
	) => Promise<() => void> | (() => void);

	subscribeXc: (
		emit: (msg: TransferEvent) => void,
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
}): Promise<StreamsClient> {
	const transfers = createTransfersAgent(OC_CONFIG);
	const crosschain = createCrosschainAgent(OC_CONFIG);
	const issuance = createCrosschainIssuanceAgent(OC_CONFIG);
	const pointers = createPointerStorage(storagePath);

	const subscriptions: (() => void)[] = [];

	return {
		subscribeIssuance: async ({ subscriptionId }, emit) => {
			const reconnectable = withReconnect({
				start: async ({ onMessage, onClose, onError }) => {
					return issuance.subscribe(subscriptionId, {
						onMessage: (message) => {
							onMessage();
							const event = mapIssuance(message);
							if (event) emit(event);
						},
						onClose,
						onError,
					});
				},
			});
			await reconnectable.start();
			subscriptions.push(reconnectable.stop);
			return reconnectable.stop;
		},

		subscribeXc: async (emit) => {
			const reconnectable = withReconnect({
				maxIdle: 60_000 * 60,
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
				maxIdle: 60_000 * 5,
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

export type CreateStreamsClient = typeof createOcelloidsClient;
