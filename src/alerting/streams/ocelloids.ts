import { createTransfersAgent } from "@sodazone/ocelloids-client";
import type { AnyEvent, TransferEvent } from "../rules";
import { createPointerStorage } from "./pointers";

export type OcelloidsClient = {
	subscribeStorage: (
		params: { chain: string; key: string },
		emit: (msg: AnyEvent) => void,
	) => Promise<() => void> | (() => void);

	subscribeTransfers: (
		emit: (msg: AnyEvent) => void,
	) => Promise<() => void> | (() => void);

	close: () => Promise<void>;
};

const subIds = {
	transfers: "transfers-all-networks",
};

function mapTransfer(tx: any): TransferEvent {
	return {
		type: "transfer",
		chain: tx.network,
		blockHeight: tx.blockNumber,
		txHash: tx.txPrimary,
		blockHash: tx.blockHash,
		timestamp: tx.sentAt ?? Date.now(),
		addresses: [tx.from, tx.to],
		payload: {
			from: tx.from,
			to: tx.to,
			fromFormatted: tx.fromFormatted,
			toFormatted: tx.toFormatted,
			amount: BigInt(tx.amount),
			amountUsd: tx.usd,
			asset: {
				id: tx.asset,
				symbol: tx.symbol,
				decimals: tx.decimals,
			},
		},
	};
}

export async function createOcelloidsClient({
	storagePath,
}: {
	storagePath: string;
}): Promise<OcelloidsClient> {
	const transfers = createTransfersAgent({
		httpUrl: "http://127.0.0.1:3000",
		wsUrl: "ws://127.0.0.1:3000",
	});

	const pointers = createPointerStorage(storagePath);
	const lastSeenId = await pointers.load("t");

	const subs: WebSocket[] = [];

	return {
		subscribeStorage: (_params, _emit) => {
			throw new Error("Not implemented");
		},
		subscribeTransfers: async (emit) => {
			const sub = await transfers.subscribeWithReplay(
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
			subs.push(sub);
			return () => {
				sub.close();
			};
		},
		close: async () => {
			for (const sub of subs) {
				sub.close();
			}
		},
	};
}
