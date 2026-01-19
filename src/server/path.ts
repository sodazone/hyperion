import { NetworkMap } from "@/mapping";
import { InvalidParameters } from "./response";

type CategoryParams = {
	address: string;
	categoryCode: number;
	subcategoryCode: number;
	networkId: number;
};

type TagParams = {
	tag: string;
	address: string;
	networkId: number;
};

export function coerceNetworkId(
	network: string | undefined,
): number | undefined {
	if (!network) return undefined;
	const networkId = Number.isInteger(Number(network))
		? Number(network)
		: NetworkMap.fromURN(network);
	return networkId;
}

export function coerceTagParams(
	params: Record<string, string>,
): TagParams | Response {
	const { tag, address, network } = params;

	const networkId = coerceNetworkId(network);

	if (!tag || !address || networkId === undefined) {
		return InvalidParameters;
	}

	return {
		tag,
		address,
		networkId,
	};
}

export function coerceCategoryParams(
	params: Record<string, string>,
): CategoryParams | Response {
	const { cat, subcat, address, network } = params;

	const categoryCode = Number(cat);
	const subcategoryCode = Number(subcat);

	const networkId = coerceNetworkId(network);

	if (
		!Number.isInteger(categoryCode) ||
		!Number.isInteger(subcategoryCode) ||
		networkId === undefined ||
		address === undefined
	) {
		return InvalidParameters;
	}

	return {
		address,
		categoryCode,
		subcategoryCode,
		networkId,
	};
}
