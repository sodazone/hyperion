import { existsSync } from "node:fs";
import { config } from "@/config";
import { createEntitiesDB } from "@/db";
import { soda } from "./runner";

const file = process.argv[2];

if (file === undefined) {
	console.error("Please, provide a file path");
	process.exit(1);
}

if (!existsSync(file)) {
	console.error("File not found:", file);
	process.exit(1);
}

const db = await createEntitiesDB(config.dbPath);

const t0 = performance.now();

await soda.run(db, file);

const t1 = performance.now();

db.close();

console.log("total time:", (t1 - t0).toFixed(1), "ms");
