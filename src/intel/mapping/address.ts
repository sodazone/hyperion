import bs58 from "bs58";
import { normalizeBitcoinAddress } from "./bitcoin";

function normalizeSS58Address(decoded: Uint8Array): Uint8Array {
	const base = decoded[0];
	if (base === undefined) {
		throw new Error("Invalid input");
	}
	const prefixLen = base & 0x40 ? 2 : 1;
	return decoded.subarray(prefixLen, decoded.length - 2);
}

function looksLikeBitcoin(address: string): boolean {
	const lower = address.toLowerCase();
	const len = address.length;

	if ((address[0] === "1" || address[0] === "3") && len >= 26 && len <= 35)
		return true;
	if (
		(lower.startsWith("bc1") || lower.startsWith("tb1")) &&
		len >= 14 &&
		len <= 74
	)
		return true;

	return false;
}

function looksLikeSS58(decodedLength: number, addressLength: number): boolean {
	return (
		addressLength >= 46 &&
		addressLength <= 50 &&
		(decodedLength === 35 || decodedLength === 36)
	);
}

function hexToBytes(hex: string): Uint8Array {
	const len = hex.length;
	const out = new Uint8Array(len / 2);
	for (let i = 0; i < len; i += 2) {
		const hi = hexCharToNibble(hex.charCodeAt(i));
		const lo = hexCharToNibble(hex.charCodeAt(i + 1));
		out[i / 2] = (hi << 4) | lo;
	}
	return out;
}

function hexCharToNibble(c: number): number {
	// '0'-'9'
	if (c >= 48 && c <= 57) return c - 48;
	// 'A'-'F'
	if (c >= 65 && c <= 70) return c - 65 + 10;
	// 'a'-'f'
	if (c >= 97 && c <= 102) return c - 97 + 10;
	throw new Error(`Invalid hex char: ${String.fromCharCode(c)}`);
}

function to32Bytes(bytes: Uint8Array): Uint8Array {
	if (bytes.length === 32) return bytes;
	const out = new Uint8Array(32);
	if (bytes.length > 32) {
		out.set(bytes.subarray(0, 32));
	} else {
		out.set(bytes, 32 - bytes.length); // left pad
	}
	return out;
}

export function normalizeAddress(address: string): Uint8Array {
	const addr = address.trim();
	const len = addr.length;

	// 0. 0x-prefixed hex string
	if (addr.startsWith("0x") && (len === 42 || len === 66)) {
		const bytes = hexToBytes(addr.slice(2));
		return to32Bytes(bytes);
	}

	// 1. Bitcoin
	if (looksLikeBitcoin(addr)) {
		try {
			const naddr = normalizeBitcoinAddress(addr);
			if (naddr)
				return naddr.hash.length === 32 ? naddr.hash : to32Bytes(naddr.hash);
		} catch {
			// fallback
		}
	}

	// 2. SS58
	let decoded: Uint8Array | null = null;
	try {
		decoded = bs58.decode(addr);
	} catch {
		decoded = null;
	}

	if (decoded && looksLikeSS58(decoded.length, len)) {
		return normalizeSS58Address(decoded);
	}

	// 3. Unknown / fallback
	if (decoded === null) {
		decoded = Bun.CryptoHasher.hash("sha256", addr);
	}

	return to32Bytes(decoded);
}
