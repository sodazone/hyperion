import { EventEmitter } from "node:events";
import type { Rule } from "@/alerting";
import type { OcelloidsClient } from "./ocelloids";

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

export class SubscriptionManager extends EventEmitter {
	#active = new Map<string, ActiveSubscription>();
	#started = false;

	constructor(private readonly ocelloids: OcelloidsClient) {
		super();
	}

	addRule(rule: Rule) {
		if (!rule.dependencies) return;

		for (const dep of rule.dependencies) {
			if (dep.kind === "storage") {
				this.addStorageSubscription(dep);
			} else if (dep.kind === "transfer") {
				this.addTransferSubscription();
			}
			// future: tx, logs, events, etc
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

	// TODO: generalize subscriptions :)
	private addTransferSubscription() {
		const subKey = "transfers";
		const existing = this.#active.get(subKey);
		if (existing) {
			existing.refCount += 1;
			return;
		}

		const unsubscribe = this.ocelloids.subscribeTransfers((msg) => {
			this.emit("data", msg);
		});

		this.#active.set(subKey, {
			key: subKey,
			refCount: 1,
			unsubscribe,
		});
	}

	private addStorageSubscription(dep: { chain: string; key: string }) {
		const subKey = serializeStorageSubKey(dep);

		const existing = this.#active.get(subKey);
		if (existing) {
			existing.refCount += 1;
			return;
		}

		const unsubscribe = this.ocelloids.subscribeStorage(
			{
				chain: dep.chain,
				key: dep.key,
			},
			(msg) => {
				this.emit("data", msg);
			},
		);

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

	async start() {
		if (this.#started) return;
		this.#started = true;

		/*
    await this.ocelloids.connect();

    this.ocelloids.on("connected", () => this.emit("connected", undefined));
    this.ocelloids.on("disconnected", () =>
      this.emit("disconnected", undefined),
    );
    this.ocelloids.on("error", (e) => this.emit("error", e));
    */
	}

	async stop() {
		if (!this.#started) return;
		this.#started = false;

		for (const sub of this.#active.values()) {
			sub.unsubscribe();
		}
		this.#active.clear();

		//await this.ocelloids.disconnect();
	}
}
