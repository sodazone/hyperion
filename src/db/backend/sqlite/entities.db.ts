import { Database, type SQLQueryBindings } from "bun:sqlite";
import { safeStringify } from "@/utils/strings";
import type { Category, Entity, Tag } from "../../model";
import { entityCursor } from "../cursors";
import { b, cleanFilter, parseRaw } from "../util";

export class EntitiesDB {
	private db: Database;

	constructor(path = "entities.sqlite") {
		this.db = new Database(path);
		this.init();
	}

	private init() {
		this.db.run(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA busy_timeout = 5000;

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
				raw ? safeStringify(raw) : null,
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

	deleteEntity({
		owner,
		address,
	}: {
		owner: Uint8Array;
		address: Uint8Array | string;
	}) {
		return (
			this.db.run(
				`
        DELETE FROM entity
        WHERE owner=? AND address=?`,
				[owner, b(address)],
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
		const clauses = ["owner = ?", "address = ?", "category = ?"];
		const params: SQLQueryBindings[] = [
			args.owner,
			b(args.address),
			args.category,
		];

		if (args.network !== undefined) {
			clauses.push("network = ?");
			params.push(args.network);
		}

		if (args.subcategory !== undefined) {
			clauses.push("subcategory = ?");
			params.push(args.subcategory);
		}

		const sql = `SELECT 1 FROM entity_category WHERE ${clauses.join(
			" AND ",
		)} LIMIT 1`;

		return !!this.db.query(sql).get(...params);
	}

	deleteAllCategories({
		owner,
		address,
		network,
	}: {
		owner: Uint8Array;
		address: Uint8Array | string;
		network?: number;
	}) {
		const params: SQLQueryBindings[] = [owner, b(address)];
		const where = ["owner = ?", "address = ?"];

		if (network !== undefined) {
			where.push("network = ?");
			params.push(network);
		}

		const sql = `
        DELETE FROM entity_category
        WHERE ${where.join(" AND ")}
      `;

		return this.db.run(sql, params).changes ?? 0;
	}

	deleteAllTags({
		owner,
		address,
		network,
	}: {
		owner: Uint8Array;
		address: Uint8Array | string;
		network?: number;
	}) {
		const params: SQLQueryBindings[] = [owner, b(address)];
		const where = ["owner = ?", "address = ?"];

		if (network !== undefined) {
			where.push("network = ?");
			params.push(network);
		}

		const sql = `
        DELETE FROM entity_tag
        WHERE ${where.join(" AND ")}
      `;

		return this.db.run(sql, params).changes ?? 0;
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
				raw ? safeStringify(raw) : null,
			],
		);
	}

	hasTag(args: {
		owner: Uint8Array;
		address: Uint8Array | string;
		network?: number;
		tag?: string;
		tagPrefix?: string;
	}) {
		const clauses = ["owner = ?", "address = ?"];
		const params: SQLQueryBindings[] = [args.owner, b(args.address)];

		if (args.network !== undefined) {
			clauses.push("network = ?");
			params.push(args.network);
		}

		if (args.tag !== undefined) {
			clauses.push("tag = ?");
			params.push(args.tag);
		} else if (args.tagPrefix !== undefined) {
			clauses.push("tag LIKE ?");
			params.push(`${args.tagPrefix}%`);
		}

		const sql = `SELECT 1 FROM entity_tag WHERE ${clauses.join(
			" AND ",
		)} LIMIT 1`;

		return !!this.db.query(sql).get(...params);
	}

	findAllTags({
		owner,
		network,
		prefix,
	}: {
		owner: Uint8Array;
		network?: number;
		prefix?: string;
	}): string[] {
		const clauses = ["owner = ?"];
		const params: SQLQueryBindings[] = [owner];

		if (network !== undefined) {
			clauses.push("network = ?");
			params.push(network);
		}

		if (prefix) {
			clauses.push("tag LIKE ?");
			params.push(`${prefix}%`);
		}

		const rows = this.db
			.query(
				`
        SELECT DISTINCT tag
        FROM entity_tag
        WHERE ${clauses.join(" AND ")}
        ORDER BY tag
        `,
			)
			.all(...params) as { tag: string }[];

		return rows.map((r) => r.tag);
	}

	findEntity({
		owner,
		address,
		network,
		categories,
		subcategories,
		tags,
	}: {
		owner: Uint8Array | Uint8Array[];
		address: Uint8Array | string;
		network?: number;
		categories?: number[];
		subcategories?: number[];
		tags?: string[];
	}): Entity | undefined {
		const addr = b(address);
		const owners = Array.isArray(owner) ? owner : [owner];

		const ownerPlaceholders = owners.map(() => "?").join(",");

		const base = this.db
			.query(
				`
        SELECT owner, address, address_formatted
        FROM entity
        WHERE owner IN (${ownerPlaceholders}) AND address=?
        LIMIT 1
      `,
			)
			.get(...owners, addr) as
			| { owner: Uint8Array; address: Uint8Array; address_formatted: string }
			| undefined;

		if (!base) return;

		const entity: Required<Entity> = {
			owner: base.owner,
			address: base.address,
			address_formatted: base.address_formatted,
			tags: [],
			categories: [],
		};

		const ownerArgs = [...owners, addr];

		const tagRows = this.all<Tag>(
			`
        SELECT network, tag, timestamp, version, source, raw
        FROM entity_tag
        WHERE owner IN (${ownerPlaceholders}) AND address=?
        ${network !== undefined ? "AND network=?" : ""}
        ORDER BY timestamp DESC
      `,
			...(network !== undefined ? [...ownerArgs, network] : ownerArgs),
		);

		let tagMatch = !(tags?.length ?? false);

		for (const r of tagRows) {
			if (!tagMatch && tags?.includes(r.tag)) {
				tagMatch = true;
			}

			entity.tags.push({
				...r,
				source: r.source ?? undefined,
				raw: parseRaw(r.raw),
				network: r.network ?? 0,
			});
		}

		if (!tagMatch) return;

		const catRows = this.all<Category>(
			`
        SELECT network, category, subcategory, timestamp, version, source, raw
        FROM entity_category
        WHERE owner IN (${ownerPlaceholders}) AND address=?
        ${network !== undefined ? "AND network=?" : ""}
        ORDER BY timestamp DESC
      `,
			...(network !== undefined ? [...ownerArgs, network] : ownerArgs),
		);

		let categoryMatch =
			!(categories?.length ?? false) && !(subcategories?.length ?? false);

		for (const r of catRows) {
			if (!categoryMatch) {
				if (categories?.includes(r.category)) categoryMatch = true;
				else if (subcategories?.includes(r.subcategory)) categoryMatch = true;
			}

			entity.categories.push({
				...r,
				source: r.source ?? undefined,
				raw: parseRaw(r.raw),
				network: r.network ?? 0,
			});
		}

		if (!categoryMatch) return;

		return entity;
	}

	private findAddresses({
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
		const clauses: string[] = ["e.owner=?"];
		const params: SQLQueryBindings[] = [b(owner)];

		// Filter by category/subcategory
		if (category !== undefined) {
			clauses.push(`
        EXISTS (
          SELECT 1
          FROM entity_category ec
          WHERE ec.owner = e.owner
            AND ec.address = e.address
            AND ec.category = ?
            ${subcategory !== undefined ? "AND ec.subcategory = ?" : ""}
            ${network !== undefined ? "AND ec.network = ?" : ""}
        )
      `);
			params.push(category);
			if (subcategory !== undefined) params.push(subcategory);
			if (network !== undefined) params.push(network);
		}

		// Filter by tag
		if (tag !== undefined) {
			clauses.push(`
        EXISTS (
          SELECT 1
          FROM entity_tag et
          WHERE et.owner = e.owner
            AND et.address = e.address
            AND et.tag = ?
            ${network !== undefined ? "AND et.network = ?" : ""}
        )
      `);
			params.push(tag);
			if (network !== undefined) params.push(network);
		}

		// Filter by network only
		if (network !== undefined && category === undefined && tag === undefined) {
			clauses.push(`
        (
          EXISTS (
            SELECT 1 FROM entity_category ec
            WHERE ec.owner = e.owner
              AND ec.address = e.address
              AND ec.network = ?
          )
          OR
          EXISTS (
            SELECT 1 FROM entity_tag et
            WHERE et.owner = e.owner
              AND et.address = e.address
              AND et.network = ?
          )
        )
      `);
			params.push(network, network);
		}

		if (address !== undefined) {
			clauses.push("e.address = ?");
			params.push(b(address));
		}

		if (cursor) {
			clauses.push("e.address > ?");
			params.push(entityCursor.decode(cursor));
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
			.all(...params, limit) as Array<{
			address: Uint8Array;
			address_formatted: string;
		}>;

		return rows;
	}

	findEntities(opts: {
		owner: Uint8Array;
		network?: number;
		category?: number;
		subcategory?: number;
		tag?: string;
		address?: string;
		cursor?: string;
		limit?: number;
	}): { rows: Array<Entity>; cursorNext?: string } {
		const limit = opts.limit ?? 25;

		const addresses = this.findAddresses({
			owner: opts.owner,
			network: cleanFilter(opts.network),
			category: cleanFilter(opts.category),
			subcategory: cleanFilter(opts.subcategory),
			tag: cleanFilter(opts.tag),
			address: opts.address?.trim() || undefined,
			cursor: opts.cursor,
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
			if (entity) {
				entity.tags?.push({
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
			if (entity) {
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
			lastRow && hasNext ? entityCursor.encode(lastRow.address) : undefined;

		return { rows, cursorNext };
	}

	findCategories({
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

	findTags({
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
