import {
	type CategorizedKey,
	type CryptoAddressKey,
	type HyperionRecord,
	KeyFamily,
	type TaggedKey,
} from "@/types";

const BE = false;
const CATEGORIZED_KEY_LENGTH = 71;
const TAG_KEY_PREFIX_LENGTH = 67;

/**
 * Encode a categorized key
 * Schema:
 * 32 byte Owner
 * 1 byte  Key Family
 * 32 bytes Address
 * 2 bytes Network ID (BE)
 * 2 bytes Category Code (BE)
 * 2 bytes Subcategory Code (BE)
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

	const key = new Uint8Array(CATEGORIZED_KEY_LENGTH);
	key.set(owner, 0);
	key[32] = family;
	key.set(address, 33);

	const dv = new DataView(key.buffer, key.byteOffset, key.byteLength);
	dv.setUint16(65, networkId, BE);
	dv.setUint16(67, categoryCode, BE);
	dv.setUint16(69, subcategoryCode, BE);

	return key;
}

/**
 * Encode a tagged key
 * Schema:
 * 32 byte Owner
 * 1 byte  Key Family
 * 32 bytes Address
 * 2 bytes Network ID (BE)
 * Tag code (variable, max 100 bytes)
 */
export function encodeTaggedKey({
	owner,
	address,
	tagCode,
	family,
	networkId,
}: TaggedKey): CryptoAddressKey {
	if (owner.length !== 32) throw new Error("Owner hash must be 32 bytes");
	if (address.length !== 32) throw new Error("Address must be 32 bytes");
	if (tagCode.length > 100) throw new Error("Tag code max length is 100 bytes");

	const key = new Uint8Array(TAG_KEY_PREFIX_LENGTH + tagCode.length);
	key.set(owner, 0);
	key[32] = family;
	key.set(address, 33);

	const dv = new DataView(key.buffer, key.byteOffset, key.byteLength);
	dv.setUint16(65, networkId, BE);

	key.set(tagCode, 67);
	return key;
}

/**
 * Decode a categorized key
 */
export function decodeCategorizedKey(key: Uint8Array): CategorizedKey {
	if (!key || key.length !== CATEGORIZED_KEY_LENGTH)
		throw new Error("Invalid categorized key length");

	const dv = new DataView(key.buffer, key.byteOffset, key.byteLength);
	const owner = key.subarray(0, 32);
	const family = key[32] as KeyFamily;
	const address = key.subarray(33, 65);
	const networkId = dv.getUint16(65, BE);
	const categoryCode = dv.getUint16(67, BE);
	const subcategoryCode = dv.getUint16(69, BE);

	return {
		owner,
		family,
		address,
		networkId,
		categoryCode,
		subcategoryCode,
	};
}

/**
 * Decode a tagged key
 */
export function decodeTaggedKey(key: Uint8Array): TaggedKey {
	if (!key || key.length < TAG_KEY_PREFIX_LENGTH)
		throw new Error("Invalid tagged key length");

	const dv = new DataView(key.buffer, key.byteOffset, key.byteLength);
	const owner = key.subarray(0, 32);
	const family = key[32] as KeyFamily;
	const address = key.subarray(33, 65);
	const networkId = dv.getUint16(65, BE);
	const tagCode = key.subarray(67);

	return { owner, family, address, networkId, tagCode };
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encodeValue(v: unknown): Uint8Array {
	const json = JSON.stringify(v);
	return encoder.encode(json);
}

export function decodeValue<T>(v: Uint8Array): T {
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
		value: decodeValue(r.value) as V,
	};
}
