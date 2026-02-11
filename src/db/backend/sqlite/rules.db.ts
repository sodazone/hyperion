import type { Database, SQLQueryBindings } from "bun:sqlite";
import type { RuleInstance } from "@/alerting";
import { safeStringify } from "@/utils/strings";
import { b, parseRaw } from "../util";

type OwnedId = {
	id: number;
	owner: Uint8Array | string;
};

function asRuleInstance(row: any): RuleInstance {
	return {
		id: row.id,
		title: row.title,
		owner: row.owner,
		ruleKey: row.rule_key,
		cooldownMs: row.cooldown_ms,
		priority: row.priority,
		enabled: !!row.enabled,
		config: parseRaw(row.config) ?? {},
	};
}

export function createRulesDB(db: Database) {
	function all<T>(sql: string, ...params: SQLQueryBindings[]): T[] {
		return db.query(sql).all(...params) as T[];
	}
	return {
		init() {
			db.run(`
        CREATE TABLE IF NOT EXISTS rule_instance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,

          owner BLOB NOT NULL,
          rule_key TEXT NOT NULL,

          enabled INTEGER NOT NULL DEFAULT 1,

          priority INTEGER,
          cooldown_ms INTEGER,

          config TEXT,

          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_rule_owner
          ON rule_instance(owner);

        CREATE INDEX IF NOT EXISTS idx_rule_owner_enabled
          ON rule_instance(owner, enabled);
      `);
		},

		insertRuleInstance(instance: {
			owner: Uint8Array | string;
			ruleKey: string;
			title: string;
			enabled?: boolean;
			priority?: number;
			cooldownMs?: number;
			config?: Record<string, any>;
		}) {
			const now = Date.now();

			const res = db.run(
				`
          INSERT INTO rule_instance
          (owner, rule_key, title, enabled, priority, cooldown_ms, config, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
				[
					instance.owner,
					instance.ruleKey,
					instance.title,
					instance.enabled ?? 1,
					instance.priority ?? null,
					instance.cooldownMs ?? null,
					instance.config ? safeStringify(instance.config) : null,
					now,
					now,
				],
			);

			return res.lastInsertRowid as number;
		},

		updateRuleInstance({ id, owner }: OwnedId, patch: Partial<RuleInstance>) {
			const fields: string[] = [];
			const params: SQLQueryBindings[] = [];

			if (patch.enabled !== undefined) {
				fields.push("enabled = ?");
				params.push(patch.enabled ? 1 : 0);
			}

			if (patch.priority !== undefined) {
				fields.push("priority = ?");
				params.push(patch.priority);
			}

			if (patch.cooldownMs !== undefined) {
				fields.push("cooldown_ms = ?");
				params.push(patch.cooldownMs);
			}

			if (patch.config !== undefined) {
				fields.push("config = ?");
				params.push(safeStringify(patch.config));
			}

			if (!fields.length) return;

			fields.push("updated_at = ?");
			params.push(Date.now());

			db.run(
				`UPDATE rule_instance SET ${fields.join(", ")} WHERE id = ? AND owner = ?`,
				[...params, id, b(owner)],
			);
		},

		getRuleInstance({ id, owner }: OwnedId): RuleInstance | null {
			const row = db
				.query<RuleInstance, [number, Uint8Array | string]>(
					`SELECT *
        FROM rule_instance WHERE id = ? AND owner = ? LIMIT 1`,
				)
				.get(id, b(owner));

			return row === null ? null : asRuleInstance(row);
		},

		isRuleOwned({ id, owner }: OwnedId): boolean {
			const row = db
				.query<[number], [number, Uint8Array | string]>(
					`SELECT 1 FROM rule_instance WHERE id = ? AND owner = ? LIMIT 1`,
				)
				.get(id, b(owner));

			return !!row;
		},

		findRuleInstances(opts: {
			owner: Uint8Array | string;
			cursor?: string;
			limit?: number;
			q?: string;
			enabled?: boolean;
		}): {
			rows: RuleInstance[];
			cursorNext?: string;
		} {
			const clauses: string[] = ["owner = ?"];
			const params: SQLQueryBindings[] = [b(opts.owner)];

			if (opts.enabled !== undefined) {
				clauses.push("enabled = ?");
				params.push(opts.enabled ? 1 : 0);
			}

			if (opts.q) {
				clauses.push("rule_key LIKE ?");
				params.push(`%${opts.q}%`);
			}

			// cursor pagination (priority, id)
			if (opts.cursor) {
				const { p, id } = JSON.parse(
					Buffer.from(opts.cursor, "base64").toString(),
				);

				clauses.push(`(priority > ? OR (priority = ? AND id > ?))`);

				params.push(p ?? null, p ?? null, id);
			}

			const limit = opts.limit ?? 50;

			const sql = `
      SELECT *
      FROM rule_instance
      ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
      ORDER BY priority ASC, id ASC
      LIMIT ?
    `;

			const rowsRaw = all<RuleInstance>(sql, ...params, limit + 1);

			const hasNext = rowsRaw.length > limit;
			if (hasNext) rowsRaw.pop();

			const rows: RuleInstance[] = rowsRaw.map(asRuleInstance);

			const last = rows.at(-1);

			const cursorNext =
				hasNext && last
					? Buffer.from(
							JSON.stringify({ p: last.priority ?? null, id: last.id }),
						).toString("base64")
					: undefined;

			return { rows, cursorNext };
		},

		findAllRuleInstances(): RuleInstance[] {
			return db
				.query<RuleInstance, []>(
					`
          SELECT *
          FROM rule_instance
          ORDER BY owner, priority ASC, id ASC
          `,
				)
				.all()
				.map(asRuleInstance);
		},

		deleteRuleInstance({ id, owner }: OwnedId) {
			db.run(`DELETE FROM rule_instance WHERE id = ? AND owner = ?`, [
				id,
				b(owner),
			]);
		},
	};
}

export type RulesDB = ReturnType<typeof createRulesDB>;
