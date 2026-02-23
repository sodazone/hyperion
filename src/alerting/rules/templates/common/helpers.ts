import { NetworkMap } from "@/intel/mapping";
import type { BaseEvent } from "../../types";

const NAME_TAGS = ["exchange_name", "name", "alias"] as const;

type Tagged = {
	tags?: string[];
};

export const getName = (entity?: Tagged): string | undefined => {
	if (!entity?.tags) return undefined;

	for (const tag of NAME_TAGS) {
		const match = entity.tags.find((t) => t.startsWith(`${tag}:`));
		if (match) return match.slice(tag.length + 1);
	}

	return undefined;
};

export const makeLabels = (entity?: Tagged): string[] => {
	if (!entity?.tags) return [];

	const labelsSet = new Set<string>();

	for (const t of entity.tags) {
		const colonIndex = t.indexOf(":");
		const label = colonIndex > -1 ? t.slice(colonIndex + 1) : t;
		if (label) labelsSet.add(label);
	}

	return [...labelsSet];
};

export function makeNetworks(event: BaseEvent) {
	const networks = [
		{
			role: "origin",
			network: NetworkMap.fromURN(event.origin.chainURN) ?? 0,
			tx_hash: event.origin.txHash,
			block_number: event.origin.blockHeight,
			block_hash: event.origin.blockHash,
		},
	];

	if (event.destination !== undefined) {
		networks.push({
			role: "destination",
			network: NetworkMap.fromURN(event.destination.chainURN) ?? 0,
			tx_hash: event.destination.txHash,
			block_number: event.destination.blockHeight,
			block_hash: event.destination.blockHash,
		});
	}

	return networks;
}
