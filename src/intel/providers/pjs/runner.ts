import { config } from "@/config";
import type { Entity } from "@/db";
import type { EntitiesDB } from "@/db/backend/sqlite/entities.db";
import { runWorker } from "@/intel/worker";
import { safePath } from "@/utils";
import { updateData } from "../update";

const dataDir = `${config.dataDir}/polkadot-js`;

export const polkadotJs = {
	dataDir,
	update: async () => {
		const scriptPath = safePath(import.meta.url, "./update.sh");
		return updateData({ scriptPath, env: { DATA_DIR: dataDir } });
	},
	run: async (db: EntitiesDB) => {
		const updated = await polkadotJs.update();
		if (updated) {
			await runWorker<Entity>(
				new URL("./worker.ts", import.meta.url),
				{ path: `${dataDir}/polkadot-phishing-addresses.json` },
				async (batch) => {
					console.log("Writing batch of", batch.length, "records");
					db.upsertEntities(batch);
					console.log("Batch written");
				},
			);
		}
	},
};
