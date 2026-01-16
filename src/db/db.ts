import { mkdir } from "node:fs/promises";
import { open, type RootDatabaseOptionsWithPath } from "lmdb";
import { CategoriesMap, NetworkMap } from "@/mapping";
import { addressTo32Bytes } from "@/mapping/address";
import { type Database, type HyperionRecord, KeyFamily } from "@/types";
import {
	decodeCategorizedKey,
	encodeCategorizedKey,
	encodeValue,
} from "./encoding/codec";

export const PUBLIC_OWNER = new Uint8Array(
	Bun.CryptoHasher.hash("sha256", "HYPERION.PUBLIC"),
);

export function isPublicOwner(owner: Uint8Array): boolean {
	if (owner.byteLength !== PUBLIC_OWNER.byteLength) return false;

	for (let i = 0; i < 32; i++) {
		if (owner[i] !== PUBLIC_OWNER[i]) return false;
	}
	return true;
}

export async function createDatabase(
	path: string,
	// TODO
	_options?: RootDatabaseOptionsWithPath,
) {
	await mkdir(path, { recursive: true });

	const db = open<Uint8Array, Uint8Array>({
		path,
		compression: true,
		useVersions: false,
		keyEncoding: "binary",
		// TODO for clustering
		// readOnly: true,
	});

	return db;
}

function makeEndKey(
	prefixKey: Uint8Array,
	overrideBytes: number,
	value = 0xff,
): Uint8Array {
	if (overrideBytes > prefixKey.length) {
		throw new Error("overrideBytes cannot exceed prefixKey length");
	}

	const endKey = new Uint8Array(prefixKey.length);
	endKey.set(prefixKey);

	for (let i = endKey.length - overrideBytes; i < endKey.length; i++) {
		endKey[i] = value;
	}

	return endKey;
}

function asCatKey({
	owner,
	networkId,
	address,
	categoryCode,
	subcategoryCode,
}: {
	owner?: string | Uint8Array;
	networkId: number;
	address: string;
	categoryCode: number;
	subcategoryCode?: number;
}) {
	const addressBytes =
		typeof address === "string" ? addressTo32Bytes(address) : address;

	return encodeCategorizedKey({
		owner: owner
			? typeof owner === "string"
				? addressTo32Bytes(owner)
				: owner
			: PUBLIC_OWNER,
		family: KeyFamily.Categorized,
		networkId,
		address: addressBytes,
		categoryCode,
		subcategoryCode: subcategoryCode ?? 0,
	});
}

function asOwnedCatKey({
	address,
	networkId,
	owner,
	categoryCode,
	subcategoryCode,
}: {
	owner: Uint8Array;
	networkId: number;
	address: Uint8Array | string;
	categoryCode: number;
	subcategoryCode?: number;
}) {
	if (isPublicOwner(owner)) {
		throw new Error("Writes to public owner space are forbidden");
	}

	return encodeCategorizedKey({
		owner,
		family: KeyFamily.Categorized,
		networkId,
		address: typeof address === "string" ? addressTo32Bytes(address) : address,
		categoryCode: categoryCode,
		subcategoryCode: subcategoryCode ?? 0,
	});
}

type AddressCat = {
	networkId: number;
	category: { code: number; label: string };
	subcategory: { code: number; label: string };
};

export function createHyperionApi(db: Database) {
	return {
		batch: async (batch: Array<HyperionRecord>) => {
			return await db.batch(() => {
				for (const { key, value } of batch) {
					db.put(key, value);
				}
			});
		},
		put: async ({ key, value }: HyperionRecord) => {
			return await db.put(key, value);
		},
		get: (key: Uint8Array): HyperionRecord | null => {
			const value = db.get(key);
			return value === undefined
				? null
				: {
						key,
						value,
					};
		},
		has: (key: Uint8Array): boolean => {
			return db.doesExist(key);
		},
		stats: () => {
			return db.getStats();
		},
		getCategoriesMeta: () => {
			return CategoriesMap.entries();
		},
		getNetworksMeta: () => {
			return NetworkMap.entries();
		},
		deleteCategory: async ({
			owner,
			networkId,
			address,
			categoryCode,
			subcategoryCode,
		}: {
			owner: Uint8Array;
			networkId: number;
			address: string;
			categoryCode: number;
			subcategoryCode: number;
		}) => {
			const key = asOwnedCatKey({
				owner,
				networkId,
				address,
				categoryCode,
				subcategoryCode,
			});

			return await db.remove(key);
		},
		putCategory: async (
			{
				owner,
				networkId,
				address,
				categoryCode,
				subcategoryCode,
			}: {
				owner: Uint8Array;
				networkId: number;
				address: string;
				categoryCode: number;
				subcategoryCode: number;
			},
			value: unknown,
		) => {
			const key = asOwnedCatKey({
				owner,
				networkId,
				address,
				categoryCode,
				subcategoryCode,
			});

			return await db.put(key, encodeValue(value));
		},
		getCategories: ({
			owner,
			networkId,
			address,
			categoryCode,
			subcategoryCode,
		}: {
			owner?: Uint8Array | string;
			networkId: number;
			address: string;
			categoryCode?: number;
			subcategoryCode?: number;
		}): Array<AddressCat> => {
			const prefixKey = asCatKey({
				owner,
				networkId,
				address,
				categoryCode: categoryCode ?? 0,
				subcategoryCode: subcategoryCode ?? 0,
			});

			const endKey = makeEndKey(prefixKey, networkId === 0 ? 6 : 4);

			const categories: Array<AddressCat> = [];

			for (const { key } of db.getRange({ start: prefixKey, end: endKey })) {
				const decoded = decodeCategorizedKey(key);
				categories.push({
					networkId: decoded.networkId,
					category: {
						code: decoded.categoryCode,
						label: CategoriesMap.getLabel(decoded.categoryCode) ?? "",
					},
					subcategory: {
						code: decoded.subcategoryCode,
						label:
							CategoriesMap.getLabel(
								decoded.categoryCode,
								decoded.subcategoryCode,
							) ?? "",
					},
				});
			}

			return categories;
		},
		existsInCategory: ({
			owner,
			networkId,
			address,
			categoryCode,
			subcategoryCode,
		}: {
			owner?: Uint8Array | string;
			networkId: number;
			address: string;
			categoryCode: number;
			subcategoryCode?: number;
		}): boolean => {
			const key = asCatKey({
				owner,
				networkId,
				address,
				categoryCode,
				subcategoryCode,
			});
			if (subcategoryCode === undefined || subcategoryCode === 0) {
				return (
					db.getCount({
						start: key,
						end: makeEndKey(key, 2),
						limit: 1,
					}) > 0
				);
			} else {
				return db.doesExist(key);
			}
		},
	};
}

export type HyperionApi = ReturnType<typeof createHyperionApi>;
