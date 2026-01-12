import type { CryptoAddressKey, KeyFamily } from "@/types";

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
export function encodeCategorizedKey(
	family: KeyFamily,
	address: Buffer<ArrayBufferLike> | Uint8Array,
	networkId: number,
	categoryCode: number,
	subcategoryCode: number,
): CryptoAddressKey {
	if (address.length !== 32) throw new Error("Address must be 32 bytes");

	const key = new Uint8Array(CATEGORIZED_KEY_LENGTH);
	key[0] = family;
	key.set(address, 1);

	const dv = new DataView(key.buffer, key.byteOffset, key.byteLength);
	dv.setUint16(33, networkId, BE);
	dv.setUint16(35, categoryCode, BE);
	dv.setUint16(37, subcategoryCode, BE);

	return Buffer.from(key);
}

/**
 * Encode a tagged key
 * Schema:
 * 1 byte  Key Family
 * 32 bytes Address
 * 2 bytes Network ID (BE)
 * Tag code (variable, max 100 bytes)
 */
export function encodeTaggedKey(
	family: KeyFamily,
	address: Buffer<ArrayBufferLike> | Uint8Array,
	networkId: number,
	tagCode: Buffer<ArrayBufferLike> | Uint8Array,
): CryptoAddressKey {
	if (address.length !== 32) throw new Error("Address must be 32 bytes");
	if (tagCode.length > 100) throw new Error("Tag code max length is 100 bytes");

	const key = new Uint8Array(35 + tagCode.length);
	key[0] = family;
	key.set(address, 1);

	const dv = new DataView(key.buffer, key.byteOffset, key.byteLength);
	dv.setUint16(33, networkId, BE);

	key.set(tagCode, 35);
	return Buffer.from(key);
}

/**
 * Decode a categorized key
 */
export function decodeCategorizedKey(key: Buffer<ArrayBufferLike>) {
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
export function decodeTaggedKey(key: Buffer<ArrayBufferLike>) {
	if (!key || key.length < 35) throw new Error("Invalid tagged key length");

	const dv = new DataView(key.buffer, key.byteOffset, key.byteLength);
	const family = key[0] as KeyFamily;
	const address = key.subarray(1, 33);
	const networkId = dv.getUint16(33, BE);
	const tagCode = key.subarray(35);

	return { family, address, networkId, tagCode };
}
