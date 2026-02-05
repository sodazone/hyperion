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
		// TODO: local context in the scope of the rule, i.e. from event to alert..
		const now = ctx.now();

		await Promise.all(
			this.#rules.map(async (rule) => {
				if (rule.cooldownMs) {
					const last = this.#lastAlertTimes[rule.id];
					if (last && now - last < rule.cooldownMs) return;
				}

				let match: boolean;
				try {
					match = await rule.matcher(event, ctx);
				} catch (error) {
					console.error(`Error evaluating rule ${rule.id}:`, error);
					return;
				}
				if (match) {
					if (rule.cooldownMs) {
						this.#lastAlertTimes[rule.id] = now;
					}
					const alert = rule.alertTemplate
						? await rule.alertTemplate(event, ctx)
						: {
								ruleId: rule.id,
								message: `Rule ${rule.id} triggered`,
								level: 0,
							};
					this.emit("alert", alert);
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
