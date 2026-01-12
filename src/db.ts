import rocksdb from "rocksdb";

// TODO maybe wrap it in an async way... for gets batches etc...
// or use other bindings
async function openDatabase(dbPath: string): Promise<rocksdb> {
  return new Promise<rocksdb>((resolve, reject) => {
    const db = rocksdb(dbPath);
    db.open({ createIfMissing: true }, (err) =>
      err ? reject(err) : resolve(db),
    );
  });
}

async function closeDatabase(db: rocksdb) {
  return new Promise<void>((resolve, reject) => {
    db.close((err) => (err ? reject(err) : resolve()));
  });
}

export const hyperionDB = { openDatabase, closeDatabase };
