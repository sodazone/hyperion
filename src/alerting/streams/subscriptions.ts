import { EventEmitter } from "node:events";
import type { RuleDefinition, RuleDependency, RuleInstance } from "@/alerting";
import type { StreamsClient } from "./ocelloids";

type ActiveSubscription =
	| {
			key: string;
			owners: Set<number>;
			unsubscribe: () => void;
	  }
	| {
			key: string;
			owners: Set<number>;
			promise: Promise<void>;
	  };

function getDependencies(
	def: RuleDefinition,
	instance: RuleInstance,
): RuleDependency[] {
	return def.resolveDependencies ? def.resolveDependencies(instance) : [];
}

type SubscriptionFactory = (dep?: any) => Promise<() => void> | (() => void);

export class SubscriptionManager extends EventEmitter {
	#active = new Map<string, ActiveSubscription>();
	#started = false;

	constructor(private readonly ocelloids: StreamsClient) {
		super();
	}

	addInstance(def: RuleDefinition, instance: RuleInstance) {
		const deps = getDependencies(def, instance);

		for (const dep of deps) {
			if (!this.isSupportedKind(dep.kind)) continue;
			const handler = this.handlers[dep.kind];
			const key = handler.getKey(dep);

			this.acquire(key, instance.id, () => handler.factory(dep));
		}
	}

	addDependency(dep: RuleDependency) {
		if (!this.isSupportedKind(dep.kind)) return;
		const handler = this.handlers[dep.kind];
		const key = handler.getKey(dep);

		this.acquire(key, Infinity, () => handler.factory(dep));
	}

	removeInstance(def: RuleDefinition, instance: RuleInstance) {
		const deps = getDependencies(def, instance);

		for (const dep of deps) {
			if (!this.isSupportedKind(dep.kind)) continue;
			const handler = this.handlers[dep.kind];

			if (!handler.releasable) continue;

			const key = handler.getKey(dep);

			this.release(key, instance.id);
		}
	}

	private async acquire(
		key: string,
		instanceId: number,
		factory: SubscriptionFactory,
	) {
		const existing = this.#active.get(key);

		if (existing && "unsubscribe" in existing) {
			existing.owners.add(instanceId);
			return;
		}

		if (existing && "promise" in existing) {
			existing.owners.add(instanceId);
			await existing.promise;
			return;
		}

		const owners = new Set<number>([instanceId]);

		let resolveReady!: () => void;
		const promise = new Promise<void>((resolve) => {
			resolveReady = resolve;
		});

		this.#active.set(key, {
			key,
			owners,
			promise,
		});

		try {
			console.log("Subscribe:", key);

			const unsubscribe = await factory();

			this.#active.set(key, {
				key,
				owners,
				unsubscribe,
			});
		} finally {
			resolveReady();
		}
	}

	private async release(key: string, instanceId: number): Promise<void> {
		const existing = this.#active.get(key);
		if (!existing) return;

		existing.owners.delete(instanceId);

		if (existing.owners.size > 0) return;

		if ("promise" in existing) {
			await existing.promise;
			return this.release(key, instanceId);
		}

		existing.unsubscribe();
		this.#active.delete(key);
	}

	private readonly handlers: Record<
		RuleDependency["kind"],
		{
			releasable: boolean;
			getKey: (dep: any) => string;
			factory: SubscriptionFactory;
		}
	> = {
		issuance: {
			releasable: true,
			getKey: (dep) => dep.subscriptionId,
			factory: (dep) =>
				this.ocelloids.subscribeIssuance(dep, (msg) => this.emit("data", msg)),
		},
		transfer: {
			releasable: false,
			getKey: () => "transfers",
			factory: () =>
				this.ocelloids.subscribeTransfers((msg) => this.emit("data", msg)),
		},
		xc: {
			releasable: false,
			getKey: () => "xc",
			factory: () =>
				this.ocelloids.subscribeXc((msg) => this.emit("data", msg)),
		},
		opengov: {
			releasable: false,
			getKey: () => "opengov",
			factory: () =>
				this.ocelloids.subscribeOpenGov((msg) => this.emit("data", msg)),
		},
	} as const;

	private isSupportedKind(kind: string): kind is keyof typeof this.handlers {
		return kind in this.handlers;
	}

	async start() {
		if (this.#started) return;
		this.#started = true;
	}

	async stop() {
		if (!this.#started) return;
		this.#started = false;

		for (const sub of this.#active.values()) {
			if ("unsubscribe" in sub) {
				sub.unsubscribe();
			}
		}
		this.#active.clear();

		await this.ocelloids.close();
	}
}
