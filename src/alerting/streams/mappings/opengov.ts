import type { Message } from "@sodazone/ocelloids-client";
import type { OpenGovEvent } from "@/alerting/rules";
import {
	humanizeStatus,
	mapEventType,
} from "@/alerting/rules/templates/opengov/support/helpers";
import type { OpenGovPayload } from "@/alerting/rules/templates/opengov/support/types";

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
