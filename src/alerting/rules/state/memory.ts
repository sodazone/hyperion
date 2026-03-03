import type { StateStore, StateValue } from "../types";

export class InMemoryStateStore implements StateStore {
	#data = new Map<string, Map<string, StateValue>>();

	get(scope: string, key: string): StateValue | undefined {
		return this.#data.get(scope)?.get(key);
	}

	set(scope: string, key: string, value: StateValue): void {
		let scopeMap = this.#data.get(scope);
		if (!scopeMap) {
			scopeMap = new Map();
			this.#data.set(scope, scopeMap);
		}
		scopeMap.set(key, value);
	}

	delete(scope: string, key: string): void {
		this.#data.get(scope)?.delete(key);
	}

	async load() {
		//
	}
	async stop() {
		//
	}
}
