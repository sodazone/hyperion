export async function runWorker<T, P = unknown>(
	workerUrl: URL,
	payload: P,
	onBatch: (batch: T[]) => Promise<void>,
) {
	const worker = new Worker(workerUrl, { type: "module" });

	return new Promise<void>((resolve, reject) => {
		worker.onmessage = async (event) => {
			try {
				if (event.data.type === "batch") {
					await onBatch(event.data.batch);
					worker.postMessage("ack");
				}

				if (event.data.type === "done") {
					worker.terminate();
					resolve();
				}
			} catch (err) {
				worker.terminate();
				reject(err);
			}
		};

		worker.onerror = (err) => {
			worker.terminate();
			reject(err);
		};

		worker.postMessage({ method: "parse", payload });
	});
}
