import {
	createCrosschainAgent,
	createCrosschainIssuanceAgent,
	createTransfersAgent,
	type OcelloidsClientApi,
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
	) => Promise<() => void>;

	subscribeTransfers: (
		emit: (msg: TransferEvent) => void,
	) => Promise<() => void>;

	subscribeXc: (emit: (msg: TransferEvent) => void) => Promise<() => void>;

	close: () => Promise<void>;
};

const subIds = {
	transfers: Bun.env.OC_TRANSFERS_SUB_ID || "transfers-all-networks",
	xc: Bun.env.OC_XC_SUB_ID || "xc-all-networks",
};

function sleep(ms: number, signal: AbortSignal) {
	return new Promise<void>((resolve, reject) => {
		const id = setTimeout(() => {
			signal.removeEventListener("abort", onAbort);
			resolve();
		}, ms);

		function onAbort() {
			clearTimeout(id);
			signal.removeEventListener("abort", onAbort);
			reject(new Error("Sleep aborted"));
		}

		signal.addEventListener("abort", onAbort);
	});
}

async function waitForHealthy(client: OcelloidsClientApi, signal: AbortSignal) {
	let attempt = 0;

	while (true) {
		if (signal.aborted) {
			throw new Error("Health check aborted");
		}

		try {
			attempt++;
			console.log(`[health] check, attempt=${attempt}`);

			const res = await client.health({ signal });

			if (res.statusCode !== 200) {
				throw new Error(`Health check failed: ${res.status}`);
			}

			console.log("[health] OK");
			return;
		} catch (err) {
			if (signal.aborted) {
				throw err;
			}
			console.error("[health] failed, retrying...", err);
			await sleep(2000, signal);
		}
	}
}

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

	function createManagedSubscription(options: {
		client: OcelloidsClientApi;
		maxIdle?: number;
		start: (ctx: {
			onMessage: () => void;
			onClose: () => void;
			onError: (err: unknown) => void;
		}) => Promise<{ close: () => void }>;
	}) {
		const controller = new AbortController();

		const reconnectable = withReconnect({
			maxIdle: options.maxIdle,
			start: async (ctx) => {
				await waitForHealthy(options.client, controller.signal);
				return options.start(ctx);
			},
		});

		const start = async () => {
			await reconnectable.start();

			const stop = () => {
				if (!controller.signal.aborted) {
					controller.abort();
				}
				reconnectable.stop();
				const idx = subscriptions.indexOf(stop);
				if (idx !== -1) {
					subscriptions.splice(idx, 1);
				}
			};

			subscriptions.push(stop);
			return stop;
		};

		return { start };
	}

	return {
		subscribeIssuance: async ({ subscriptionId }, emit) => {
			const sub = createManagedSubscription({
				client: issuance,
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

			return sub.start();
		},

		subscribeXc: async (emit) => {
			const sub = createManagedSubscription({
				client: crosschain,
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

			return sub.start();
		},

		subscribeTransfers: async (emit) => {
			const sub = createManagedSubscription({
				client: transfers,
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

			return sub.start();
		},

		close: async () => {
			for (const stop of subscriptions) {
				stop();
			}
		},
	};
}

export type CreateStreamsClient = typeof createOcelloidsClient;
