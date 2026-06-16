import { Database } from "bun:sqlite";
import path from "node:path";

import type { StateStore, StateValue } from "../types";

export class SqliteStateStore implements StateStore {
	#db: Database;

	constructor(dir: string, filename = "engine-state.sqlite") {
		const dbPath = path.join(dir, filename);
		console.log(`[engine:state] sqlite at ${dbPath}`);

		this.#db = new Database(dbPath);
		this.#db.run(`
      CREATE TABLE IF NOT EXISTS state (
        scope TEXT,
        key TEXT,
        value TEXT,
        PRIMARY KEY (scope, key)
      )
    `);
	}

	get(scope: string, key: string): StateValue | undefined {
		const stmt = this.#db.prepare(
			"SELECT value FROM state WHERE scope = ? AND key = ?",
		);
		const row = stmt.get(scope, key) as { value: string } | undefined;
		return row ? JSON.parse(row.value) : undefined;
	}

	set(scope: string, key: string, value: StateValue): void {
		const stmt = this.#db.prepare(`
      INSERT INTO state (scope, key, value)
      VALUES (?, ?, ?)
      ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value
    `);
		stmt.run(scope, key, JSON.stringify(value));
	}

	delete(scope: string, key: string): void {
		this.#db
			.prepare("DELETE FROM state WHERE scope = ? AND key = ?")
			.run(scope, key);
	}

	async load(): Promise<void> {
		//
	}
	async stop(): Promise<void> {
		this.#db.close();
	}
}
