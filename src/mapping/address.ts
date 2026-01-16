import bs58 from "bs58";

export function base58ToBytes(addr: string): Uint8Array {
	return bs58.decode(addr);
}

export function hexToBytes(hex: string): Uint8Array {
	if (hex.length % 2) hex = `0${hex}`;
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseInt(hex.substring(i * 2, 2), 16);
	}
	return bytes;
}

export function addressTo32Bytes(address: string): Uint8Array {
	try {
		let addressBytes: Uint8Array;

		if (address.startsWith("0x")) {
			addressBytes = hexToBytes(address.slice(2));
		} else if (/^[0-9a-fA-F]{64}$/.test(address)) {
			// 32-byte raw hex
			addressBytes = Uint8Array.from(Buffer.from(address, "hex"));
		} else {
			try {
				addressBytes = base58ToBytes(address);
			} catch {
				// fallback CashAddr payload or unknown format
				addressBytes = Bun.CryptoHasher.hash("sha256", address);
			}
		}

		if (addressBytes.length !== 32) {
			const tmp = new Uint8Array(32);
			tmp.set(addressBytes.slice(0, 32));
			addressBytes = tmp;
		}

		return addressBytes;
	} catch (error) {
		throw new Error(`While decoding ${address}`, { cause: error });
	}
}
