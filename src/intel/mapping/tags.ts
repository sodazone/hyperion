function bigintToUint8ArrayBE(value: bigint): Uint8Array {
	if (value === 0n) return new Uint8Array([0]);

	const bytes: number[] = [];
	while (value > 0n) {
		bytes.push(Number(value & 0xffn));
		value >>= 8n;
	}

	bytes.reverse();
	return Uint8Array.from(bytes);
}

export type TagValue = {
	name: string;
	type: string;
};

export function createTag(
	type: string,
	name: string,
): { tagCode: Uint8Array; tagValue: TagValue } {
	return {
		tagCode: hashTag(`${type}:${name}`),
		tagValue: {
			name,
			type,
		},
	};
}

export function hashTag(tag: string, seed: Uint8Array | bigint = BigInt(0)) {
	let bigintSeed: bigint;

	if (typeof seed === "bigint") {
		bigintSeed = seed & 0xffff_ffff_ffff_ffffn;
	} else {
		if (seed.byteLength < 8) {
			throw new Error("Seed Uint8Array must be at least 8 bytes");
		}
		const view = new DataView(seed.buffer, seed.byteOffset, seed.byteLength);
		bigintSeed = view.getBigUint64(0, false);
	}

	return bigintToUint8ArrayBE(Bun.hash.wyhash(tag, bigintSeed));
}
