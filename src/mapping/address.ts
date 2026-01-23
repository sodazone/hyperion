import bs58 from "bs58";
import { normalizeBitcoinAddress } from "./bitcoin";

function normalizeSS58Address(address: string): Uint8Array {
	const decoded = bs58.decode(address);
	const firstByte = decoded[0];
	if (firstByte !== undefined) {
		const prefixLen = firstByte & 0x40 ? 2 : 1;
		return decoded.subarray(prefixLen, decoded.length - 2);
	} else {
		throw new Error("Invalid address");
	}
}

function looksLikeBitcoin(address: string): boolean {
	const lower = address.toLowerCase();

	// Legacy + P2SH
	if (
		(address.startsWith("1") || address.startsWith("3")) &&
		address.length >= 26 &&
		address.length <= 35
	)
		return true;

	// Bech32 mainnet/testnet
	if (
		(lower.startsWith("bc1") || lower.startsWith("tb1")) &&
		lower.length >= 14 &&
		lower.length <= 74
	)
		return true;

	return false;
}

function looksLikeSS58(address: string): boolean {
	if (address.length >= 46 && address.length <= 50) {
		let decoded: Uint8Array;
		try {
			decoded = bs58.decode(address);
		} catch {
			return false;
		}

		// SS58 is always 35 or 36 bytes when decoded
		if (decoded.length !== 35 && decoded.length !== 36) {
			return false;
		}

		const possiblePrefixLen = decoded.length - 32 - 2; // 1 or 2
		if (possiblePrefixLen !== 1 && possiblePrefixLen !== 2) {
			return false;
		}

		return true;
	} else {
		return false;
	}
}

function addressToBytesGeneric(address: string): Uint8Array {
	if (address.startsWith("0x")) {
		return Uint8Array.from(Buffer.from(address.slice(2), "hex"));
	}

	if (/^[0-9a-fA-F]{40,64}$/.test(address)) {
		return Uint8Array.from(Buffer.from(address, "hex"));
	}

	try {
		return bs58.decode(address);
	} catch {
		// Fallback: hash of the string
		return Bun.CryptoHasher.hash("sha256", address);
	}
}

function to32Bytes(bytes: Uint8Array): Uint8Array {
	if (bytes.length === 32) return bytes;

	const out = new Uint8Array(32);

	if (bytes.length > 32) {
		out.set(bytes.slice(0, 32));
	} else {
		out.set(bytes, 32 - bytes.length);
	}

	return out;
}

export function normalizeAddress(address: string): Uint8Array {
	const addr = address.trim();

	// 0. Hex string with prefix
	if (address.startsWith("0x")) {
		return to32Bytes(addressToBytesGeneric(address));
	}

	// 1. Bitcoin
	if (looksLikeBitcoin(addr)) {
		try {
			const naddr = normalizeBitcoinAddress(addr);
			if (naddr !== null) {
				if (naddr.hash.length === 32) return naddr.hash;
				return to32Bytes(naddr.hash);
			}
		} catch {
			//
		}
	}

	// 2. SS58
	if (looksLikeSS58(addr)) {
		try {
			return normalizeSS58Address(addr);
		} catch {
			//
		}
	}

	// 3. Hex / Base58 / Unknown
	const rawBytes = addressToBytesGeneric(addr);
	return to32Bytes(rawBytes);
}
