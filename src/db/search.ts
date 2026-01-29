import type { RangeOptions } from "lmdb";
import {
	decodeCategorizedKey,
	decodeValue,
	makePrefixEnd,
} from "@/intel/encoding/codec";
import { NetworkMap, normalizeAddress } from "@/intel/mapping";
import { KeyFamily } from "@/intel/types";
import { decodeCursor, encodeCursor } from "./cursors";
import { PUBLIC_OWNER } from "./db";
import type { Database } from "./types";

export function keyAfter(key: Uint8Array): Uint8Array {
	const out = Uint8Array.from(key);

	for (let i = out.length - 1; i >= 0; i--) {
		const v = out[i];
		if (v !== undefined && v < 0xff) {
			out[i] = v + 1;
			return out;
		}
		out[i] = 0x00;
	}

	return Uint8Array.from([...out, 0x00]);
}

export const createSearchApi = (db: Database) => {
	function findEntities({
		owner,
		networkId,
		categoryCode,
		limit = 25,
		cursor,
		searchPrefix,
	}: {
		owner?: Uint8Array | string;
		networkId?: number;
		categoryCode?: number;
		limit?: number;
		cursor?: string;
		searchPrefix?: string;
	}) {
		const ownerBytes =
			owner instanceof Uint8Array
				? owner
				: typeof owner === "string"
					? normalizeAddress(owner)
					: PUBLIC_OWNER;

		const prefix = new Uint8Array(33);
		prefix.set(ownerBytes, 0);
		prefix[32] = KeyFamily.Categorized;

		const prefixEnd = makePrefixEnd(prefix);

		let startKey: Uint8Array;
		if (cursor) {
			const decoded = decodeCursor(cursor);
			if (!decoded) {
				startKey = prefix;
			} else {
				startKey = keyAfter(decoded);
			}
		} else {
			startKey = prefix;
		}

		const range: RangeOptions = {
			start: startKey,
			end: prefixEnd,
			reverse: false,
		};

		const searchBytes = searchPrefix
			? normalizeAddress(searchPrefix)
			: undefined;

		const seen = new Map<
			string,
			{ address: string; networks: Set<string>; categories: Set<number> }
		>();

		let lastKey: Uint8Array | undefined;

		for (const { key, value } of db.getRange(range)) {
			const decodedKey = decodeCategorizedKey(key);
			const addressBytes = decodedKey.address;

			if (
				searchBytes &&
				!addressBytes
					.slice(0, searchBytes.length)
					.every((b, i) => b === searchBytes[i])
			) {
				continue;
			}

			if (networkId !== undefined && decodedKey.networkId !== networkId)
				continue;
			if (
				categoryCode !== undefined &&
				decodedKey.categoryCode !== categoryCode
			)
				continue;

			const id = `0x${Buffer.from(addressBytes).toString("hex")}`;

			if (!seen.has(id)) {
				seen.set(id, {
					address: decodeValue(value).value.canonical.address,
					networks: new Set(),
					categories: new Set(),
				});
			}

			const entry = seen.get(id);
			if (entry === undefined) continue;

			entry.categories.add(decodedKey.categoryCode ?? 0);

			const urn = decodedKey.networkId
				? NetworkMap.toURN(decodedKey.networkId)
				: undefined;
			if (urn) entry.networks.add(urn);

			lastKey = key;

			if (seen.size === limit) break;
		}

		const rows = Array.from(seen.values()).map((r) => ({
			id: r.address,
			address: r.address,
			networks: Array.from(r.networks),
			categories: Array.from(r.categories),
		}));

		return {
			rows,
			cursorNext: lastKey ? encodeCursor(lastKey) : undefined,
		};
	}

	return { findEntities };
};
