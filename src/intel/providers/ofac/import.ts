import { createHyperionDB } from "@/db";
import { ofac } from "./runner";

const t0 = performance.now();

const db = await createHyperionDB("./.db/current");

await ofac.run(db);

const t1 = performance.now();

await db.close();

console.log("total time:", (t1 - t0).toFixed(1), "ms");
