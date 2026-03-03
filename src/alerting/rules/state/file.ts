import fs from "node:fs/promises";
import path from "node:path";
import type { StateStore, StateValue } from "../types";

export class FileStateStore implements StateStore {
	#data = new Map<string, Map<string, StateValue>>();
	#file: string;
	#dirty = false;
	#saveInterval: NodeJS.Timeout;

	constructor(dir: string, filename = "global-state.json", flushMs = 5000) {
		this.#file = path.join(dir, filename);

		this.#saveInterval = setInterval(async () => {
			if (this.#dirty) {
				await this.save();
				this.#dirty = false;
			}
		}, flushMs);
	}

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
		this.#dirty = true;
	}

	delete(scope: string, key: string): void {
		this.#data.get(scope)?.delete(key);
		this.#dirty = true;
	}

	async load(): Promise<void> {
		try {
			const content = await fs.readFile(this.#file, "utf-8");
			const obj = JSON.parse(content) as Record<
				string,
				Record<string, StateValue>
			>;
			for (const [scope, map] of Object.entries(obj)) {
				this.#data.set(scope, new Map(Object.entries(map)));
			}
		} catch (err) {
			if ((err as NodeJS.ErrnoException).code !== "ENOENT") console.error(err);
		}
	}

	async save(): Promise<void> {
		try {
			await fs.mkdir(path.dirname(this.#file), { recursive: true });

			const obj: Record<string, Record<string, StateValue>> = {};
			for (const [scope, map] of this.#data.entries()) {
				obj[scope] = Object.fromEntries(map.entries());
			}

			await fs.writeFile(this.#file, JSON.stringify(obj), "utf-8");
		} catch (err) {
			console.error("Failed to save state:", err);
		}
	}

	async stop(): Promise<void> {
		clearInterval(this.#saveInterval);
		if (this.#dirty) await this.save();
	}
}
