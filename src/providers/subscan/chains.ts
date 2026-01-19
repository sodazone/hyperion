export interface SubscanChain {
	name: string;
	urn: string;
	subscanUrl: string;
}

export const CHAINS: SubscanChain[] = [
	{
		name: "polkadot-assethub",
		urn: "urn:ocn:polkadot:1000",
		subscanUrl:
			"https://assethub-polkadot.api.subscan.io/api/scan/accounts/merkle",
	},

	// {
	//   name: "kusama-assethub",
	//   urn: "urn:ocn:kusama:1000",
	//   subscanUrl:
	//     "https://assethub-kusama.api.subscan.io/api/scan/accounts/merkle",
	// },
];
