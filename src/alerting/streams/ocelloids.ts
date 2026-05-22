import {
	createCrosschainAgent,
	createCrosschainIssuanceAgent,
	createDefiAgent,
	createOpenGovAgent,
	createTransfersAgent,
	type EventId,
	type OcelloidsClientApi,
} from "@sodazone/ocelloids-client";
import type {
	DefiLiquidityEvent,
	IssuanceEvent,
	OpenGovEvent,
	TransferEvent,
} from "../rules";
import {
	mapDefiLiquidity,
	mapIssuance,
	mapJourney,
	mapOpenGov,
	mapTransfer,
} from "./mapper";
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

	subscribeDefiLiquidity: (
		params: { subscriptionId: string },
		emit: (msg: DefiLiquidityEvent) => void,
	) => Promise<() => void>;

	subscribeDefiEvents: (
		emit: (msg: TransferEvent) => void,
	) => Promise<() => void>;

	subscribeTransfers: (
		emit: (msg: TransferEvent) => void,
	) => Promise<() => void>;

	subscribeXc: (emit: (msg: TransferEvent) => void) => Promise<() => void>;

	subscribeOpenGov: (emit: (msg: OpenGovEvent) => void) => Promise<() => void>;

	close: () => Promise<void>;
};

const subIds = {
	transfers: Bun.env.OC_TRANSFERS_SUB_ID || "transfers-all-networks",
	xc: Bun.env.OC_XC_SUB_ID || "xc-all-networks",
	og: Bun.env.OC_OG_SUB_ID || "opengov-all-networks",
	defiEvents: Bun.env.OC_DEFI_EVENTS_SUB_ID || "defi-events-all-networks",
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
			if (attempt > 0) {
				console.log(`[health] check, attempt=${attempt}`);
			}

			attempt++;

			const res = await client.health({ signal });

			if (res.statusCode !== 200) {
				throw new Error(`Health check failed: ${res.status}`);
			}

			return;
		} catch (err) {
			if (signal.aborted) {
				throw err;
			}
			console.error("[health] failed, retrying...", err);
			// TODO: add jitter
			await sleep(4_000, signal);
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
	const opengov = createOpenGovAgent(OC_CONFIG);
	const defi = createDefiAgent(OC_CONFIG);

	const pointers = createPointerStorage(storagePath);

	const subscriptions: (() => void)[] = [];

	function createManagedSubscription(options: {
		client: OcelloidsClientApi;
		maxIdle?: number;
		tag: string;
		start: (ctx: {
			onMessage: () => void;
			onClose: () => void;
			onError: (err: unknown) => void;
		}) => Promise<{ close: () => void }>;
	}) {
		const controller = new AbortController();

		const reconnectable = withReconnect({
			tag: options.tag,
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
		subscribeDefiLiquidity: async ({ subscriptionId }, emit) => {
			const sub = createManagedSubscription({
				tag: `defi-liquidity:${subscriptionId}`,
				client: defi,
				maxIdle: 60_000 * 60,
				start: async ({ onMessage, onClose, onError }) => {
					return defi.subscribe(subscriptionId, {
						onMessage: (message) => {
							onMessage();
							const event = mapDefiLiquidity(message);
							if (event) emit(event);
						},
						onClose,
						onError,
					});
				},
			});

			return sub.start();
		},

		subscribeDefiEvents: async (emit) => {
			const sub = createManagedSubscription({
				tag: "defi-events",
				client: defi,
				maxIdle: 60_000 * 5,
				start: async ({ onMessage, onClose, onError }) => {
					const lastSeenId = await pointers.load("d.e");
					console.log("[defi-events] lastSeenId", lastSeenId);

					return defi.subscribeWithReplay(
						subIds.defiEvents,
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
							onPersist: async (id: EventId) => {
								pointers.save("d.e", id);
							},
							lastSeenId,
						},
					);
				},
			});

			return sub.start();
		},

		subscribeIssuance: async ({ subscriptionId }, emit) => {
			const sub = createManagedSubscription({
				tag: `issuance:${subscriptionId}`,
				client: issuance,
				maxIdle: 60_000 * 60,
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
				tag: "xc",
				client: crosschain,
				maxIdle: 60_000 * 30,
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
							onPersist: async (id: EventId) => {
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
				tag: "transfers",
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
							onPersist: async (id: EventId) => {
								pointers.save("t", id);
							},
							lastSeenId,
						},
					);
				},
			});

			return sub.start();
		},

		subscribeOpenGov: async (emit) => {
			const sub = createManagedSubscription({
				tag: "opengov",
				client: opengov,
				maxIdle: 60_000 * 60 * 24,
				start: async ({ onMessage, onClose, onError }) => {
					return opengov.subscribe(subIds.og, {
						onMessage: (message) => {
							onMessage();
							const event = mapOpenGov(message);
							if (event) emit(event);
						},
						onError,
						onClose,
						onAuthError: onError,
					});
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
