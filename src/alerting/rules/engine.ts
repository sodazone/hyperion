import { EventEmitter } from "node:events";
import type { AnyEvent, Rule, RuleContext } from "./types";

export class RuleEngine extends EventEmitter {
	#rules: Rule<AnyEvent>[];
	#lastAlertTimes: Record<string, number>;

	constructor(rules: Rule<AnyEvent>[]) {
		super();
		this.#rules = rules;
		this.#lastAlertTimes = {};
	}

	addRule(rule: Rule<AnyEvent>): void {
		this.#rules.push(rule);
		this.#rules.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
	}

	addBundle(bundle: {
		name: string;
		rules: Omit<Rule<AnyEvent>, "bundle">[];
	}): void {
		bundle.rules.forEach((rule) => {
			this.addRule({ ...rule, bundle: bundle.name });
		});
	}

	async evaluate(event: AnyEvent, ctx: RuleContext): Promise<void> {
		const now = ctx.now();

		await Promise.all(
			this.#rules.map(async (rule) => {
				try {
					if (rule.cooldownMs) {
						const last = this.#lastAlertTimes[rule.id];
						if (last && now - last < rule.cooldownMs) return;
					}

					const result = await rule.matcher(event, ctx);
					if (!result.matched) return;

					if (rule.cooldownMs) {
						this.#lastAlertTimes[rule.id] = now;
					}

					const alert = rule.alertTemplate
						? await rule.alertTemplate(event, ctx, result.data)
						: {
								rule_id: rule.id,
								timestamp: now,
								message: `Rule ${rule.id} triggered`,
								level: 0,
							};

					this.emit("alert", alert);
				} catch (error) {
					console.error(`Error evaluating rule ${rule.id}:`, error);
				}
			}),
		);
	}

	start(): void {
		//
	}

	stop(): void {
		//
	}
}
