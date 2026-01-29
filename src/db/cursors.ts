import type { Cursor } from "./types";

export const encodeCursor = (key: Uint8Array): Cursor =>
	Buffer.from(key).toString("base64");

export const decodeCursor = (cursor?: Cursor): Uint8Array | null => {
	if (!cursor) return null;
	try {
		return Buffer.from(cursor, "base64");
	} catch {
		return null;
	}
};
