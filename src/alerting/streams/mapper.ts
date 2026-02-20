import { type TransferEvent, TransferStatus } from "../rules";

export function mapJourney(j: any): void {
	console.log(j);
}

export function mapTransfer(tx: any): TransferEvent {
	return {
		type: "transfer",
		chain: tx.network,
		blockHeight: tx.blockNumber,
		txHash: tx.txPrimary,
		blockHash: tx.blockHash,
		timestamp: tx.sentAt ?? Date.now(),
		addresses: [tx.from, tx.to],
		assets: [tx.asset],
		payload: {
			correlationId: tx.transferHash,
			protocol: tx.eventModule,
			from: tx.from,
			to: tx.to,
			status: TransferStatus.SUCCESS,
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
