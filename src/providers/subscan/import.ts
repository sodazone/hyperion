import { createDatabase, createHyperionApi } from "@/db";
import { merkleSubscan } from "./runner";

const db = await createDatabase("./.db/current");

const t0 = performance.now();

const api = createHyperionApi(db);

for (const job of merkleSubscan) {
	await job.run(api);
}

const t1 = performance.now();

await db.close();

console.log("total time:", (t1 - t0).toFixed(1), "ms");
