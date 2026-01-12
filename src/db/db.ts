import type RocksDB from "rocksdb";
import rocksdb from "rocksdb";

export class AsyncRocksDB {
	private db: rocksdb;

	constructor(path: string) {
		this.db = rocksdb(path);
	}

	async open(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.db.open({ createIfMissing: true }, (err) =>
				err ? reject(err) : resolve(),
			);
		});
	}

	async close(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.db.close((err) => (err ? reject(err) : resolve()));
		});
	}

	async get(key: RocksDB.Bytes): Promise<RocksDB.Bytes | null> {
		return new Promise((resolve, reject) => {
			this.db.get(key, { asBuffer: true }, (err, value) => {
				if (err) {
					reject(err);
				} else {
					resolve(value as RocksDB.Bytes);
				}
			});
		});
	}

	async put(key: RocksDB.Bytes, value: RocksDB.Bytes): Promise<void> {
		return new Promise((resolve, reject) => {
			this.db.put(key, value, (err) => (err ? reject(err) : resolve()));
		});
	}

	async del(key: RocksDB.Bytes): Promise<void> {
		return new Promise((resolve, reject) => {
			this.db.del(key, (err) => (err ? reject(err) : resolve()));
		});
	}

	/**
	 * Batch operations: accepts array of { type, key, value? }
	 * type: "put" | "del"
	 */
	async batch(
		ops: {
			type: "put" | "del";
			key: RocksDB.Bytes;
			value?: RocksDB.Bytes;
		}[],
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const b = this.db.batch();
			for (const op of ops) {
				if (op.type === "put" && op.value !== undefined) {
					b.put(op.key, op.value);
				} else {
					b.del(op.key);
				}
			}
			b.write((err) => (err ? reject(err) : resolve()));
		});
	}

	/**
	 * Iterator support (optional, async generator)
	 */
	async *iterator(
		options?: rocksdb.IteratorOptions,
	): AsyncGenerator<{ key: Uint8Array; value: Uint8Array }> {
		const it = this.db.iterator({
			...options,
			keyAsBuffer: true,
			valueAsBuffer: true,
		});
		try {
			while (true) {
				const next = await new Promise<{
					key: Uint8Array;
					value: Uint8Array;
				} | null>((resolve, reject) => {
					it.next((err, key, value) => {
						if (err) reject(err);
						else if (key === undefined && value === undefined) resolve(null);
						else
							resolve({ key: key as Uint8Array, value: value as Uint8Array });
					});
				});
				if (!next) break;
				yield next;
			}
		} finally {
			it.end(() => {});
		}
	}
}
