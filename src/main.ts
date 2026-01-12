import { AsyncRocksDB } from "./db";
import { ofac } from "./providers";

const db = new AsyncRocksDB("./.db/current");
await db.open();

const t0 = performance.now();

await ofac.run(db);

const t1 = performance.now();

await db.close();

console.log("total time:", (t1 - t0).toFixed(1), "ms");
