export function encodeTag(tag: string, seed: Uint8Array | bigint) {
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

	return Bun.hash.wyhash(tag, bigintSeed);
}
