import { open, type RootDatabaseOptionsWithPath } from "lmdb";
import { CategoriesMap, NetworkMap } from "@/maps";
import { addressTo32Bytes } from "@/maps/address";
import { type CategoryFamily, type Database, KeyFamily } from "@/types";
import { decodeCategorizedKey, encodeCategorizedKey } from "./encoding/codec";

export function createDatabase(
	path: string,
	// TODO
	_options?: RootDatabaseOptionsWithPath,
) {
	const db = open<Uint8Array, Uint8Array>({
		path,
		compression: true,
		useVersions: false,
		// TODO for clustering
		readOnly: true,
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
	family,
	networkId,
	address,
	categoryCode,
	subcategoryCode,
}: {
	family?: CategoryFamily;
	networkId: number;
	address: string;
	categoryCode: number;
	subcategoryCode?: number;
}) {
	const addressBytes =
		typeof address === "string" ? addressTo32Bytes(address) : address;

	return encodeCategorizedKey({
		family: family ?? KeyFamily.CategorizedPublic,
		networkId,
		address: addressBytes,
		categoryCode,
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
		getCategoriesMeta: () => {
			return CategoriesMap.entries();
		},
		getNetworksMeta: () => {
			return NetworkMap.entries();
		},
		getCategories: ({
			family,
			networkId,
			address,
			categoryCode,
			subcategoryCode,
		}: {
			family?: CategoryFamily;
			networkId: number;
			address: string;
			categoryCode?: number;
			subcategoryCode?: number;
		}): Array<AddressCat> => {
			const prefixKey = asCatKey({
				family,
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
			family,
			networkId,
			address,
			categoryCode,
			subcategoryCode,
		}: {
			family?: CategoryFamily;
			networkId: number;
			address: string;
			categoryCode: number;
			subcategoryCode?: number;
		}): boolean => {
			const key = asCatKey({
				family,
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
