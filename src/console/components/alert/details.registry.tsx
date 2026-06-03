import { InvariantAlertDetails } from "./invariant.details";
import { DexDetails, MoneyMarketDetails } from "./liquidity.details";
import { OpenGovAlertDetails } from "./opengov.details";

export const AlertDetailsRegistry: Record<
	string,
	React.FC<{ payload: any }>
> = {
	"money-market-health": MoneyMarketDetails,
	"exchange-liquidity": DexDetails,
	"xc-invariant": InvariantAlertDetails,
	opengov: OpenGovAlertDetails,
};
