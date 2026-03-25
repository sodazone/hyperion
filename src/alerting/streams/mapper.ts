import type { issuance, Message } from "@sodazone/ocelloids-client";
import {
	type IssuanceEvent,
	type OpenGovEvent,
	type TransferEvent,
	TransferStatus,
} from "../rules";
import {
	humanizeStatus,
	mapEventType,
} from "../rules/templates/opengov/support/helpers";
import type { OpenGovPayload } from "../rules/templates/opengov/support/types";

export function mapJourney({
	type,
	from,
	to,
	fromFormatted,
	toFormatted,
	correlationId,
	originProtocol,
	destinationProtocol,
	destinationTxPrimary,
	status,
	origin,
	destination,
	originTxPrimary,
	stops,
	assets,
	totalUsd,
}: {
	origin: string;
	destination: string;
	status: string;
	correlationId: string;
	originProtocol: string;
	destinationProtocol: string;
	type: string;
	to: string;
	from: string;
	fromFormatted?: string;
	toFormatted?: string;
	originTxPrimary?: string;
	destinationTxPrimary?: string;
	totalUsd?: number;
	stops: string;
	assets: {
		asset: string;
		symbol?: string;
		amount: string;
		decimals?: number;
		usd?: number;
	}[];
}): TransferEvent | null {
	if (
		(type === "transfer" || type === "teleport") &&
		(status === "received" || status === "failed") &&
		assets?.length
	) {
		try {
			const stopsArray = JSON.parse(stops);
			const start = stopsArray[0];
			const end = stopsArray[stopsArray.length - 1];
			if (start !== undefined && end !== undefined) {
				return {
					type: "transfer",
					addresses: [from, to],
					origin: {
						chainURN: origin,
						blockHeight: start.from.blockNumber,
						txHash: originTxPrimary,
						blockHash: start.from.blockHash,
						timestamp: start.from.timestamp ?? Date.now(),
						protocol: originProtocol,
					},
					destination: {
						chainURN: destination,
						blockHeight: end.to.blockNumber,
						txHash: destinationTxPrimary,
						blockHash: end.to.blockHash,
						timestamp: end.to.timestamp ?? Date.now(),
						protocol: destinationProtocol,
					},
					payload: {
						status:
							status === "received"
								? TransferStatus.SUCCESS
								: TransferStatus.FAILURE,
						from: {
							address: from,
							addressFormatted: fromFormatted ?? from,
						},
						to: {
							address: to,
							addressFormatted: toFormatted ?? to,
						},
						correlationId,
						totalUsd: totalUsd ?? 0,
						assets: assets.map((a) => ({
							id: a.asset,
							symbol: a.symbol ?? "??",
							decimals: a.decimals ?? 0,
							amount: a.amount,
							amountUsd: a.usd ?? 0,
						})),
					},
				};
			}
		} catch {
			//
		}
	}
	return null;
}

export function mapIssuance({
	metadata,
	payload,
}: Message<issuance.CrosschainIssuancePayload>): IssuanceEvent {
	const subscriptionId = metadata.subscriptionId;
	const protocol =
		subscriptionId.indexOf("_") > -1
			? (subscriptionId.split("_")[1] ?? "unknown")
			: "unknown";
	return {
		type: "issuance",
		payload: {
			subscriptionId,
			protocol,
			...payload,
		},
		origin: {
			chainURN: metadata.networkId,
			timestamp: metadata.blockTimestamp ?? metadata.timestamp,
		},
	};
}

export function mapTransfer(tx: any): TransferEvent {
	return {
		type: "transfer",
		origin: {
			chainURN: tx.network,
			blockHeight: tx.blockNumber,
			txHash: tx.txPrimary,
			blockHash: tx.blockHash,
			timestamp: tx.sentAt ?? Date.now(),
			protocol: tx.eventModule,
		},
		addresses: [tx.from, tx.to],
		assets: [tx.asset],
		payload: {
			status: TransferStatus.SUCCESS,
			correlationId: tx.transferHash,
			from: {
				address: tx.from,
				addressFormatted: tx.fromFormatted,
			},
			to: {
				address: tx.to,
				addressFormatted: tx.toFormatted,
			},
			totalUsd: tx.usd,
			assets: [
				{
					id: tx.asset,
					symbol: tx.symbol,
					decimals: tx.decimals,
					amount: tx.amount,
					amountUsd: tx.usd,
				},
			],
		},
	};
}

export function mapOpenGov(message: Message): OpenGovEvent | null {
	const payload = message.payload as OpenGovPayload;
	const eventType = mapEventType(payload);

	if (!eventType) {
		console.log("[opengov] event type not found", message);
		return null;
	}

	const status = humanizeStatus(eventType);
	const addresses: string[] = [];

	if (payload.deposits?.decisionDeposit !== undefined) {
		addresses.push(payload.deposits.decisionDeposit.who);
	}
	if (payload.deposits?.submissionDeposit !== undefined) {
		addresses.push(payload.deposits.submissionDeposit.who);
	}

	return {
		type: "opengov",
		addresses,
		origin: {
			chainURN: message.metadata.networkId,
			timestamp:
				message.metadata.blockTimestamp ??
				message.metadata.timestamp ??
				Date.now(),
		},
		payload: {
			id: payload.id,
			chainId: payload.chainId,
			eventType,
			humanized: {
				status,
			},
			triggeredBy: payload.triggeredBy,
			info: payload.info,
			decodedCall: payload.decodedCall,
			content: payload.content,
			timeline: {
				// ...
			},
		},
	};
}
