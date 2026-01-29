import type { ReactNode } from "react";
import {
	type RenderToReadableStreamOptions,
	renderToReadableStream,
} from "react-dom/server";

export async function render(
	children: ReactNode,
	opts?: RenderToReadableStreamOptions,
) {
	const stream = await renderToReadableStream(children, opts);
	return new Response(stream, {
		headers: { "Content-Type": "text/html" },
	});
}
