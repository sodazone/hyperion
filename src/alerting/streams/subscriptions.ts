import type { Rule } from "@/alerting";

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

// TODO: Real interface
type OcelloidsClient = {
	subscribeStorage: (params: { chain: string; key: string }) => () => void;
};

// TODO: keep last processed for replay
export class SubscriptionManager {
	#active = new Map<string, ActiveSubscription>();

	constructor(private readonly ocelloids: OcelloidsClient) {}

	addRule(rule: Rule) {
		if (!rule.dependencies) return;

		for (const dep of rule.dependencies) {
			if (dep.kind === "storage") {
				this.addStorageSubscription(dep);
			}
			// TODO: other types of dependencies
		}
	}

	removeRule(rule: Rule) {
		if (!rule.dependencies) return;

		for (const dep of rule.dependencies) {
			if (dep.kind === "storage") {
				this.removeStorageSubscription(dep);
			}
		}
	}

	private addStorageSubscription(dep: { chain: string; key: string }) {
		const subKey = serializeStorageSubKey(dep);

		const existing = this.#active.get(subKey);
		if (existing) {
			existing.refCount += 1;
			return;
		}

		const unsubscribe = this.ocelloids.subscribeStorage({
			chain: dep.chain,
			key: dep.key,
		});

		this.#active.set(subKey, {
			key: subKey,
			refCount: 1,
			unsubscribe,
		});
	}

	private removeStorageSubscription(dep: { chain: string; key: string }) {
		const subKey = serializeStorageSubKey(dep);

		const existing = this.#active.get(subKey);
		if (!existing) return;

		existing.refCount -= 1;

		if (existing.refCount === 0) {
			existing.unsubscribe();
			this.#active.delete(subKey);
		}
	}

	start(): void | Promise<void> {}
	stop(): void | Promise<void> {}
}
