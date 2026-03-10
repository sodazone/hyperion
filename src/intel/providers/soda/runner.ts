import { config } from "@/config";
import type { Entity } from "@/db";
import type { EntitiesDB } from "@/db/backend/sqlite/entities.db";
import { runWorker } from "@/intel/worker";

const dataDir = `${config.dataDir}/soda`;

export const soda = {
	dataDir,
	update: async () => {
		//const scriptPath = safePath(import.meta.url, "./update.sh");
		//return updateData({ scriptPath, env: { DATA_DIR: dataDir } });
	},
	run: async (db: EntitiesDB, dataFile: string) => {
		//const updated = await soda.update();
		//if (updated) {
		await runWorker<Entity>(
			new URL("./worker.ts", import.meta.url),
			{ path: dataFile },
			async (batch) => {
				console.log("Writing batch of", batch.length, "records");
				db.upsertEntities(batch);
				//for (const b of batch) {
				//	db.deleteEntity({ owner: PUBLIC_OWNER, address: b.address });
				//}
				console.log("Batch written");
			},
		);
		// }
	},
};
