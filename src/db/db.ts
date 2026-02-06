import { mkdir } from "node:fs/promises";
import { hashAuth } from "@/auth";
import { CategoriesMap, NetworkMap } from "@/intel/mapping";
import { AlertsDB } from "./backend/sqlite/alerts.db";
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

export async function createAlertsDB(path: string) {
	if (path === ":memory:") return new AlertsDB(":memory:");

	await mkdir(path, { recursive: true });
	return new AlertsDB(`${path}/alerts.sqlite`);
}

export async function createHyperionDB(path: string) {
	const entities = await createEntitiesDB(path);
	const alerts = await createAlertsDB(path);

	return {
		entities,
		alerts,
		meta: {
			getNetworksMeta: () => NetworkMap.entries(),
			getCategoriesMeta: () => CategoriesMap.entries(),
		},
		close: async () => {
			await Promise.all([entities.close(), alerts.close()]);
		},
	};
}

export type HyperionDB = Awaited<ReturnType<typeof createHyperionDB>>;
