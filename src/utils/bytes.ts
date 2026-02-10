export function equals(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) {
		return false;
	}

	for (let i = 0; i < b.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
