import { NetworkMap } from "@/mapping";

type CategoryParams = {
	address: string;
	categoryCode: number;
	subcategoryCode: number;
	networkId: number;
};

export function coerceCategoryParams(
	params: Record<string, string>,
): CategoryParams | Response {
	const { cat, subcat, address, network } = params;

	const categoryCode = Number(cat);
	const subcategoryCode = Number(subcat);

	const networkId = Number.isInteger(Number(network))
		? Number(network)
		: network
			? NetworkMap.fromURN(network)
			: undefined;

	if (
		!Number.isInteger(categoryCode) ||
		!Number.isInteger(subcategoryCode) ||
		networkId === undefined ||
		address === undefined
	) {
		return new Response("Invalid parameters\n", { status: 400 });
	}

	return {
		address,
		categoryCode,
		subcategoryCode,
		networkId,
	};
}
