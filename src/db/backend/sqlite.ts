import { Database, type SQLQueryBindings } from "bun:sqlite";
import { decodeCursor, encodeCursor } from "../cursors";
import type { Category, Entity, Tag } from "../model";
import { b, cleanFilter } from "./util";

function parseRaw<T>(raw: unknown): T | undefined {
	return raw ? JSON.parse(raw as string) : undefined;
}

export class AddressDB {
	private db: Database;

	constructor(path = "entity_index.sqlite") {
		this.db = new Database(path);
		this.init();
	}

	private init() {
		this.db.run(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS entity (
        owner   BLOB NOT NULL,
        address BLOB NOT NULL,
        address_formatted TEXT NOT NULL,
        PRIMARY KEY(owner,address)
      );

      CREATE TABLE IF NOT EXISTS entity_category (
        owner BLOB NOT NULL,
        address BLOB NOT NULL,
        network INTEGER,
        category INTEGER NOT NULL,
        subcategory INTEGER DEFAULT 0,

        timestamp INTEGER,
        version   INTEGER,
        source    TEXT,
        raw       TEXT,

        PRIMARY KEY(owner,address,network,category,subcategory),
        FOREIGN KEY(owner,address)
          REFERENCES entity(owner,address)
          ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS entity_tag (
        owner BLOB NOT NULL,
        address BLOB NOT NULL,
        network INTEGER,
        tag TEXT NOT NULL,

        timestamp INTEGER,
        version   INTEGER,
        source    TEXT,
        raw       TEXT,

        PRIMARY KEY(owner,address,network,tag),
        FOREIGN KEY(owner,address)
          REFERENCES entity(owner,address)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_cat_lookup
        ON entity_category(category,subcategory,network);

      CREATE INDEX IF NOT EXISTS idx_tag_lookup
        ON entity_tag(tag,network);

      CREATE INDEX IF NOT EXISTS idx_cat_entity_lookup
        ON entity_category(owner,address,network);

      CREATE INDEX IF NOT EXISTS idx_tag_entity_lookup
        ON entity_tag(owner,address,network);
    `);
	}

	private upsertEntity(owner: Uint8Array, address: string | Uint8Array) {
		const addrBytes = b(address);
		const formatted =
			typeof address === "string"
				? address
				: Buffer.from(address).toString("hex");

		this.db.run(
			`
      INSERT INTO entity(owner, address, address_formatted)
      VALUES (?, ?, ?)
      ON CONFLICT(owner,address)
      DO UPDATE SET
        address_formatted =
          COALESCE(entity.address_formatted, excluded.address_formatted)
      `,
			[owner, addrBytes, formatted],
		);
	}

	upsertCategory({
		owner,
		address,
		network,
		category,
		subcategory = 0,
		timestamp = Date.now(),
		version = 0,
		source,
		raw,
	}: {
		owner: Uint8Array;
		address: Uint8Array | string;
		network?: number;
		category: number;
		subcategory?: number;
		timestamp?: number;
		version?: number;
		source?: string;
		raw?: unknown;
	}) {
		this.upsertEntity(owner, address);

		this.db.run(
			`
      INSERT INTO entity_category
      VALUES (?,?,?,?,?,?,?,?,?)
      ON CONFLICT DO UPDATE SET
        timestamp=excluded.timestamp,
        version=excluded.version,
        source=excluded.source,
        raw=excluded.raw
    `,
			[
				owner,
				b(address),
				network ?? null,
				category,
				subcategory,
				timestamp,
				version,
				source ?? null,
				raw ? JSON.stringify(raw) : null,
			],
		);
	}

	deleteCategory({
		owner,
		address,
		network,
		category,
		subcategory = 0,
	}: {
		owner: Uint8Array;
		address: Uint8Array | string;
		network?: number;
		category: number;
		subcategory?: number;
	}) {
		return (
			this.db.run(
				`
        DELETE FROM entity_category
        WHERE owner=? AND address=? AND network IS ?
          AND category=? AND subcategory=?`,
				[owner, b(address), network ?? null, category, subcategory],
			).changes ?? 0
		);
	}

	hasEntity({
		owner,
		address,
	}: {
		owner: Uint8Array;
		address: Uint8Array | string;
	}) {
		return !!this.db
			.query("SELECT 1 FROM entity WHERE owner=? AND address=? LIMIT 1")
			.get(owner, b(address));
	}

	hasCategory(args: {
		owner: Uint8Array;
		address: Uint8Array | string;
		network?: number;
		category: number;
		subcategory?: number;
	}) {
		return !!this.db
			.query(
				`SELECT 1 FROM entity_category
         WHERE owner=? AND address=? AND network IS ?
           AND category=? AND subcategory=? LIMIT 1`,
			)
			.get(
				args.owner,
				b(args.address),
				args.network ?? null,
				args.category,
				args.subcategory ?? 0,
			);
	}

	upsertTag({
		owner,
		address,
		network,
		tag,
		timestamp = Date.now(),
		version = 0,
		source,
		raw,
	}: {
		owner: Uint8Array;
		address: Uint8Array | string;
		network?: number;
		tag: string;
		timestamp?: number;
		version?: number;
		source?: string;
		raw?: unknown;
	}) {
		this.upsertEntity(owner, address);

		this.db.run(
			`
      INSERT INTO entity_tag
      VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT DO UPDATE SET
        timestamp=excluded.timestamp,
        version=excluded.version,
        source=excluded.source,
        raw=excluded.raw
    `,
			[
				owner,
				b(address),
				network ?? null,
				tag,
				timestamp,
				version,
				source ?? null,
				raw ? JSON.stringify(raw) : null,
			],
		);
	}

	hasTag(args: {
		owner: Uint8Array;
		address: Uint8Array | string;
		network?: number;
		tag: string;
	}) {
		return !!this.db
			.query(
				`SELECT 1 FROM entity_tag
         WHERE owner=? AND address=? AND network IS ? AND tag=? LIMIT 1`,
			)
			.get(args.owner, b(args.address), args.network ?? null, args.tag);
	}

	findEntity({
		owner,
		address,
		network,
	}: {
		owner: Uint8Array;
		address: Uint8Array | string;
		network?: number;
	}): Entity | undefined {
		const addr = b(address);

		const base = this.db
			.query(
				`
        SELECT address, address_formatted
        FROM entity
        WHERE owner=? AND address=? LIMIT 1
      `,
			)
			.get(owner, addr) as
			| { address: Uint8Array; address_formatted: string }
			| undefined;

		if (!base) return;

		const entity: Required<Entity> = {
			owner,
			address: base.address,
			address_formatted: base.address_formatted,
			tags: [],
			categories: [],
		};

		// tags
		const tagRows = this.all<Tag>(
			`
        SELECT network, tag, timestamp, version, source, raw
        FROM entity_tag
        WHERE owner=? AND address=? ${network !== undefined ? "AND network=?" : ""}
        ORDER BY timestamp DESC
      `,
			...(network !== undefined ? [owner, addr, network] : [owner, addr]),
		);

		for (const r of tagRows) {
			entity.tags.push({
				...r,
				source: r.source ?? undefined,
				raw: parseRaw(r.raw),
				network: r.network ?? 0,
			});
		}

		// categories
		const catRows = this.all<Category>(
			`
        SELECT network, category, subcategory, timestamp, version, source, raw
        FROM entity_category
        WHERE owner=? AND address=? ${network !== undefined ? "AND network=?" : ""}
        ORDER BY timestamp DESC
      `,
			...(network !== undefined ? [owner, addr, network] : [owner, addr]),
		);

		for (const r of catRows) {
			entity.categories.push({
				...r,
				source: r.source ?? undefined,
				raw: parseRaw(r.raw),
				network: r.network ?? 0,
			});
		}

		return entity;
	}

	private queryAddresses({
		owner,
		network,
		category,
		subcategory,
		tag,
		address,
		cursor,
		limit = 25,
	}: {
		owner: Uint8Array;
		network?: number;
		category?: number;
		subcategory?: number;
		tag?: string;
		address?: string;
		cursor?: string;
		limit?: number;
	}): { address: Uint8Array; address_formatted: string }[] {
		const clauses = ["e.owner=?"];
		const p: SQLQueryBindings[] = [b(owner)];

		if (category !== undefined) {
			clauses.push(`
        EXISTS (
          SELECT 1
          FROM entity_category ec
          WHERE ec.owner = e.owner
            AND ec.address = e.address
            ${network !== undefined ? "AND ec.network=?" : ""}
            AND ec.category=?
            ${subcategory !== undefined ? "AND ec.subcategory=?" : ""}
        )
      `);

			if (network !== undefined) p.push(network);
			p.push(category);
			if (subcategory !== undefined) p.push(subcategory);
		}

		if (tag !== undefined) {
			clauses.push(`
        EXISTS (
          SELECT 1
          FROM entity_tag et
          WHERE et.owner = e.owner
            AND et.address = e.address
            ${network !== undefined ? "AND et.network=?" : ""}
            AND et.tag=?
        )
      `);

			if (network !== undefined) p.push(network);
			p.push(tag);
		}

		if (address !== undefined) {
			clauses.push("e.address = ?");
			p.push(b(address));
		}

		if (cursor) {
			clauses.push("e.address > ?");
			p.push(decodeCursor(cursor));
		}

		const rows = this.db
			.query(
				`
        SELECT e.address, e.address_formatted
        FROM entity e
        WHERE ${clauses.join(" AND ")}
        ORDER BY e.address
        LIMIT ?
        `,
			)
			.all(...p, limit) as Array<{
			address: Uint8Array;
			address_formatted: string;
		}>;

		return rows;
	}

	queryEntities(opts: {
		owner: Uint8Array;
		network?: number;
		category?: number;
		subcategory?: number;
		tag?: string;
		address?: string;
		cursor?: string;
		limit?: number;
	}): {
		rows: Array<Entity>;
		cursorNext?: string;
	} {
		const limit = opts.limit ?? 25;
		const queryOpts = {
			...opts,
			address: opts.address?.trim() || undefined,
			network: cleanFilter(opts.network),
			category: cleanFilter(opts.category),
			subcategory: cleanFilter(opts.subcategory),
			tag: cleanFilter(opts.tag),
		};
		const addresses = this.queryAddresses({
			...queryOpts,
			limit: limit + 1,
		});

		if (addresses.length === 0) return { rows: [] };

		const hasNext = addresses.length > limit;
		if (hasNext) addresses.pop();

		const ownerBuf = opts.owner;

		const tagRows = this.all<{ address: Uint8Array } & Tag>(
			`
      SELECT address, tag, timestamp, version, source, raw, network
      FROM entity_tag
      WHERE owner=? AND address IN (${addresses.map(() => "?").join(",")})
      `,
			ownerBuf,
			...addresses.map((a) => a.address),
		);

		const catRows = this.all<{ address: Uint8Array } & Category>(
			`
      SELECT address, category, subcategory, timestamp, version, source, raw, network
      FROM entity_category
      WHERE owner=? AND address IN (${addresses.map(() => "?").join(",")})
      `,
			ownerBuf,
			...addresses.map((a) => a.address),
		);

		const map = new Map<string, Entity>();
		const keyOf = (a: Uint8Array) => Buffer.from(a).toString("hex");

		for (const { address, address_formatted } of addresses) {
			map.set(keyOf(address), {
				owner: opts.owner,
				address,
				address_formatted,
				tags: [],
				categories: [],
			});
		}

		for (const {
			address,
			version,
			tag,
			timestamp,
			source,
			raw,
			network,
		} of tagRows) {
			const entity = map.get(keyOf(address));
			if (entity !== undefined) {
				entity?.tags?.push({
					tag,
					timestamp,
					version,
					network: network ?? 0,
					source: source ?? undefined,
					raw: parseRaw(raw),
				});
			}
		}

		for (const {
			address,
			category,
			subcategory,
			timestamp,
			version,
			source,
			raw,
			network,
		} of catRows) {
			const entity = map.get(keyOf(address));
			if (entity !== undefined) {
				entity.categories?.push({
					category,
					subcategory,
					timestamp,
					version,
					network: network ?? 0,
					source: source ?? undefined,
					raw: parseRaw(raw),
				});
			}
		}

		const rows = [...map.values()];
		const lastRow = rows.at(-1);
		const cursorNext =
			lastRow && hasNext ? encodeCursor(lastRow.address) : undefined;

		return { rows, cursorNext };
	}

	queryCategories({
		owner,
		address,
		network,
		category,
		subcategory,
	}: {
		owner: Uint8Array;
		address: Uint8Array | string;
		network?: number;
		category?: number;
		subcategory?: number;
	}): Category[] {
		const clauses: string[] = ["owner = ?", "address = ?"];
		const params: SQLQueryBindings[] = [owner, b(address)];

		if (network !== undefined) {
			clauses.push("network = ?");
			params.push(network);
		}
		if (category !== undefined) {
			clauses.push("category = ?");
			params.push(category);
		}
		if (subcategory !== undefined) {
			clauses.push("subcategory = ?");
			params.push(subcategory);
		}

		const sql = `
      SELECT network, category, subcategory, timestamp, version, source, raw
      FROM entity_category
      WHERE ${clauses.join(" AND ")}
      ORDER BY timestamp DESC
    `;

		const rows = this.all<Category>(sql, ...params);

		return rows.map(
			({
				network,
				category,
				subcategory,
				timestamp,
				version,
				source,
				raw,
			}) => ({
				network,
				category,
				subcategory,
				timestamp,
				version,
				source: source ?? undefined,
				raw: parseRaw(raw),
			}),
		);
	}

	queryTags({
		owner,
		address,
		network,
	}: {
		owner: Uint8Array;
		address: Uint8Array | string;
		network?: number;
	}): Tag[] {
		const clauses: string[] = ["owner = ?", "address = ?"];
		const params: SQLQueryBindings[] = [owner, b(address)];

		if (network !== undefined) {
			clauses.push("network = ?");
			params.push(network);
		}

		const rows = this.all<Tag>(
			`
      SELECT network, tag, timestamp, version, source, raw
      FROM entity_tag
      WHERE ${clauses.join(" AND ")}
      ORDER BY timestamp DESC
    `,
			...params,
		);

		return rows.map(({ network, tag, timestamp, version, source, raw }) => ({
			network,
			tag,
			timestamp,
			version,
			source: source ?? undefined,
			raw: parseRaw(raw),
		}));
	}

	upsertEntities(records: Entity[]) {
		this.db.run("BEGIN");

		try {
			for (const r of records) {
				this.upsertEntity(r.owner, r.address_formatted ?? r.address);

				for (const t of r.tags ?? []) {
					this.upsertTag({
						owner: r.owner,
						address: r.address,
						...t,
					});
				}

				for (const c of r.categories ?? []) {
					this.upsertCategory({
						owner: r.owner,
						address: r.address,
						...c,
					});
				}
			}

			this.db.run("COMMIT");
		} catch (e) {
			this.db.run("ROLLBACK");
			throw e;
		}
	}

	close() {
		this.db.close();
	}

	private all<T>(sql: string, ...params: SQLQueryBindings[]): T[] {
		return this.db.query(sql).all(...params) as T[];
	}
}
