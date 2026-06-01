import { InvariantAlertDetails } from "./invariant.details";
import { DexDetails, MoneyMarketDetails } from "./liquidity.details";
import { OpenGovAlertDetails } from "./opengov.details";

export const AlertDetailsRegistry: Record<
	string,
	React.FC<{ payload: any }>
> = {
	"money-market-health": MoneyMarketDetails,
	"dex-health": DexDetails,
	"xc-invariant": InvariantAlertDetails,
	opengov: OpenGovAlertDetails,
};
