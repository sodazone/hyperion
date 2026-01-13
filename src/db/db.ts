import { open } from "lmdb";
import { NetworkMap } from "@/maps";
import { addressTo32Bytes } from "@/maps/address";
import { type CategoryFamily, type Database, KeyFamily } from "@/types";
import { encodeCategorizedKey } from "./encoding/codec";

export function createDatabase(path: string) {
	const db = open<Uint8Array, Uint8Array>({
		path,
		compression: true,
		useVersions: false,
	});

	return db;
}

function makeEndKey(prefixKey: Uint8Array): Uint8Array {
	const endKey = new Uint8Array(prefixKey.length);
	endKey.set(prefixKey);
	endKey[endKey.length - 1] = 0xff; // largest possible byte
	return endKey;
}

function asCatKey({
	family,
	network,
	address,
	categoryCode,
	subcategoryCode,
}: {
	family?: CategoryFamily;
	network: number | string;
	address: string;
	categoryCode: number;
	subcategoryCode?: number;
}) {
	const networkId =
		typeof network === "string" ? NetworkMap.fromURN(network) : network;
	if (!networkId) {
		throw new Error("Invalid network");
	}
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

export function createHyperionApi(db: Database) {
	return {
		existsInCategory: ({
			family,
			network,
			address,
			categoryCode,
			subcategoryCode,
		}: {
			family?: CategoryFamily;
			network: number | string;
			address: string;
			categoryCode: number;
			subcategoryCode?: number;
		}): boolean => {
			const key = asCatKey({
				family,
				network,
				address,
				categoryCode,
				subcategoryCode,
			});
			if (subcategoryCode === undefined || subcategoryCode === 0) {
				return (
					db.getCount({
						start: key,
						end: makeEndKey(key),
						limit: 1,
					}) > 0
				);
			} else {
				return db.doesExist(key);
			}
		},
	};
}
