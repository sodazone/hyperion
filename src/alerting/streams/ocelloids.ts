import { here } from "@/utils";
import type { AnyEvent } from "../rules";

export type OcelloidsClient = {
	subscribeStorage: (
		params: { chain: string; key: string },
		emit: (msg: AnyEvent) => void,
	) => () => void;

	subscribeTransfers: (emit: (msg: AnyEvent) => void) => () => void;
};

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createDummyOcelloidsClient(): Promise<OcelloidsClient> {
	const fromHere = here(import.meta);
	const file = Bun.file(fromHere("../../../tests/__data__/transfers-fat.json"));
	const transfers: any[] = await file.json();

	return {
		subscribeStorage: (_params, _emit) => {
			return () => {};
		},

		subscribeTransfers: (emit) => {
			let cancelled = false;

			console.log("Subscribing to transfers...");

			(async () => {
				for (const tx of transfers) {
					if (cancelled) break;

					try {
						const event: AnyEvent = {
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

						emit(event);
					} catch (err) {
						console.error("Failed to emit transfer:", err);
					}

					await sleep(100); // wait before next
				}
			})();

			return () => {
				cancelled = true;
			};
		},
	};
}
