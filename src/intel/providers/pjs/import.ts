import { config } from "@/config";
import { createEntitiesDB } from "@/db";
import { polkadotJs } from "./runner";

const db = await createEntitiesDB(config.dbPath);

const t0 = performance.now();

await polkadotJs.run(db);

const t1 = performance.now();

db.close();

console.log("total time:", (t1 - t0).toFixed(1), "ms");
