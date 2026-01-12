import { hyperionDB } from "./db";
import { ofac } from "./providers";

const db = await hyperionDB.openDatabase("./.db/current");

const t0 = performance.now();

await ofac.run(db);

const t1 = performance.now();

hyperionDB.closeDatabase(db);

console.log("total time:", (t1 - t0).toFixed(1), "ms");
