import { ExchangeLiquidityRule } from "./defi/liquidity/dex.rule";
import { MoneyMarketHealthRule } from "./defi/liquidity/mm.rule";
import { OpenGovRule } from "./opengov/rule";
import { TransfersRule } from "./transfers/rule";
import { WatchedRule } from "./watched/rule";
import { CrosschainInvariantRule } from "./xc-invariant/rule";

export const RulesRegistry = [
	TransfersRule,
	CrosschainInvariantRule,
	WatchedRule,
	OpenGovRule,
	MoneyMarketHealthRule,
	ExchangeLiquidityRule,
];
