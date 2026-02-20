import { createEntitiesDB } from "@/db";
import { soda } from "./runner";

const db = await createEntitiesDB("./.db/current");

const t0 = performance.now();

await soda.run(db);

const t1 = performance.now();

db.close();

console.log("total time:", (t1 - t0).toFixed(1), "ms");
