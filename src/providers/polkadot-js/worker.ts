import { startWorker } from "@/worker";
import { parse } from "./parser";

startWorker({
	async parse(
		{ path }: { path: string },
		stream: { emitBatch: (b: unknown[]) => Promise<void> },
	) {
		try {
			const batch = [];
			let count = 0;

			for await (const record of parse(path)) {
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
			console.error("Error parsing data:", error);
			throw error;
		}
	},
});
