import { type AnyEvent, type Rule, RuleEngine } from "@/alerting";
import { SubscriptionManager } from "@/alerting/streams";
import type { Alert, HyperionDB } from "@/db";
import { safeStringify } from "@/utils/strings";
import { STATIC_RULES } from "./rules/bundles/static";
import { InMemoryStateStore } from "./rules/state";
import { createDummyOcelloidsClient } from "./streams/ocelloids";

export interface Monitor {
	start: () => void;
	stop: () => void;
}

interface MonitorOptions {
	rules: Rule<any, any>[]; // any ok
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
		db.alerts.insertAlert(alert);
		console.log("Alert triggered:", safeStringify(alert, 2));
	});

	for (const rule of rules) {
		console.log(`Adding rule: ${rule.id}`);
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

export async function createMonitorFromDB(db: HyperionDB): Promise<Monitor> {
	const client = await createDummyOcelloidsClient();
	const rules = STATIC_RULES;

	return createMonitor(
		Object.freeze({
			rules,
			subManager: new SubscriptionManager(client),
			db,
		}),
	);
}
