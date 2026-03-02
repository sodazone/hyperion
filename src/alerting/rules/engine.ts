import { EventEmitter } from "node:events";
import type {
	AnyEvent,
	GlobalRuleContext,
	RuleDefinition,
	RuleInstance,
} from "./types";

type CompiledInstance = {
	id: number;
	ruleKey: string;
	owner: Uint8Array;
	def: RuleDefinition<any, any, any>;
	config: any;
	enabled: boolean;
	priority?: number;
	cooldownMs?: number;
	bundle?: string;
};

export class RuleEngine extends EventEmitter {
	#instances: CompiledInstance[] = [];
	#byId = new Map<number, CompiledInstance>();
	#registry = new Map<string, RuleDefinition<any, any, any>>();
	#lastAlertTimes: Record<string, number> = {};

	constructor(definitions: RuleDefinition<AnyEvent>[]) {
		super();

		for (const def of definitions) {
			this.#registry.set(def.id, def);
		}
	}

	addInstance(instance: RuleInstance): void {
		const def = this.#registry.get(instance.ruleKey);
		if (!def) {
			console.warn(`Unknown rule: ${instance.ruleKey}`);
			return;
		}

		const config = def.schema.parse({
			...def.defaults,
			...instance.config,
		});

		const compiled: CompiledInstance = {
			id: instance.id,
			owner: instance.owner,
			ruleKey: instance.ruleKey,
			def,
			config,
			enabled: instance.enabled ?? true,
			priority: instance.priority,
			cooldownMs: instance.cooldownMs,
		};

		this.#instances.push(compiled);
		this.#byId.set(compiled.id, compiled);

		this.#instances.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
	}

	async evaluate(event: AnyEvent, global: GlobalRuleContext): Promise<void> {
		const now = global.now();

		for (const inst of this.#instances) {
			if (!inst.enabled) {
				continue;
			}

			try {
				if (inst.cooldownMs) {
					const last = this.#lastAlertTimes[inst.id];
					if (last && now - last < inst.cooldownMs) continue;
				}

				const result = await inst.def.matcher(event, {
					global,
					config: inst.config,
					owner: inst.owner,
				});
				if (!result.matched) continue;

				if (inst.cooldownMs) {
					this.#lastAlertTimes[inst.id] = now;
				}

				const alert = inst.def.alertTemplate
					? await inst.def.alertTemplate(
							event,
							{ global, config: inst.config, owner: inst.owner },
							result.data,
						)
					: {
							rule_id: inst.def.id,
							timestamp: now,
							message: `Rule ${inst.def.id} triggered`,
							level: 0,
						};

				this.emit(
					"alert",
					Object.freeze({
						...alert,
						id: inst.id,
						owner: inst.owner,
					}),
				);
			} catch (error) {
				console.error(`Error evaluating rule ${inst.def.id}:`, error);
			}
		}
	}

	findRuleDefinition(rule: RuleInstance) {
		return this.#registry.get(rule.ruleKey);
	}

	updateInstance(rule: RuleInstance) {
		this.removeInstanceById(rule.id);
		this.addInstance(rule);
	}

	removeInstanceById(id: number): boolean {
		const inst = this.#byId.get(id);
		if (!inst) return false;

		this.#byId.delete(id);

		const idx = this.#instances.indexOf(inst);
		if (idx !== -1) {
			this.#instances.splice(idx, 1);
		}

		delete this.#lastAlertTimes[id];

		return true;
	}

	start(): void {}
	stop(): void {}
}
