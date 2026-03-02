import { TransfersRule } from "./transfers/rule";
import { WatchedRule } from "./watched/rule";
import { CrosschainInvariantRule } from "./xc-invariant/rule";

export const RulesRegistry = [
	TransfersRule,
	WatchedRule,
	CrosschainInvariantRule,
];
