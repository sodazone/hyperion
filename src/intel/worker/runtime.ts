/// <reference lib="webworker" />

import type { StreamContext } from "./types";

type Handler<T, R> = (payload: T, stream: StreamContext) => Promise<R>;
type HandlerMap<T, R> = Record<string, Handler<T, R>>;

function serializeError(err: unknown) {
	if (err instanceof Error) {
		return { name: err.name, message: err.message, stack: err.stack };
	}
	return { name: "UnknownError", message: String(err) };
}

export function startWorker<T, R>(handlers: HandlerMap<T, R>) {
	const ctx: DedicatedWorkerGlobalScope =
		self as unknown as DedicatedWorkerGlobalScope;

	let awaitingAck: (() => void) | null = null;

	ctx.onmessage = async (
		ev: MessageEvent<{ method: string; payload: T } | string>,
	) => {
		if (ev.data === "ack" && awaitingAck) {
			awaitingAck();
			awaitingAck = null;
			return;
		}

		if (typeof ev.data === "string") {
			console.log("Received string message:", ev.data);
			return;
		}

		const { method, payload } = ev.data ?? {};
		if (!method) return;

		const handler = handlers[method];
		if (!handler) {
			ctx.postMessage({
				ok: false,
				error: { name: "UnknownCommand", message: `No handler for ${method}` },
			});
			return;
		}

		const stream: StreamContext = {
			emitBatch(batch) {
				ctx.postMessage({ type: "batch", batch });
				return new Promise<void>((resolve) => {
					awaitingAck = resolve;
				});
			},
			emitProgress(value) {
				ctx.postMessage({ type: "progress", value });
			},
		};

		try {
			const result = await handler(payload, stream);
			ctx.postMessage({ type: "done", ok: true, result });
		} catch (err) {
			ctx.postMessage({
				ok: false,
				error: serializeError(err),
			});
		}
	};
}
