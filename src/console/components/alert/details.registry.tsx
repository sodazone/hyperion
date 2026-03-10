import { InvariantAlertDetails } from "./invariant.details";
import { OpenGovAlertDetails } from "./opengov.details";

export const AlertDetailsRegistry: Record<
	string,
	React.FC<{ payload: any }>
> = {
	"xc-invariant": InvariantAlertDetails,
	opengov: OpenGovAlertDetails,
};
