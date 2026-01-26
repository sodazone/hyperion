import { type Rule, RuleEngine } from "@/rules";
import type { SubscriptionManager } from "@/streams";

// TODO: load rules...
export function createMonitor(rules: Rule[], subManager: SubscriptionManager) {
	for (const rule of rules) {
		subManager.addRule(rule);
	}

	const engine = new RuleEngine(rules);

	return {
		start: () => {
			subManager.start();
			engine.start();
		},
		stop: () => {
			subManager.stop();
			engine.stop();
		},
	};
}
