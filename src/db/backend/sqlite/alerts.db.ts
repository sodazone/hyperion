import type { Database, SQLQueryBindings } from "bun:sqlite";
import type { AlertPage, AlertPayload, OwnedAlert } from "@/db/model";
import { safeStringify } from "@/utils/strings";
import { alertCursor } from "../cursors";
import { b, parseRaw } from "../util";

export function createAlertsDB(db: Database) {
	function all<T>(sql: string, ...params: SQLQueryBindings[]): T[] {
		return db.query(sql).all(...params) as T[];
	}
	return {
		init() {
			db.run(`
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
        `);
		},

		insertAlert(a: OwnedAlert) {
			const ts = a.timestamp ?? Date.now();

			const res = db.run(
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
					db.run(
						`
            INSERT INTO alert_actor (alert_id, role, address)
            VALUES (?, ?, ?)
            `,
						[id, act.role ?? "unknown", b(act.address)],
					);
				}
			}

			return id;
		},

		insertMany(alerts: OwnedAlert[]) {
			db.run("BEGIN");
			try {
				for (const a of alerts) this.insertAlert(a);
				db.run("COMMIT");
			} catch (e) {
				db.run("ROLLBACK");
				throw e;
			}
		},

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

			const rowsRaw = all<OwnedAlert>(sql, ...params, limit + 1);

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
		},

		deleteAlertsOlderThan(owner: Uint8Array | string, ts: number) {
			return (
				db.run(`DELETE FROM alert WHERE owner = ? AND timestamp < ?`, [
					b(owner),
					ts,
				]).changes ?? 0
			);
		},

		countAlerts(owner: Uint8Array | string) {
			const r = db
				.query<{ c: number }, [Uint8Array]>(
					`SELECT COUNT(*) as c FROM alert WHERE owner = ?`,
				)
				.get(b(owner));

			return r?.c ?? 0;
		},
	};
}

export type AlertsDB = ReturnType<typeof createAlertsDB>;
