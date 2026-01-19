import { unlink } from "node:fs/promises";

import { startWorker } from "@/worker";
import { fetchMerkleAccounts } from "./crawler";

export type WorkerParams = {
	apiUrl: string;
	dataPath: string;
	networkId: number;
};

startWorker({
	async parse(
		{ apiUrl, dataPath, networkId }: WorkerParams,
		stream: { emitBatch: (b: unknown[]) => Promise<void> },
	) {
		try {
			const batch = [];
			let count = 0;

			for await (const record of fetchMerkleAccounts({
				dataPath,
				apiUrl,
				networkId,
			})) {
				batch.push(record);
				count++;

				if (batch.length === 500) {
					await stream.emitBatch(batch.splice(0));
				}
			}

			if (batch.length) {
				await stream.emitBatch(batch);
			}

			return { records: count };
		} catch (error) {
			try {
				const fingerprintPath = `${dataPath}/subscan_merkle.fingerprint`;
				await unlink(fingerprintPath);
				console.warn(`[${networkId}] Removed fingerprint file due to failure`);
			} catch {
				// ignore
			}

			console.error(`[${networkId}] ${apiUrl} Error parsing data:`, error);
			throw error;
		}
	},
});
