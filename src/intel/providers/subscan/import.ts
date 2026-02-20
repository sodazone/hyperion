import { createEntitiesDB } from "@/db";
import { merkleSubscan } from "./runner";

const t0 = performance.now();

const db = await createEntitiesDB("./.db/current");

for (const job of merkleSubscan) {
	await job.run(db);
}

const t1 = performance.now();

db.close();

console.log("total time:", (t1 - t0).toFixed(1), "ms");
