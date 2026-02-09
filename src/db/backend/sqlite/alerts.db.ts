import { Database, type SQLQueryBindings } from "bun:sqlite";
import type { RuleInstance } from "@/alerting";
import type { AlertPage, AlertPayload, OwnedAlert } from "@/db/model";
import { safeStringify } from "@/utils/strings";
import { alertCursor } from "../cursors";
import { b, parseRaw } from "../util";

export class AlertsDB {
	private db: Database;

	constructor(path = "alerts.sqlite") {
		this.db = new Database(path);
		this.init();
	}

	private init() {
		this.db.run(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA busy_timeout = 5000;

      CREATE TABLE IF NOT EXISTS alert (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner BLOB NOT NULL,

        timestamp INTEGER NOT NULL,

        rule_id TEXT NOT NULL,
        level  INTEGER NOT NULL,
        remark TEXT,

        network INTEGER,

        tx_hash TEXT,
        block_number TEXT,
        block_hash TEXT,

        message TEXT NOT NULL,
        payload TEXT
      );

      CREATE TABLE IF NOT EXISTS alert_actor (
        alert_id INTEGER NOT NULL,
        role     TEXT NOT NULL,
        address  BLOB NOT NULL,

        FOREIGN KEY(alert_id)
          REFERENCES alert(id)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_alert_owner_time
        ON alert(owner, timestamp DESC, id DESC);

      CREATE INDEX IF NOT EXISTS idx_actor_address_alert
        ON alert_actor(address, alert_id);


      CREATE TABLE IF NOT EXISTS rule_instance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

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
	}

	insertAlert(a: OwnedAlert) {
		const ts = a.timestamp ?? Date.now();

		const res = this.db.run(
			`
      INSERT INTO alert
      (owner, timestamp, rule_id, level, remark, network, tx_hash, block_number, block_hash, message, payload)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
			[
				b(a.owner),
				ts,
				a.rule_id,
				a.level,
				a.remark ?? null,
				a.network ?? null,
				a.tx_hash ?? null,
				a.block_number ?? null,
				a.block_hash ?? null,
				a.message,
				a.payload ? safeStringify(a.payload) : null,
			],
		);

		const id = res.lastInsertRowid as number;

		const actors = a.payload?.actors;
		if (Array.isArray(actors)) {
			for (const act of actors) {
				this.db.run(
					`
          INSERT INTO alert_actor (alert_id, role, address)
          VALUES (?, ?, ?)
          `,
					[id, act.role ?? "unknown", b(act.address)],
				);
			}
		}

		return id;
	}

	insertMany(alerts: OwnedAlert[]) {
		this.db.run("BEGIN");
		try {
			for (const a of alerts) this.insertAlert(a);
			this.db.run("COMMIT");
		} catch (e) {
			this.db.run("ROLLBACK");
			throw e;
		}
	}

	findAlerts(opts: {
		owner: Uint8Array | string;
		ruleId?: string;
		levelMin?: number;
		levelMax?: number;
		network?: number;
		address?: Uint8Array | string;
		since?: number;
		until?: number;
		cursor?: string;
		limit?: number;
	}): AlertPage {
		const clauses: string[] = ["a.owner = ?"];
		const params: SQLQueryBindings[] = [b(opts.owner)];

		let joinActor = false;

		if (opts.ruleId) {
			clauses.push("a.rule_id = ?");
			params.push(opts.ruleId);
		}

		if (opts.levelMin !== undefined) {
			clauses.push("a.level >= ?");
			params.push(opts.levelMin);
		}

		if (opts.levelMax !== undefined) {
			clauses.push("a.level <= ?");
			params.push(opts.levelMax);
		}

		if (opts.network) {
			clauses.push("a.network = ?");
			params.push(opts.network);
		}

		if (opts.address) {
			joinActor = true;
			clauses.push("aa.address = ?");
			params.push(b(opts.address));
		}

		if (opts.since !== undefined) {
			clauses.push("a.timestamp >= ?");
			params.push(opts.since);
		}

		if (opts.until !== undefined) {
			clauses.push("a.timestamp <= ?");
			params.push(opts.until);
		}

		if (opts.cursor) {
			const { ts, id } = alertCursor.decode(opts.cursor);
			clauses.push(`(a.timestamp < ? OR (a.timestamp = ? AND a.id < ?))`);
			params.push(ts, ts, id);
		}

		const limit = opts.limit ?? 100;

		const sql = `
      SELECT DISTINCT a.*
      FROM alert a
      ${joinActor ? "JOIN alert_actor aa ON aa.alert_id = a.id" : ""}
      ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
      ORDER BY a.timestamp DESC, a.id DESC
      LIMIT ?
    `;

		const rowsRaw = this.all<OwnedAlert>(sql, ...params, limit + 1);

		const hasNext = rowsRaw.length > limit;
		if (hasNext) rowsRaw.pop();

		const rows = rowsRaw.map((r) => ({
			id: r.id,
			owner: r.owner,
			timestamp: r.timestamp,
			rule_id: r.rule_id,
			level: r.level,
			remark: r.remark ?? undefined,
			network: r.network ?? undefined,
			tx_hash: r.tx_hash ?? undefined,
			block_number: r.block_number ?? undefined,
			block_hash: r.block_hash ?? undefined,
			message: r.message,
			payload: parseRaw<AlertPayload>(r.payload),
		}));

		const last = rows.at(-1);

		const cursorNext =
			hasNext && last
				? alertCursor.encode({ ts: last.timestamp, id: last.id ?? 0 })
				: undefined;

		return { rows, cursorNext };
	}

	deleteAlertsOlderThan(owner: Uint8Array | string, ts: number) {
		return (
			this.db.run(`DELETE FROM alert WHERE owner = ? AND timestamp < ?`, [
				b(owner),
				ts,
			]).changes ?? 0
		);
	}

	countAlerts(owner: Uint8Array | string) {
		const r = this.db
			.query<{ c: number }, [Uint8Array]>(
				`SELECT COUNT(*) as c FROM alert WHERE owner = ?`,
			)
			.get(b(owner));

		return r?.c ?? 0;
	}

	insertRuleInstance(instance: {
		owner: Uint8Array;
		ruleKey: string;
		config?: unknown;
		enabled?: boolean;
		priority?: number;
		cooldownMs?: number;
	}) {
		const now = Date.now();

		const res = this.db.run(
			`
        INSERT INTO rule_instance
        (owner, rule_key, enabled, priority, cooldown_ms, config, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
			[
				instance.owner,
				instance.ruleKey,
				instance.enabled ?? 1,
				instance.priority ?? null,
				instance.cooldownMs ?? null,
				instance.config ? safeStringify(instance.config) : null,
				now,
				now,
			],
		);

		return res.lastInsertRowid as number;
	}

	updateRuleInstance(id: number, patch: Partial<RuleInstance>) {
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

		this.db.run(`UPDATE rule_instance SET ${fields.join(", ")} WHERE id = ?`, [
			...params,
			id,
		]);
	}

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
    SELECT id,
      owner,
      rule_key    AS ruleKey,
      enabled,
      priority,
      cooldown_ms AS cooldownMs,
      config,
      created_at  AS createdAt,
      updated_at  AS updatedAt
    FROM rule_instance
    ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
    ORDER BY priority ASC, id ASC
    LIMIT ?
  `;

		const rowsRaw = this.all<RuleInstance>(sql, ...params, limit + 1);

		const hasNext = rowsRaw.length > limit;
		if (hasNext) rowsRaw.pop();

		const rows: RuleInstance[] = rowsRaw.map((r) => ({
			...r,
			config: parseRaw(r.config) ?? {},
		}));

		const last = rows.at(-1);

		const cursorNext =
			hasNext && last
				? Buffer.from(
						JSON.stringify({ p: last.priority ?? null, id: last.id }),
					).toString("base64")
				: undefined;

		return { rows, cursorNext };
	}

	findAllRuleInstances(): RuleInstance[] {
		return this.db
			.query<RuleInstance, []>(
				`
        SELECT
          id,
          owner,
          rule_key    AS ruleKey,
          enabled,
          priority,
          cooldown_ms AS cooldownMs,
          config,
          created_at  AS createdAt,
          updated_at  AS updatedAt
        FROM rule_instance
        ORDER BY owner, priority ASC, id ASC
        `,
			)
			.all()
			.map((r) => ({
				...r,
				enabled: !!r.enabled,
				config: parseRaw(r.config) ?? {},
			}));
	}

	deleteRuleInstance(id: number) {
		this.db.run(`DELETE FROM rule_instance WHERE id = ?`, [id]);
	}

	close() {
		this.db.close();
	}

	private all<T>(sql: string, ...params: SQLQueryBindings[]): T[] {
		return this.db.query(sql).all(...params) as T[];
	}
}
