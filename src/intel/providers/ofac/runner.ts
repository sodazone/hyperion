import { config } from "@/config";
import type { HyperionDB } from "@/db";
import type { Entity } from "@/db/model";
import { runWorker } from "@/intel/worker";
import { safePath } from "@/utils";
import { updateData } from "../update";

const dataDir = `${config.dataDir}/ofac`;

export const ofac = {
	dataDir,
	update: async () => {
		const scriptPath = safePath(import.meta.url, "./update.sh");
		return updateData({ scriptPath, env: { DATA_DIR: dataDir } });
	},
	run: async (api: HyperionDB) => {
		const updated = await ofac.update();
		if (updated) {
			await runWorker<Entity>(
				new URL("./worker.ts", import.meta.url),
				{ path: `${dataDir}/SDN_ADVANCED.XML` },
				async (batch) => {
					console.log("Writing batch of", batch.length, "records");
					api.entities.upsertEntities(batch);
					console.log("Batch written");
				},
			);
		}
	},
};
