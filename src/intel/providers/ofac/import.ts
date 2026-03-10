import { config } from "@/config";
import { createEntitiesDB } from "@/db";
import { ofac } from "./runner";

const t0 = performance.now();

const db = await createEntitiesDB(config.dbPath);

await ofac.run(db);

const t1 = performance.now();

db.close();

console.log("total time:", (t1 - t0).toFixed(1), "ms");
