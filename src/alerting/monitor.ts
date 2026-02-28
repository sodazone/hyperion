import {
	type AnyEvent,
	type RuleDefinition,
	RuleEngine,
	type RuleInstance,
} from "@/alerting";
import { SubscriptionManager } from "@/alerting/streams";
import type { HyperionDB, OwnedAlert } from "@/db";
import { notifyTelegram } from "./channels";
import { notifyDiscord } from "./channels/discord/notify";
import { InMemoryStateStore } from "./rules/state";
import { RulesRegistry } from "./rules/templates/registry";
import {
	type CreateStreamsClient,
	createOcelloidsClient,
} from "./streams/ocelloids";

export interface Monitor {
	rules: {
		setEnabled: (ruleId: number, enabled: boolean) => void;
		remove: (ruleId: number) => void;
		update: (rule: RuleInstance) => void;
		add: (rule: RuleInstance) => void;
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

	console.log("Rule instances:", instances.length);

	for (const inst of instances) {
		engine.addInstance(inst);
	}

	subManager.on("data", async (data: AnyEvent) => {
		db.ingest.analytics.onEvent(data);

		engine.evaluate(data, {
			state,
			db,
			now: Date.now,
		});
	});

	engine.on("alert", async (alert: OwnedAlert) => {
		if (alert.id === undefined) {
			console.warn("alert without id", alert.name, alert.owner.toHex());
			return;
		}

		const rule = db.alerting.rules.getRuleInstance({
			id: alert.id,
			owner: alert.owner,
		});

		if (rule === null) {
			console.warn(
				"rule not found for alert",
				alert.id,
				alert.name,
				alert.owner.toHex(),
			);
			return;
		}

		// Web is always enabled
		db.alerting.alerts.insertAlert(alert);

		for (const channel of rule.channels) {
			if (channel.enabled === false) continue;

			switch (channel.type) {
				case "telegram":
					notifyTelegram(
						{ token: channel.config.token, chatId: channel.config.chatId },
						alert,
					);
					break;
				case "discord":
					notifyDiscord({ webhookUrl: channel.config.webhookUrl }, alert, {
						username: channel.config.username ?? "Hyperion",
						avatarUrl: channel.config.avatarUrl,
					});
					break;
			}
		}
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
			setEnabled: (ruleId: number, enabled: boolean) => {
				engine.setEnabled(ruleId, enabled);
				// TODO: close unused subscriptions
			},
			update: (rule: RuleInstance) => {
				engine.update(rule);
			},
			add: (rule: RuleInstance) => {
				engine.addInstance(rule);
			},
			remove: (ruleId: number) => {
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

export async function createMonitorFromDB(
	db: HyperionDB,
	createStreamsClient?: CreateStreamsClient,
): Promise<Monitor> {
	const factory = createStreamsClient ?? createOcelloidsClient;
	const client = await factory({ storagePath: db.path });
	const rules = RulesRegistry;

	return createMonitor(
		Object.freeze({
			rules,
			subManager: new SubscriptionManager(client),
			db,
		}),
	);
}
