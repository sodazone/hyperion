import {
	type CategorizedKey,
	type CryptoAddressKey,
	type HyperionRecord,
	KeyFamily,
	type TaggedKey,
} from "@/types";

const BE = false;
const CATEGORIZED_KEY_LENGTH = 39;

/**
 * Encode a categorized key
 * Schema:
 * 1 byte  Key Family
 * 32 bytes Address
 * 2 bytes Network ID (BE)
 * 2 bytes Category Code (BE)
 * 2 bytes Subcategory Code (BE)
 */
export function encodeCategorizedKey({
	family,
	address,
	networkId,
	categoryCode,
	subcategoryCode,
}: CategorizedKey): CryptoAddressKey {
	if (address.length !== 32) throw new Error("Address must be 32 bytes");

	const key = new Uint8Array(CATEGORIZED_KEY_LENGTH);
	key[0] = family;
	key.set(address, 1);

	const dv = new DataView(key.buffer, key.byteOffset, key.byteLength);
	dv.setUint16(33, networkId, BE);
	dv.setUint16(35, categoryCode, BE);
	dv.setUint16(37, subcategoryCode, BE);

	return key;
}

/**
 * Encode a tagged key
 * Schema:
 * 1 byte  Key Family
 * 32 bytes Address
 * 2 bytes Network ID (BE)
 * Tag code (variable, max 100 bytes)
 */
export function encodeTaggedKey({
	address,
	tagCode,
	family,
	networkId,
}: TaggedKey): CryptoAddressKey {
	if (address.length !== 32) throw new Error("Address must be 32 bytes");
	if (tagCode.length > 100) throw new Error("Tag code max length is 100 bytes");

	const key = new Uint8Array(35 + tagCode.length);
	key[0] = family;
	key.set(address, 1);

	const dv = new DataView(key.buffer, key.byteOffset, key.byteLength);
	dv.setUint16(33, networkId, BE);

	key.set(tagCode, 35);
	return key;
}

/**
 * Decode a categorized key
 */
export function decodeCategorizedKey(key: Uint8Array): CategorizedKey {
	if (!key || key.length !== CATEGORIZED_KEY_LENGTH)
		throw new Error("Invalid categorized key length");

	const dv = new DataView(key.buffer, key.byteOffset, key.byteLength);
	const family = key[0] as KeyFamily;
	const address = key.subarray(1, 33);
	const networkId = dv.getUint16(33, BE);
	const categoryCode = dv.getUint16(35, BE);
	const subcategoryCode = dv.getUint16(37, BE);

	return { family, address, networkId, categoryCode, subcategoryCode };
}

/**
 * Decode a tagged key
 */
export function decodeTaggedKey(key: Uint8Array): TaggedKey {
	if (!key || key.length < 35) throw new Error("Invalid tagged key length");

	const dv = new DataView(key.buffer, key.byteOffset, key.byteLength);
	const family = key[0] as KeyFamily;
	const address = key.subarray(1, 33);
	const networkId = dv.getUint16(33, BE);
	const tagCode = key.subarray(35);

	return { family, address, networkId, tagCode };
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
	console.log(typeof k, k);
	const f = k.at(0);
	if (f === KeyFamily.CategorizedPublic || f === KeyFamily.CategorizedPrivate) {
		return decodeCategorizedKey(k);
	} else if (f === KeyFamily.TaggedPublic || f === KeyFamily.TaggedPrivate) {
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
