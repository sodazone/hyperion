import { type Rule, RuleEngine } from "@/alerting";
import type { SubscriptionManager } from "@/alerting/streams";

// TODO: load rules...
// TODO: wire up the subscription events to the rule engine
// TODO: wire up the rule engine to the alerting system... (local db and egress)
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
