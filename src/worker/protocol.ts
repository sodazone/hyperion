export type WorkerRequest<T> = {
	cmd: string;
	payload: T;
};

export type WorkerResponse<R = unknown> =
	| { type: "result"; ok: true; result: R }
	| { type: "batch"; batch: unknown[] }
	| { type: "progress"; value: number }
	| { type: "done" }
	| { ok: false; error: { name: string; message: string; stack?: string } };

export type StreamContext = {
	emitBatch(batch: unknown[]): Promise<void>;
	emitProgress(value: number): void;
};
