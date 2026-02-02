import { mkdir } from "node:fs/promises";
import { hashAuth } from "@/auth";
import { CategoriesMap, NetworkMap } from "@/intel/mapping";
import { AddressDB } from "./backend/sqlite";

export const METADATA_VERSION = 0;
export const PUBLIC_OWNER = hashAuth("HYPERION.PUBLIC");

export function isPublicOwner(owner: Uint8Array): boolean {
	if (owner.byteLength !== PUBLIC_OWNER.byteLength) return false;
	for (let i = 0; i < 32; i++) {
		if (owner[i] !== PUBLIC_OWNER[i]) return false;
	}
	return true;
}

export async function createAddressDatabase(path: string) {
	if (path === ":memory:") return new AddressDB(":memory:");

	if (path !== undefined) await mkdir(path, { recursive: true });
	const db = new AddressDB(`${path}/entity_index.sqlite`);
	return db;
}

export async function createHyperionDB(path: string) {
	const db = await createAddressDatabase(path);

	return {
		putCategory: db.upsertCategory.bind(db),
		deleteCategory: db.deleteCategory.bind(db),
		getCategories: db.queryCategories.bind(db),
		hasCategory: db.hasCategory.bind(db),
		putTag: db.upsertTag.bind(db),
		getTags: db.queryTags.bind(db),
		hasTag: db.hasTag.bind(db),
		batchUpsert: db.batchUpsert.bind(db),
		search: {
			findEntities: db.queryEntities.bind(db),
		},
		getNetworksMeta: () => NetworkMap.entries(),
		getCategoriesMeta: () => CategoriesMap.entries(),
		close: async () => db.close(),
	};
}

export type HyperionDB = Awaited<ReturnType<typeof createHyperionDB>>;
