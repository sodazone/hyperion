import { PUBLIC_OWNER } from "@/db";
import { NetworkMap } from "@/intel/mapping";
import { InvalidParameters } from "../response";

type CategoryParams = {
	owner: Uint8Array;
	address: string;
	category: number;
	subcategory: number;
	network?: number;
};

type TagParams = {
	owner: Uint8Array;
	tag: string;
	address: string;
	network?: number;
};

export function coerceNetworkId(network?: string | null): number | undefined {
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
		owner: PUBLIC_OWNER,
		tag,
		address,
		network: networkId,
	};
}

export function coerceCatetoryWriteParams(
	params: Record<string, string>,
): Required<CategoryParams> | Response {
	const p = coerceCategoryParams(params);
	if (p instanceof Response) return p;
	if (p.network === undefined) return InvalidParameters;
	return p as Required<CategoryParams>;
}

export function coerceCategoryParams(
	params: Record<string, string>,
): CategoryParams | Response {
	const { cat, subcat, address, network } = params;

	const category = Number(cat);
	const subcategory = Number(subcat);

	const networkId = coerceNetworkId(network);

	if (
		!Number.isInteger(category) ||
		!Number.isInteger(subcategory) ||
		address === undefined
	) {
		return InvalidParameters;
	}

	return {
		owner: PUBLIC_OWNER,
		address,
		category,
		subcategory,
		network: networkId,
	};
}
