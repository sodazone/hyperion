const allowedCodes = [
	...Array.from({ length: 26 }, (_, i) => 65 + i), // A-Z
	...Array.from({ length: 26 }, (_, i) => 97 + i), // a-z
	...Array.from({ length: 10 }, (_, i) => 48 + i), // 0-9
	46, // .
	58, // :
	32, // space
];

export function safeString(input: any): string {
	if (typeof input !== "string" || input.trim() === "") {
		return "";
	}

	let sanitizedInput = "";

	for (let i = 0; i < input.length; i++) {
		const charCode = input.charCodeAt(i);
		if (allowedCodes.includes(charCode)) {
			sanitizedInput += input[i];
		}
	}

	return sanitizedInput.trim();
}

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
