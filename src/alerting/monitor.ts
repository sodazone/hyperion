import { type Alert, type AnyEvent, type Rule, RuleEngine } from "@/alerting";
import { SubscriptionManager } from "@/alerting/streams";
import type { HyperionDB } from "@/db";
import { STATIC_RULES } from "./rules/bundles/static";
import { InMemoryStateStore } from "./rules/state";
import { createDummyOcelloidsClient } from "./streams/ocelloids";

export interface Monitor {
	start: () => void;
	stop: () => void;
}

interface MonitorOptions {
	rules: Rule[];
	subManager: SubscriptionManager;
	db: HyperionDB;
}

export function createMonitor({
	rules,
	subManager,
	db,
}: MonitorOptions): Monitor {
	const state = new InMemoryStateStore();
	const engine = new RuleEngine(rules);

	subManager.on("data", async (data: AnyEvent) => {
		engine.evaluate(data, {
			state,
			db,
			now: Date.now,
		});
	});

	engine.on("alert", async (alert: Alert) => {
		// await db.saveAlert(alert);
		// TODO: send alert to egress system
		console.log("Alert triggered:", alert);
	});

	for (const rule of rules) {
		subManager.addRule(rule);
	}

	return {
		start: () => {
			console.log("Monitor started");
			subManager.start();
			engine.start();
		},
		stop: () => {
			subManager.stop();
			engine.stop();
		},
	};
}

export function createMonitorFromDB(db: HyperionDB): Monitor {
	const client = createDummyOcelloidsClient();
	//const rules = db.loadRules?.() ?? [];
	const rules = STATIC_RULES;

	return createMonitor(
		Object.freeze({
			rules,
			subManager: new SubscriptionManager(client),
			db,
		}),
	);
}
