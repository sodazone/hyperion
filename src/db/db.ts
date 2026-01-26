import { mkdir } from "node:fs/promises";
import { open, type RootDatabaseOptionsWithPath } from "lmdb";
import { hashAuth } from "@/auth";
import { CategoriesMap, NetworkMap } from "@/mapping";
import { normalizeAddress } from "@/mapping/address";
import { hashTag, type TagValue } from "@/mapping/tags";
import {
	type AddressCategory,
	type AddressTag,
	type Database,
	type HyperionRecord,
	KeyFamily,
} from "@/types";
import {
	decodeCategorizedKey,
	decodeTaggedKey,
	decodeValue,
	encodeCategorizedKey,
	encodeValue,
	makeCategoryPrefix,
	makePrefixEnd,
	makeTagPrefix,
} from "./encoding/codec";

export const METADATA_VERSION = 0;

export const PUBLIC_OWNER = hashAuth("HYPERION.PUBLIC");

export function isPublicOwner(owner: Uint8Array): boolean {
	if (owner.byteLength !== PUBLIC_OWNER.byteLength) return false;

	for (let i = 0; i < 32; i++) {
		if (owner[i] !== PUBLIC_OWNER[i]) return false;
	}
	return true;
}

export async function createDatabase(
	path?: string,
	// TODO
	_options?: RootDatabaseOptionsWithPath,
) {
	if (path !== undefined) await mkdir(path, { recursive: true });

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

function toAddressTag(key: Uint8Array, value: Uint8Array): AddressTag {
	const { networkId, tagCode } = decodeTaggedKey(key);
	const { name, type } = decodeValue<TagValue>(value).value;
	return {
		networkId,
		tag: { code: Buffer.from(tagCode).toString("hex"), name, type },
	};
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
		address: typeof address === "string" ? normalizeAddress(address) : address,
		categoryCode: categoryCode,
		subcategoryCode: subcategoryCode ?? 0,
	});
}

export function createHyperionDB(db: Database) {
	function hasTag({
		owner,
		address,
		tag,
		networkId,
	}: {
		owner?: Uint8Array | string;
		address: string;
		tag: string;
		networkId?: number;
	}): boolean {
		const ownerBytes =
			owner instanceof Uint8Array
				? owner
				: typeof owner === "string"
					? normalizeAddress(owner)
					: PUBLIC_OWNER;

		const addressBytes = normalizeAddress(address);
		const tagCode = hashTag(tag);

		const prefix = makeTagPrefix({
			owner: ownerBytes,
			address: addressBytes,
			tagCode,
			networkId,
		});

		if (networkId !== undefined) {
			return db.doesExist(prefix);
		}

		const endKey = makePrefixEnd(prefix);
		return db.getCount({ start: prefix, end: endKey, limit: 1 }) > 0;
	}

	function getTag({
		owner,
		address,
		tag,
		networkId,
	}: {
		owner?: Uint8Array | string;
		address: string;
		tag: string;
		networkId?: number;
	}) {
		const ownerBytes =
			owner instanceof Uint8Array
				? owner
				: typeof owner === "string"
					? normalizeAddress(owner)
					: PUBLIC_OWNER;

		const addressBytes = normalizeAddress(address);
		const tagCode = hashTag(tag);

		const prefix = makeTagPrefix({
			owner: ownerBytes,
			address: addressBytes,
			tagCode,
			networkId,
		});

		if (networkId !== undefined) {
			const value = db.get(prefix);
			return value === undefined ? undefined : toAddressTag(prefix, value);
		}

		const endKey = makePrefixEnd(prefix);

		for (const { key, value } of db.getRange({
			start: prefix,
			end: endKey,
			limit: 1,
		})) {
			return toAddressTag(key, value);
		}

		return undefined;
	}

	function getTags({
		owner,
		address,
		networkId,
	}: {
		owner?: Uint8Array | string;
		address: string;
		networkId?: number;
	}) {
		const ownerBytes =
			owner instanceof Uint8Array
				? owner
				: typeof owner === "string"
					? normalizeAddress(owner)
					: PUBLIC_OWNER;

		const addressBytes = normalizeAddress(address);

		const startPrefix = makeTagPrefix({
			owner: ownerBytes,
			address: addressBytes,
		});
		const endKey = makePrefixEnd(startPrefix);

		const tags: AddressTag[] = [];

		for (const { key, value } of db.getRange({
			start: startPrefix,
			end: endKey,
		})) {
			const decoded = toAddressTag(key, value);
			if (networkId === undefined || decoded.networkId === networkId) {
				tags.push(decoded);
			}
		}

		return tags;
	}

	async function deleteCategory({
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
	}) {
		const key = asOwnedCatKey({
			owner,
			networkId,
			address,
			categoryCode,
			subcategoryCode,
		});

		return await db.remove(key);
	}

	async function putCategory(
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
	) {
		const key = asOwnedCatKey({
			owner,
			networkId,
			address,
			categoryCode,
			subcategoryCode,
		});

		return await db.put(
			key,
			encodeValue(
				{
					source: "owner",
					timestamp: Date.now(),
					version: METADATA_VERSION,
				},
				value,
			),
		);
	}

	function getCategories({
		owner,
		address,
		networkId,
		categoryCode = 0,
		subcategoryCode = 0,
	}: {
		owner?: Uint8Array | string;
		networkId?: number;
		address: string;
		categoryCode?: number;
		subcategoryCode?: number;
	}): Array<AddressCategory> {
		const ownerBytes =
			owner instanceof Uint8Array
				? owner
				: typeof owner === "string"
					? normalizeAddress(owner)
					: PUBLIC_OWNER;

		const addressBytes = normalizeAddress(address);

		const prefix = makeCategoryPrefix({
			owner: ownerBytes,
			address: addressBytes,
			categoryCode,
			subcategoryCode,
			networkId,
		});

		const endKey = makePrefixEnd(prefix);

		const categories: Array<AddressCategory> = [];

		for (const { key } of db.getRange({ start: prefix, end: endKey })) {
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
	}

	function hasCategory({
		owner,
		networkId,
		address,
		categoryCode,
		subcategoryCode = 0,
	}: {
		owner?: Uint8Array | string;
		networkId?: number;
		address: string;
		categoryCode: number;
		subcategoryCode?: number;
	}): boolean {
		const ownerBytes =
			owner instanceof Uint8Array
				? owner
				: typeof owner === "string"
					? normalizeAddress(owner)
					: PUBLIC_OWNER;

		const addressBytes = normalizeAddress(address);

		const prefix = makeCategoryPrefix({
			owner: ownerBytes,
			address: addressBytes,
			categoryCode,
			subcategoryCode,
			networkId,
		});

		if (
			networkId !== undefined &&
			categoryCode !== 0 &&
			subcategoryCode !== 0
		) {
			return db.doesExist(prefix);
		}

		const endKey = makePrefixEnd(prefix);

		return (
			db.getCount({
				start: prefix,
				end: endKey,
				limit: 1,
			}) > 0
		);
	}

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
		putCategory,
		deleteCategory,
		getCategories,
		hasCategory,
		hasTag,
		getTag,
		getTags,
	};
}

export type HyperionDB = ReturnType<typeof createHyperionDB>;
