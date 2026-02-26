import type { Database, SQLQueryBindings } from "bun:sqlite";
import type { RuleChannel, RuleInstance } from "@/alerting";
import { safeStringify } from "@/utils/strings";
import { b, parseJSON } from "../util";

type OwnedId = {
	id: number;
	owner: Uint8Array | string;
};

export type NewRuleInstance = {
	owner: Uint8Array | string;
	ruleKey: string;
	title: string;
	enabled?: boolean;
	priority?: number;
	cooldownMs?: number;
	config?: Record<string, any>;
	channelIds?: number[] | null;
};

function asChannel(row: any): RuleChannel {
	return {
		id: row.id,
		owner: row.owner,
		name: row.name,
		type: row.type,
		enabled: !!row.enabled,
		config: parseJSON(row.config) ?? {},
	};
}

function asRuleBase(row: any): Omit<RuleInstance, "channels"> {
	return {
		id: row.id,
		owner: row.owner,
		title: row.title,
		ruleKey: row.rule_key,
		enabled: !!row.enabled,
		priority: row.priority ?? undefined,
		cooldownMs: row.cooldown_ms ?? undefined,
		config: parseJSON(row.config) ?? {},
	};
}

function hydrateRules(
	db: Database,
	rules: Omit<RuleInstance, "channels">[],
): RuleInstance[] {
	if (!rules.length) return [];

	const ruleIds = rules.map((r) => r.id);

	const rows = db
		.query(
			`
      SELECT
        rc.rule_id,
        c.*
      FROM rule_channel rc
      JOIN channel c ON c.id = rc.channel_id
      WHERE rc.rule_id IN (${ruleIds.map(() => "?").join(",")})
    `,
		)
		.all(...ruleIds) as any[];

	const byRule = new Map<number, RuleChannel[]>();

	for (const row of rows) {
		const list = byRule.get(row.rule_id) ?? [];
		list.push(asChannel(row));
		byRule.set(row.rule_id, list);
	}

	return rules.map((r) => ({
		...r,
		channels: byRule.get(r.id) ?? [],
	}));
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

        CREATE TABLE IF NOT EXISTS channel (
          id INTEGER PRIMARY KEY AUTOINCREMENT,

          owner BLOB NOT NULL,
          name TEXT NOT NULL,

          type TEXT NOT NULL,
          enabled INTEGER NOT NULL DEFAULT 1,

          config TEXT NOT NULL,

          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS rule_channel (
          rule_id INTEGER NOT NULL,
          channel_id INTEGER NOT NULL,

          PRIMARY KEY (rule_id, channel_id),

          FOREIGN KEY (rule_id) REFERENCES rule_instance(id) ON DELETE CASCADE,
          FOREIGN KEY (channel_id) REFERENCES channel(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_rule_channel_rule
          ON rule_channel(rule_id);

        CREATE INDEX IF NOT EXISTS idx_rule_channel_channel
          ON rule_channel(channel_id);

        CREATE INDEX IF NOT EXISTS idx_channel_owner
          ON channel(owner);

        CREATE UNIQUE INDEX IF NOT EXISTS idx_channel_owner_name
          ON channel(owner, name);

        CREATE INDEX IF NOT EXISTS idx_rule_owner
          ON rule_instance(owner);

        CREATE INDEX IF NOT EXISTS idx_rule_owner_enabled
          ON rule_instance(owner, enabled);
      `);
		},

		insertRuleInstance(instance: NewRuleInstance) {
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

			const ruleId = res.lastInsertRowid as number;

			if (instance.channelIds && instance.channelIds.length > 0) {
				this.attachChannelsToRule(
					{ id: ruleId, owner: instance.owner },
					instance.channelIds,
				);
			}

			return ruleId;
		},

		updateRuleInstance({ id, owner }: OwnedId, patch: Partial<RuleInstance>) {
			const fields: string[] = [];
			const params: SQLQueryBindings[] = [];

			if (patch.title !== undefined) {
				fields.push("title = ?");
				params.push(patch.title);
			}

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

		attachChannelsToRule({ id: ruleId, owner }: OwnedId, channelIds: number[]) {
			if (!this.isRuleOwned({ id: ruleId, owner })) {
				throw new Error("Rule not owned");
			}

			const rows = db
				.query(
					`
          SELECT id FROM channel
          WHERE owner = ? AND id IN (${channelIds.map(() => "?").join(",")})
        `,
				)
				.all(b(owner), ...channelIds) as { id: number }[];

			if (rows.length !== channelIds.length) {
				throw new Error("One or more channels not owned");
			}

			db.transaction(() => {
				db.run(`DELETE FROM rule_channel WHERE rule_id = ?`, [ruleId]);

				const stmt = db.prepare(
					`INSERT INTO rule_channel (rule_id, channel_id) VALUES (?, ?)`,
				);

				for (const channelId of channelIds) {
					stmt.run(ruleId, channelId);
				}
			})();
		},

		insertChannel(channel: {
			owner: Uint8Array | string;
			name: string;
			type: string;
			config: Record<string, string>;
			enabled?: boolean;
		}) {
			const now = Date.now();

			const res = db.run(
				`
    INSERT INTO channel
    (owner, name, type, enabled, config, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
				[
					b(channel.owner),
					channel.name,
					channel.type,
					channel.enabled ?? 1,
					safeStringify(channel.config),
					now,
					now,
				],
			);

			return res.lastInsertRowid as number;
		},

		updateChannel(
			{ id, owner }: OwnedId,
			patch: Partial<Omit<RuleChannel, "id" | "owner">>,
		) {
			const fields: string[] = [];
			const params: SQLQueryBindings[] = [];

			if (patch.name !== undefined) {
				fields.push("name = ?");
				params.push(patch.name);
			}

			if (patch.type !== undefined) {
				fields.push("type = ?");
				params.push(patch.type);
			}

			if (patch.enabled !== undefined) {
				fields.push("enabled = ?");
				params.push(patch.enabled ? 1 : 0);
			}

			if (patch.config !== undefined) {
				fields.push("config = ?");
				params.push(safeStringify(patch.config));
			}

			if (!fields.length) return;

			fields.push("updated_at = ?");
			params.push(Date.now());

			db.run(
				`UPDATE channel SET ${fields.join(", ")} WHERE id = ? AND owner = ?`,
				[...params, id, b(owner)],
			);
		},

		deleteChannel({ id, owner }: OwnedId) {
			db.run(`DELETE FROM channel WHERE id = ? AND owner = ?`, [id, b(owner)]);
		},

		findAllChannels(opts: {
			owner: Uint8Array | string;
			enabled?: boolean;
		}): RuleChannel[] {
			const clauses: string[] = ["owner = ?"];
			const params: SQLQueryBindings[] = [b(opts.owner)];

			if (opts.enabled !== undefined) {
				clauses.push("enabled = ?");
				params.push(opts.enabled ? 1 : 0);
			}

			const rows = db
				.query(
					`
          SELECT *
          FROM channel
          WHERE ${clauses.join(" AND ")}
          ORDER BY name ASC
          `,
				)
				.all(...params) as any[];

			return rows.map(asChannel);
		},

		getChannel({ id, owner }: OwnedId): RuleChannel | null {
			const row = db
				.query<any, [number, Uint8Array | string]>(
					`
          SELECT *
          FROM channel
          WHERE id = ? AND owner = ?
          LIMIT 1
          `,
				)
				.get(id, b(owner));

			return row ? asChannel(row) : null;
		},

		getRuleInstance({ id, owner }: OwnedId): RuleInstance | null {
			const row = db
				.query<RuleInstance, [number, Uint8Array | string]>(
					`SELECT *
        FROM rule_instance WHERE id = ? AND owner = ? LIMIT 1`,
				)
				.get(id, b(owner));

			if (!row) return null;

			const [hydrated] = hydrateRules(db, [asRuleBase(row)]);
			return hydrated === undefined ? null : hydrated;
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
      ORDER BY priority DESC, id DESC
      LIMIT ?
    `;

			const rowsRaw = all<RuleInstance>(sql, ...params, limit + 1);

			const hasNext = rowsRaw.length > limit;
			if (hasNext) rowsRaw.pop();

			const rowsBase = rowsRaw.map(asRuleBase);
			const rows = hydrateRules(db, rowsBase);

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
			const rowsBase = db
				.query<RuleInstance, []>(
					`
          SELECT *
          FROM rule_instance
          ORDER BY owner, priority DESC, id DESC
          `,
				)
				.all()
				.map(asRuleBase);

			return hydrateRules(db, rowsBase);
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
