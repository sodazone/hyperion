export type AccountIdentity = {
	chainId: string;
	display: string;
	judgements: string[];
	extra: Record<string, any>;
};

export type AccountCategory = {
	chainId: string;
	categoryCode: number;
	subCategoryCode?: number;
};

export type AccountTag = {
	chainId: string;
	tag: string;
};

export type SubstrateAccountMetadata = {
	publicKey: string;
	accountId: string;
	evm: {
		address: string;
		chainId: string;
	}[];
	identities: AccountIdentity[];
	categories: AccountCategory[];
	tags: AccountTag[];
	updatedAt: number;
};
