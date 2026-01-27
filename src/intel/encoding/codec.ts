import type {
	HyperionMetadata,
	HyperionRecord,
	HyperionValue,
} from "@/db/types";
import {
	type CategorizedKey,
	type CryptoAddressKey,
	KeyFamily,
	type TaggedKey,
} from "../types";

const ENDIANNESS = false;
const CATEGORIZED_KEY_LENGTH = 71;
const TAGGED_KEY_LENGTH = 99;

/**
 * Encode a categorized key
 * Schema:
 * 32 bytes Owner
 * 1 byte  Key Family
 * 32 bytes Address
 * 2 bytes Category Code (BE)
 * 2 bytes Subcategory Code (BE)
 * 2 bytes Network ID (BE)
 */
export function encodeCategorizedKey({
	owner,
	family,
	address,
	networkId,
	categoryCode,
	subcategoryCode,
}: CategorizedKey): CryptoAddressKey {
	if (owner.length !== 32) throw new Error("Owner must be 32 bytes");
	if (address.length !== 32) throw new Error("Address must be 32 bytes");

	const key = new Uint8Array(71);
	key.set(owner, 0);
	key[32] = family;
	key.set(address, 33);

	const dv = new DataView(key.buffer, key.byteOffset, key.byteLength);
	dv.setUint16(65, categoryCode, ENDIANNESS);
	dv.setUint16(67, subcategoryCode, ENDIANNESS);
	dv.setUint16(69, networkId, ENDIANNESS);

	return key;
}

/**
 * Encode a tagged key (fixed 32-byte tagCode)
 * Schema:
 * 32 bytes Owner
 * 1 byte  Key Family
 * 32 bytes Address
 * 32 bytes Tag Code (padded with zeros if shorter)
 * 2 bytes Network ID (BE)
 */
export function encodeTaggedKey({
	owner,
	address,
	tagCode,
	family = KeyFamily.Tagged,
	networkId,
}: TaggedKey): CryptoAddressKey {
	if (owner.length !== 32) throw new Error("Owner must be 32 bytes");
	if (address.length !== 32) throw new Error("Address must be 32 bytes");
	if (tagCode.length > 32) throw new Error("Tag code max 32 bytes");

	const key = new Uint8Array(99);
	key.set(owner, 0);
	key[32] = family;
	key.set(address, 33);

	key.set(tagCode, 65);

	const dv = new DataView(key.buffer, key.byteOffset, key.byteLength);
	dv.setUint16(97, networkId, ENDIANNESS);

	return key;
}

export function makeTagPrefix({
	owner,
	address,
	tagCode,
	family = KeyFamily.Tagged,
	networkId,
}: {
	owner: Uint8Array;
	address: Uint8Array;
	tagCode?: Uint8Array;
	family?: KeyFamily;
	networkId?: number;
}): Uint8Array {
	const base = new Uint8Array(65);
	base.set(owner, 0);
	base[32] = family;
	base.set(address, 33);

	if (!tagCode || tagCode.length === 0) {
		return base;
	}

	const tagPrefix = new Uint8Array(97);
	tagPrefix.set(base, 0);
	tagPrefix.set(tagCode, 65);

	if (networkId === undefined) {
		return tagPrefix;
	}

	const full = new Uint8Array(99);
	full.set(tagPrefix, 0);
	const dv = new DataView(full.buffer);
	dv.setUint16(97, networkId, ENDIANNESS);

	return full;
}

export function makeCategoryPrefix({
	owner,
	address,
	categoryCode,
	subcategoryCode,
	networkId,
}: {
	owner: Uint8Array;
	address: Uint8Array;
	categoryCode: number;
	subcategoryCode: number;
	networkId?: number;
}): Uint8Array {
	const base = new Uint8Array(65);
	base.set(owner, 0);
	base[32] = KeyFamily.Categorized;
	base.set(address, 33);

	if (categoryCode === 0) {
		return base;
	}

	const withCategory = new Uint8Array(67);
	withCategory.set(base, 0);
	{
		const dv = new DataView(withCategory.buffer);
		dv.setUint16(65, categoryCode, ENDIANNESS);
	}

	if (subcategoryCode === 0) {
		return withCategory;
	}

	const withSubcategory = new Uint8Array(69);
	withSubcategory.set(withCategory, 0);
	{
		const dv = new DataView(withSubcategory.buffer);
		dv.setUint16(67, subcategoryCode, ENDIANNESS);
	}

	if (networkId === undefined) {
		return withSubcategory;
	}

	const full = new Uint8Array(71);
	full.set(withSubcategory, 0);
	{
		const dv = new DataView(full.buffer);
		dv.setUint16(69, networkId, ENDIANNESS);
	}

	return full;
}

export function makePrefixEnd(prefix: Uint8Array): Uint8Array {
	const end = new Uint8Array(prefix.length + 1);
	end.set(prefix, 0);
	end[prefix.length] = 0xff;
	return end;
}

export function decodeCategorizedKey(key: Uint8Array): CategorizedKey {
	if (!key || key.length !== CATEGORIZED_KEY_LENGTH)
		throw new Error("Invalid categorized key length");

	const dv = new DataView(key.buffer, key.byteOffset, key.byteLength);
	const owner = key.subarray(0, 32);
	const family = key[32] as KeyFamily;
	const address = key.subarray(33, 65);
	const categoryCode = dv.getUint16(65, ENDIANNESS);
	const subcategoryCode = dv.getUint16(67, ENDIANNESS);
	const networkId = dv.getUint16(69, ENDIANNESS);

	return {
		owner,
		family,
		address,
		networkId,
		categoryCode,
		subcategoryCode,
	};
}

export function decodeTaggedKey(key: Uint8Array): TaggedKey {
	if (!key || key.length !== TAGGED_KEY_LENGTH)
		throw new Error("Invalid tagged key length");

	const dv = new DataView(key.buffer, key.byteOffset, key.byteLength);
	const owner = key.subarray(0, 32);
	const family = key[32] as KeyFamily;
	const address = key.subarray(33, 65);
	const tagCode = key.subarray(65, 97);
	const networkId = dv.getUint16(97, ENDIANNESS);

	return { owner, family, address, networkId, tagCode };
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encodeValue(
	metadata: HyperionMetadata,
	value: unknown,
): Uint8Array {
	const json = JSON.stringify({ metadata, value });
	return encoder.encode(json);
}

export function decodeValue<T>(v: Uint8Array): HyperionValue<T> {
	return JSON.parse(decoder.decode(v));
}

export function decodeKey(k: Uint8Array) {
	const f = k.at(32);
	if (f === KeyFamily.Categorized) {
		return decodeCategorizedKey(k);
	} else if (f === KeyFamily.Tagged) {
		return decodeTaggedKey(k);
	}
}

export function decodeRecord<K = CategorizedKey | TaggedKey, V = unknown>(
	r: HyperionRecord,
) {
	return {
		key: decodeKey(r.key) as K,
		value: decodeValue(r.value) as HyperionValue<V>,
	};
}
