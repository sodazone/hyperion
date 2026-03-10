import fs from "node:fs";
import { type Entity, PUBLIC_OWNER } from "@/db";
import { CAT, NetworkMap, normalizeAddress } from "@/intel/mapping";
import { sanitizeRelaxed } from "@/utils/strings";
import type { SubstrateAccountMetadata } from "./types";

const source = "soda";
const version = 0;

export function parse(path: string): Entity[] {
	const raw = fs.readFileSync(path, "utf8");
	const json = JSON.parse(raw) as SubstrateAccountMetadata[];

	const entities: Entity[] = [];

	for (const account of json) {
		const address = account.publicKey;
		const address_formatted = account.accountId;
		const timestamp = account.updatedAt;

		try {
			const categories = account.categories.map((c) => ({
				category: c.categoryCode,
				network: NetworkMap.fromURN(c.chainId) ?? 0,
				subcategory: c.subCategoryCode ?? 0,
				timestamp,
				source,
				version,
			}));

			const tags = account.tags.map((t) => ({
				tag: t.tag,
				network: NetworkMap.fromURN(t.chainId) ?? 0,
				timestamp,
				source,
				version,
			}));

			if (account.identities?.length) {
				for (const identity of account.identities) {
					const id = identity.display ?? Object.values(identity.extra).at(0);
					tags.push({
						tag: `name:${sanitizeRelaxed(id)}`,
						network: NetworkMap.fromURN(identity.chainId) ?? 0,
						timestamp,
						source,
						version,
					});
				}

				const chainId = account.identities[0]?.chainId;
				if (chainId !== undefined) {
					categories.push({
						category: CAT.IDENTIFIED,
						subcategory: 0x0001,
						network: NetworkMap.fromURN(chainId) ?? 0,
						timestamp,
						source,
						version,
					});
				}
			}

			if (tags.length > 0 || categories.length > 0) {
				const entity = {
					owner: PUBLIC_OWNER,
					address: normalizeAddress(address),
					address_formatted,
					categories,
					tags,
				};
				entities.push(entity);
			}
		} catch (err) {
			console.warn(`Skipping invalid address ${address}:`, err);
		}
	}

	return entities;
}
