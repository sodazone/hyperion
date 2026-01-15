import { config } from "@/config";
import type { HyperionApi } from "@/db";
import type { HyperionRecord } from "@/types";
import { safePath } from "@/utils";
import { runWorker } from "@/worker";
import { updateData } from "../update";

const dataDir = `${config.dataDir}/ofac`;

export const ofac = {
	dataDir,
	update: async () => {
		const scriptPath = safePath(import.meta.url, "./update.sh");
		return updateData({ scriptPath, dataDir });
	},
	run: async (api: HyperionApi) => {
		//const updated = await ofac.update();
		//if (updated) {
		await runWorker<HyperionRecord>(
			new URL("./worker.ts", import.meta.url),
			{ path: `${dataDir}/SDN_ADVANCED.XML` },
			async (batch) => {
				console.log("Writing batch of", batch.length, "records");
				await api.batch(batch);
				console.log("Batch written");
			},
		);
		//}
	},
};
