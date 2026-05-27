import type { issuance, Message } from "@sodazone/ocelloids-client";
import type { IssuanceEvent } from "@/alerting/rules";

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
