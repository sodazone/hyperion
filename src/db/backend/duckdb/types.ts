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

export interface DexLiquidityRow {
	ts: string;
	subscription_id: string;
	network_id: string;
	protocol: string;
	market_id: string;
	label: string;

	supplied_usd: number;
	tvl_change_usd: number;
	total_aggregate_tvl_usd: number;
}

export type DefiVolumeRow = {
	ts: string;
	protocol: string;
	market_id: string;

	swap_volume_usd: number;
	borrow_volume_usd: number;
	repay_volume_usd: number;
	withdraw_volume_usd: number;
	liquidation_volume_usd: number;
};

export interface MoneyMarketHealthRow {
	ts: string;
	subscription_id: string;
	network_id: string;
	protocol: string;
	market_id: string;
	label: string;

	supplied_usd: number;
	borrowed_usd: number;
	utilization: number | null;
	solvency_ratio: number | null;
	is_paused: boolean;
}
