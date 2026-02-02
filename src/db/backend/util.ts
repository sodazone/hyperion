import { normalizeAddress } from "@/intel/mapping";

export function cleanFilter<T>(v: T | "*" | undefined): T | undefined {
	return v === "*" ? undefined : v;
}

export const b = (x: Uint8Array | string) =>
	Buffer.from(typeof x === "string" ? normalizeAddress(x) : x);
