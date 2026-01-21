import { createDatabase, createHyperionDB } from "@/db";
import { polkadotJs } from "./runner";

const db = await createDatabase("./.db/current");

const t0 = performance.now();

await polkadotJs.run(createHyperionDB(db));

const t1 = performance.now();

await db.close();

console.log("total time:", (t1 - t0).toFixed(1), "ms");
