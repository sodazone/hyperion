export function hashOwner(owner: string) {
	return hashAuth(`OC.HYPERION_OWNER.${owner}`);
}

export function hashAuth(payload: string) {
	return new Uint8Array(Bun.CryptoHasher.hash("sha256", payload));
}
