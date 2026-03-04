import {
	type AnyEvent,
	type RuleDefinition,
	RuleEngine,
	type RuleInstance,
} from "@/alerting";
import { SubscriptionManager } from "@/alerting/streams";
import type { HyperionDB, OwnedAlert } from "@/db";
import type { Metrics } from "@/server/metrics";
import { notifyTelegram } from "./channels";
import { notifyDiscord } from "./channels/discord/notify";
import { createStateStore } from "./rules/state";
import { RulesRegistry } from "./rules/templates/registry";
import {
	type CreateStreamsClient,
	createOcelloidsClient,
} from "./streams/ocelloids";

export interface Monitor {
	rules: {
		remove: (rule: RuleInstance) => void;
		update: (rule: RuleInstance) => void;
		add: (rule: RuleInstance) => void;
	};
	start: () => Promise<void>;
	stop: () => Promise<void>;
}

interface MonitorOptions {
	rules: RuleDefinition<any, any, any>[]; // any ok
	subManager: SubscriptionManager;
	db: HyperionDB;
	metrics: Metrics;
}

export function createMonitor({
	rules,
	subManager,
	db,
	metrics,
}: MonitorOptions): Monitor {
	const state = createStateStore(db.path);
	const engine = new RuleEngine(rules);

	function addInstance(inst: RuleInstance) {
		const rule = engine.findRuleDefinition(inst);
		if (rule === undefined) {
			console.warn(`Rule not found for instance: ${inst.id} ${inst.ruleKey}`);
		} else {
			console.log(`Adding rule instance: ${inst.id}`);
			subManager.addInstance(rule, inst);
			engine.addInstance(inst);

			metrics.rulesLoaded.inc();
		}
	}

	function removeInstance(inst: RuleInstance) {
		const rule = engine.findRuleDefinition(inst);
		if (rule === undefined) {
			console.warn(`Rule not found for instance: ${inst.id} ${inst.ruleKey}`);
		} else {
			console.log(`Removing rule instance: ${inst.id}`);
			subManager.removeInstance(rule, inst);
			engine.removeInstanceById(inst.id);

			metrics.rulesLoaded.dec();
		}
	}

	function updateInstance(inst: RuleInstance) {
		engine.updateInstance(inst);

		const rule = engine.findRuleDefinition(inst);
		if (rule === undefined) {
			console.warn(`Rule not found for instance: ${inst.id} ${inst.ruleKey}`);
			return;
		}

		console.log(`Updating rule instance: ${inst.id}`);

		if (inst.enabled) {
			subManager.addInstance(rule, inst);
		} else {
			subManager.removeInstance(rule, inst);
		}
	}

	// TODO: handle too many rules... :D
	const instances: RuleInstance[] = db.alerting.rules.findAllRuleInstances();

	console.log("Rule instances:", instances.length);

	for (const inst of instances) {
		addInstance(inst);
	}

	subManager.on("data", async (data: AnyEvent) => {
		metrics.eventsReceived.inc();
		const start = process.hrtime();

		db.ingest.analytics.onEvent(data);

		engine.evaluate(data, {
			state,
			db,
			now: Date.now,
		});

		const diff = process.hrtime(start);
		const seconds = diff[0] + diff[1] / 1e9;
		metrics.ruleEvalDuration.observe(seconds);
	});

	engine.on("alert", async (alert: OwnedAlert) => {
		metrics.alertsProcessed.inc();

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

	return {
		start: async () => {
			await state.load();
			subManager.start();
			engine.start();
		},
		rules: {
			update: updateInstance,
			add: addInstance,
			remove: removeInstance,
		},
		stop: async () => {
			subManager.stop();
			engine.stop();
			await state.stop();
		},
	};
}

export async function createMonitorFromDB(
	db: HyperionDB,
	metrics: Metrics,
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
			metrics,
		}),
	);
}
