import { NetworkMap } from "@/mapping";
import { InvalidParameters } from "./response";

type CategoryParams = {
	address: string;
	categoryCode: number;
	subcategoryCode: number;
	networkId?: number;
};

type TagParams = {
	tag: string;
	address: string;
	networkId?: number;
};

export function coerceNetworkId(
	network: string | undefined,
): number | undefined {
	if (!network || network === "*") return undefined;
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

	if (!tag || !address) {
		return InvalidParameters;
	}

	return {
		tag,
		address,
		networkId,
	};
}

export function coerceCatetoryWriteParams(
	params: Record<string, string>,
): Required<CategoryParams> | Response {
	const p = coerceCategoryParams(params);
	if (p instanceof Response) return p;
	if (p.networkId === undefined) return InvalidParameters;
	return p as Required<CategoryParams>;
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
