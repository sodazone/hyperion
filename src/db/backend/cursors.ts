export const entityCursor = {
	encode(key: Uint8Array): string {
		return Buffer.from(key).toString("hex");
	},
	decode(cursor: string): Uint8Array | null {
		if (!cursor) return null;
		try {
			return Buffer.from(cursor, "hex");
		} catch {
			return null;
		}
	},
};

export type AlertCursor = {
	ts: number;
	id: number;
};

export const alertCursor = {
	encode(c: AlertCursor): string {
		return Buffer.from(JSON.stringify(c)).toString("base64url");
	},
	decode(s: string): AlertCursor {
		return JSON.parse(Buffer.from(s, "base64url").toString());
	},
};
