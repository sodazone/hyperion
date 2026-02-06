export type LocalEntityData = {
	address: string | Uint8Array;
	isExchange: boolean;
	exchangeName?: string;
	walletType?: string;
	categories?: number[];
};

export type LocalData = {
	addresses: Set<string>;
	entities: Record<string, LocalEntityData>;
};
