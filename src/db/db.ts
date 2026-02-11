import { mkdir } from "node:fs/promises";
import { hashAuth } from "@/auth";
import { CategoriesMap, NetworkMap } from "@/intel/mapping";
import { AlertingDB } from "./backend/sqlite/alerting.db";
import { EntitiesDB } from "./backend/sqlite/entities.db";

export const METADATA_VERSION = 0;
export const PUBLIC_OWNER = hashAuth("HYPERION.PUBLIC");

export function isPublicOwner(owner: Uint8Array): boolean {
	if (owner.byteLength !== PUBLIC_OWNER.byteLength) return false;
	for (let i = 0; i < 32; i++) {
		if (owner[i] !== PUBLIC_OWNER[i]) return false;
	}
	return true;
}

export async function createEntitiesDB(path: string) {
	if (path === ":memory:") return new EntitiesDB(":memory:");

	await mkdir(path, { recursive: true });
	return new EntitiesDB(`${path}/entities.sqlite`);
}

export async function createAlertingDB(path: string) {
	if (path === ":memory:") return new AlertingDB(":memory:");

	await mkdir(path, { recursive: true });
	return new AlertingDB(`${path}/alerts.sqlite`);
}

export async function createHyperionDB(path: string) {
	const entities = await createEntitiesDB(path);
	const alerting = await createAlertingDB(path);

	return {
		entities,
		alerting,
		meta: {
			getNetworksMeta: () => NetworkMap.entries(),
			getCategoriesMeta: () => CategoriesMap.entries(),
		},
		close: async () => {
			await Promise.all([entities.close(), alerting.close()]);
		},
	};
}

export type HyperionDB = Awaited<ReturnType<typeof createHyperionDB>>;
