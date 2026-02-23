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

export async function createOcelloidsClient({
	storagePath,
}: {
	storagePath: string;
}): Promise<OcelloidsClient> {
	const transfers = createTransfersAgent(OC_CONFIG);
	const crosschain = createCrosschainAgent(OC_CONFIG);

	const pointers = createPointerStorage(storagePath);

	const subs: WebSocket[] = [];

	return {
		subscribeStorage: (_params, _emit) => {
			throw new Error("Not implemented");
		},
		subscribeXc: async (emit) => {
			const lastSeenId = await pointers.load("x");

			const xcSub = await crosschain.subscribeWithReplay(
				subIds.xc,
				{
					onMessage: ({ payload }) => {
						const event = mapJourney(payload);
						if (event !== null) {
							console.log("EMIT", event);
							emit(event);
						}
					},
					onError: (error) => console.log(error),
					onClose: (event) => console.log(event.reason),
				},
				{
					onPersist: async (id: number) => {
						pointers.save("x", id);
					},
					lastSeenId,
				},
			);

			subs.push(xcSub);

			return () => {
				xcSub.close();
			};
		},
		subscribeTransfers: async (emit) => {
			const lastSeenId = await pointers.load("t");

			const transfersSub = await transfers.subscribeWithReplay(
				subIds.transfers,
				{
					onMessage: ({ payload }) => {
						emit(mapTransfer(payload));
					},
					onError: (error) => console.log(error),
					onClose: (event) => console.log(event.reason),
				},
				{
					onPersist: async (id: number) => {
						pointers.save("t", id);
					},
					lastSeenId,
				},
			);

			subs.push(transfersSub);

			return () => {
				transfersSub.close();
			};
		},
		close: async () => {
			for (const sub of subs) {
				sub.close();
			}
		},
	};
}
