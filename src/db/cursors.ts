export const encodeCursor = (key: Uint8Array): string =>
	Buffer.from(key).toString("hex");

export const decodeCursor = (cursor?: string): Uint8Array | null => {
	if (!cursor) return null;
	try {
		return Buffer.from(cursor, "hex");
	} catch {
		return null;
	}
};
