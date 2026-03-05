export interface CrosschainSolvencyRow {
	ts: string;
	subscription_id: string;
	protocol: string;

	reserve_chain: string;
	reserve_address: string;

	remote_chain: string;

	asset_id: string;
	asset_symbol: string;

	reserve_balance: number;
	remote_balance: number;

	difference: number;
	collateral_ratio: number | null;
}
