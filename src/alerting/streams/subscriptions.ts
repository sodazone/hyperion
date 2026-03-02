import { EventEmitter } from "node:events";
import type { RuleDefinition } from "@/alerting";
import type { StreamsClient } from "./ocelloids";

type ActiveSubscription = {
	key: string;
	refCount: number;
	unsubscribe: () => void;
};

type StorageSubscriptionKey = {
	chain: string;
	key: string;
};

function serializeStorageSubKey(k: StorageSubscriptionKey): string {
	return `${k.chain}:${k.key.toLowerCase()}`;
}

type SubscriptionFactory = (dep?: any) => Promise<() => void> | (() => void);
type Dependency =
	| { kind: "storage"; chain: string; key: string }
	| { kind: "transfer" }
	| { kind: "xc" };

export class SubscriptionManager extends EventEmitter {
	#active = new Map<string, ActiveSubscription>();
	#started = false;

	constructor(private readonly ocelloids: StreamsClient) {
		super();
	}

	addRule(rule: RuleDefinition) {
		if (!rule.dependencies) return;

		for (const dep of rule.dependencies) {
			if (!this.isSupportedKind(dep.kind)) continue;
			const handler = this.handlers[dep.kind];
			const key = handler.getKey(dep);

			this.acquire(key, () => handler.factory(dep));
		}
	}

	removeRule(rule: RuleDefinition) {
		if (!rule.dependencies) return;

		for (const dep of rule.dependencies) {
			if (!this.isSupportedKind(dep.kind)) continue;
			const handler = this.handlers[dep.kind];

			if (!handler.releasable) continue;

			const key = handler.getKey(dep);

			this.release(key);
		}
	}

	private async acquire(key: string, factory: SubscriptionFactory) {
		const existing = this.#active.get(key);

		if (existing) {
			existing.refCount += 1;
			return;
		}

		console.log("Subscribe:", key);

		const unsubscribe = await factory();

		this.#active.set(key, {
			key,
			refCount: 1,
			unsubscribe,
		});
	}

	private release(key: string) {
		const existing = this.#active.get(key);
		if (!existing) return;

		existing.refCount -= 1;

		if (existing.refCount === 0) {
			existing.unsubscribe();
			this.#active.delete(key);
		}
	}

	private readonly handlers: Record<
		Dependency["kind"],
		{
			releasable: boolean;
			getKey: (dep: any) => string;
			factory: SubscriptionFactory;
		}
	> = {
		storage: {
			releasable: true,
			getKey: (dep) => serializeStorageSubKey(dep),
			factory: (dep) =>
				this.ocelloids.subscribeStorage(dep, (msg) => this.emit("data", msg)),
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
			sub.unsubscribe();
		}
		this.#active.clear();

		await this.ocelloids.close();
	}
}
