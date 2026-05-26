export function createWriteQueue() {
	let queue: Promise<any> = Promise.resolve();

	return <T>(task: () => Promise<T>): Promise<T> => {
		queue = queue.then(task).catch(console.error);
		return queue;
	};
}

export type WriteQueue = ReturnType<typeof createWriteQueue>;
