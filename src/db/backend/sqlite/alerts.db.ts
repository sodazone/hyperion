import type { Database, SQLQueryBindings } from "bun:sqlite";
import type {
	AlertMessagePart,
	AlertNetwork,
	AlertPage,
	AlertPayload,
	OwnedAlert,
} from "@/db/model";
import { safeStringify } from "@/utils/strings";
import { alertCursor } from "../cursors";
import { b, parseJSON } from "../util";

type AlertQuery = {
	owner: Uint8Array | string;
	name?: string;
	levelMin?: number;
	levelMax?: number;
	network?: number;
	address?: Uint8Array | string;
	since?: number;
	until?: number;
	after?: string;
	cursor?: string;
	limit?: number;
};

function buildAlertQuery(opts: AlertQuery) {
	const clauses: string[] = ["a.owner = ?"];
	const params: SQLQueryBindings[] = [b(opts.owner)];
	let joinActor = false;
	let joinNetwork = false;

	if (opts.name) {
		clauses.push("a.name = ?");
		params.push(opts.name);
	}

	if (opts.levelMin !== undefined) {
		clauses.push("a.level >= ?");
		params.push(opts.levelMin);
	}

	if (opts.levelMax !== undefined) {
		clauses.push("a.level <= ?");
		params.push(opts.levelMax);
	}

	if (opts.network !== undefined) {
		joinNetwork = true;
		clauses.push("an.network = ?");
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
	} else if (opts.after) {
		const { ts, id } = alertCursor.decode(opts.after);
		clauses.push(`(a.timestamp > ? OR (a.timestamp = ? AND a.id > ?))`);
		params.push(ts, ts, id);
	}

	return {
		where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
		params,
		joinActor,
		joinNetwork,
	};
}

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

          name TEXT NOT NULL,
          level  INTEGER NOT NULL,
          remark TEXT,

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

        CREATE TABLE IF NOT EXISTS alert_network (
          alert_id    INTEGER NOT NULL,
          role        TEXT NOT NULL,
          network     INTEGER,
          tx_hash     TEXT,
          block_number TEXT,
          block_hash   TEXT,

          FOREIGN KEY(alert_id)
            REFERENCES alert(id)
            ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_alert_network_network
          ON alert_network(network, alert_id);

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
        (owner, timestamp, name, level, remark, message, payload)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
				[
					b(a.owner),
					ts,
					a.name,
					a.level,
					a.remark ?? null,
					safeStringify(a.message),
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

			if (Array.isArray(a.networks)) {
				for (const n of a.networks) {
					db.run(
						`
            INSERT INTO alert_network
            (alert_id, role, network, tx_hash, block_number, block_hash)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
						[
							id,
							n.role ?? "unknown",
							n.network ?? null,
							n.tx_hash ?? null,
							n.block_number ?? null,
							n.block_hash ?? null,
						],
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

		findAlerts(opts: AlertQuery): AlertPage {
			const limit = opts.limit ?? 100;
			const { where, params, joinActor, joinNetwork } = buildAlertQuery(opts);

			const sql = `
        SELECT DISTINCT a.*
        FROM alert a
        ${joinActor ? "JOIN alert_actor aa ON aa.alert_id = a.id" : ""}
        ${joinNetwork ? "JOIN alert_network an ON an.alert_id = a.id" : ""}
        ${where}
        ORDER BY a.timestamp DESC, a.id DESC
        LIMIT ?
      `;

			const rowsRaw = all<OwnedAlert>(sql, ...params, limit + 1);

			const hasNext = rowsRaw.length > limit;
			if (hasNext) rowsRaw.pop();

			const rows: OwnedAlert[] = rowsRaw.map((r) => ({
				id: r.id,
				owner: r.owner,
				timestamp: r.timestamp,
				name: r.name,
				level: r.level,
				remark: r.remark ?? undefined,
				message: parseJSON<AlertMessagePart[]>(r.message) ?? [],
				payload: parseJSON<AlertPayload>(r.payload),
			}));

			// TODO: consider one pass with map
			for (const row of rows) {
				if (row.id !== undefined) {
					const networks = all<AlertNetwork>(
						`
        SELECT role, network, tx_hash, block_number, block_hash
        FROM alert_network
        WHERE alert_id = ?
        `,
						row.id,
					);
					row.networks = networks.length ? networks : undefined;
				}
			}

			const last = rows.at(-1);

			const cursorNext =
				hasNext && last
					? alertCursor.encode({ ts: last.timestamp, id: last.id ?? 0 })
					: undefined;

			return { rows, cursorNext };
		},

		countAlerts(opts: AlertQuery): number {
			const { where, params, joinActor, joinNetwork } = buildAlertQuery(opts);

			const sql = `
        SELECT COUNT(DISTINCT a.id) as count
        FROM alert a
        ${joinActor ? "JOIN alert_actor aa ON aa.alert_id = a.id" : ""}
        ${joinNetwork ? "JOIN alert_network an ON an.alert_id = a.id" : ""}
        ${where}
      `;

			const row = db.query(sql).get(...params) as { count: number };
			return row?.count ?? 0;
		},

		deleteAlertsOlderThan(owner: Uint8Array | string, ts: number) {
			return (
				db.run(`DELETE FROM alert WHERE owner = ? AND timestamp < ?`, [
					b(owner),
					ts,
				]).changes ?? 0
			);
		},

		getTopAlerts({
			owners,
			limit = 5,
		}: {
			owners: Array<Uint8Array>;
			limit: number;
		}) {
			if (!owners?.length) return [];

			const ownerParams = owners.map(b);
			const placeholders = ownerParams.map(() => "?").join(",");

			const sql = `
    SELECT
      a.*,
      an.role as net_role,
      an.network as net_network,
      an.tx_hash as net_tx_hash,
      an.block_number as net_block_number,
      an.block_hash as net_block_hash
    FROM (
      SELECT *
      FROM alert
      WHERE owner IN (${placeholders})
      ORDER BY timestamp DESC, id DESC
      LIMIT ?
    ) a
    LEFT JOIN alert_network an ON an.alert_id = a.id
    ORDER BY a.timestamp DESC, a.id DESC
  `;

			const params: SQLQueryBindings[] = [...ownerParams, limit];
			const rowsRaw = db.query(sql).all(...params) as any[];
			const map = new Map<number, OwnedAlert>();

			for (const r of rowsRaw) {
				if (!map.has(r.id)) {
					map.set(r.id, {
						id: r.id,
						owner: r.owner,
						timestamp: r.timestamp,
						name: r.name,
						level: r.level,
						remark: r.remark ?? undefined,
						message: parseJSON<AlertMessagePart[]>(r.message) ?? [],
						networks: [],
					});
				}

				if (r.net_network !== null) {
					map.get(r.id)?.networks?.push({
						role: r.net_role,
						network: r.net_network,
						tx_hash: r.net_tx_hash,
						block_number: r.net_block_number,
						block_hash: r.net_block_hash,
					});
				}
			}

			return Array.from(map.values());
		},
	};
}

export type AlertsDB = ReturnType<typeof createAlertsDB>;
