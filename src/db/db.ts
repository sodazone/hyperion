import { open } from "lmdb";

export function createDatabase(path: string) {
	const db = open<Uint8Array, Uint8Array>({
		path,
		compression: true,
		useVersions: false,
	});

	return db;
}
