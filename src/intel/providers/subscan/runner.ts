import { config } from "@/config";
import type { Entity, HyperionDB } from "@/db";
import { NetworkMap } from "@/intel/mapping";
import { runWorker } from "@/intel/worker";
import { safePath } from "@/utils";
import { updateData } from "../update";
import { CHAINS, type SubscanChain } from "./chains";
import type { WorkerParams } from "./worker";

function createMerkleSubscan(chain: SubscanChain) {
	const dataDir = `${config.dataDir}/merkle-subscan/${chain.name}`;

	const update = async () => {
		const scriptPath = safePath(import.meta.url, "./update.sh");

		return updateData({
			scriptPath,
			env: {
				DATA_DIR: dataDir,
				URL: chain.subscanUrl,
				CHAIN: chain.name,
			},
		});
	};

	return {
		dataDir,

		update,

		run: async (api: HyperionDB) => {
			const updated = await update();
			if (!updated) return;

			const networkId = NetworkMap.fromURN(chain.urn);
			if (networkId === undefined) {
				throw new Error(`Network ID not found ${chain.urn}`);
			}

			await runWorker<Entity, WorkerParams>(
				new URL("./worker.ts", import.meta.url),
				{
					apiUrl: chain.subscanUrl,
					dataPath: dataDir,
					networkId,
				},
				async (batch) => {
					console.log(`[${chain.name}] writing ${batch.length} records`);
					api.upsertEntities(batch);
				},
			);
		},
	};
}

export const merkleSubscan = CHAINS.map(createMerkleSubscan);
