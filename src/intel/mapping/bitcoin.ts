import { bech32 } from "@scure/base";
import bs58 from "bs58";

export type NormalizedBitcoinAddress = {
	hash: Uint8Array;
	addrType: "p2pkh" | "p2sh" | "p2wpkh" | "p2wsh" | "p2tr";
};

type Bech32String = `${string}1${string}`;

function decodeBech32(
	addr: Bech32String,
): { version: number; program: Uint8Array } | null {
	try {
		const { prefix, words } = bech32.decode(addr);
		if (prefix !== "bc") return null;
		const version = words[0];
		if (version === undefined) return null;
		const program = bech32.fromWords(words.slice(1));
		return { version, program };
	} catch {
		return null;
	}
}

export function normalizeBitcoinAddress(
	addr: string,
): NormalizedBitcoinAddress | null {
	if (addr.startsWith("1") || addr.startsWith("3")) {
		// Legacy P2PKH or P2SH
		let payload: Uint8Array;
		try {
			payload = bs58.decode(addr);
		} catch {
			return null;
		}
		if (payload.length !== 25) return null;

		const hash = payload.slice(1, 21);
		const addrType: NormalizedBitcoinAddress["addrType"] = addr.startsWith("1")
			? "p2pkh"
			: "p2sh";
		return { hash, addrType };
	}

	if (addr.toLowerCase().startsWith("bc1")) {
		const decoded = decodeBech32(addr as Bech32String);
		if (!decoded) return null;

		const { version, program } = decoded;
		if (program.length === 20) {
			return {
				hash: program,
				addrType: "p2wpkh",
			};
		}
		if (program.length === 32) {
			const type: "p2tr" | "p2wsh" = version === 1 ? "p2tr" : "p2wsh";
			return { hash: program, addrType: type };
		}
		return null;
	}

	return null;
}
