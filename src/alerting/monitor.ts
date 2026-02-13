import {
	type AnyEvent,
	type RuleDefinition,
	RuleEngine,
	type RuleInstance,
} from "@/alerting";
import { SubscriptionManager } from "@/alerting/streams";
import type { HyperionDB, OwnedAlert } from "@/db";
import { InMemoryStateStore } from "./rules/state";
import { RulesRegistry } from "./rules/templates/registry";
import { createOcelloidsClient } from "./streams/ocelloids";

export interface Monitor {
	rules: {
		setEnabled: (ruleId: string, enabled: boolean) => void;
		remove: (ruleId: string) => void;
	};
	start: () => void;
	stop: () => void;
}

interface MonitorOptions {
	rules: RuleDefinition<any, any, any>[]; // any ok
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

	// TODO: handle too many rules... :D
	const instances: RuleInstance[] = db.alerting.rules.findAllRuleInstances();

	for (const inst of instances) {
		engine.addInstance(inst);
	}

	subManager.on("data", async (data: AnyEvent) => {
		engine.evaluate(data, {
			state,
			db,
			now: Date.now,
		});
	});

	engine.on("alert", async (alert: OwnedAlert) => {
		db.alerting.alerts.insertAlert(alert);
		// console.log("Alert triggered:", safeStringify(alert, 2));
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
		rules: {
			setEnabled: (ruleId: string, enabled: boolean) => {
				engine.setEnabled(ruleId, enabled);
				// TODO: close unused subscriptions
			},
			remove: (ruleId: string) => {
				engine.remove(ruleId);
				// TODO
			},
		},
		stop: () => {
			subManager.stop();
			engine.stop();
		},
	};
}

export async function createMonitorFromDB(db: HyperionDB): Promise<Monitor> {
	const client = await createOcelloidsClient({ storagePath: db.path });
	const rules = RulesRegistry;

	return createMonitor(
		Object.freeze({
			rules,
			subManager: new SubscriptionManager(client),
			db,
		}),
	);
}
