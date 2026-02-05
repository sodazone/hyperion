export function safeStringify(obj: unknown, space?: number) {
	return JSON.stringify(
		obj,
		(_key, value) => {
			if (typeof value === "bigint") {
				return value.toString();
			}

			if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
				const buf =
					value instanceof ArrayBuffer ? new Uint8Array(value) : value;
				return `0x${[...buf].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
			}

			return value;
		},
		space,
	);
}
