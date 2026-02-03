import fs from "node:fs";
import { type Category, type Entity, PUBLIC_OWNER, type Tag } from "@/db";
import { CAT, normalizeAddress } from "@/intel/mapping";
import { sanitize } from "@/intel/mapping/strings";

const NETWORK_POLKADOT = 0x0101;

function mapCategory(campaign: string): Category[] {
	const category = CAT.CYBERCRIME;
	const subcategory = 0x0005;

	return [
		{
			category,
			network: NETWORK_POLKADOT,
			subcategory,
			timestamp: Date.now(),
			source: "polkadot-js",
			version: 0,
			raw: campaign,
		},
	];
}

function mapDomainTag(domain: string): Tag[] {
	return [
		{
			tag: `phishing_domain:${sanitize(domain)}`,
			network: NETWORK_POLKADOT,
			timestamp: Date.now(),
			source: "polkadot-js",
			version: 0,
		},
	];
}

export function parse(path: string): Entity[] {
	const raw = fs.readFileSync(path, "utf8");
	const json = JSON.parse(raw) as Record<string, string[]>;

	const entities: Entity[] = [];

	for (const [domain, addresses] of Object.entries(json)) {
		if (!Array.isArray(addresses)) continue;

		for (const address of addresses) {
			try {
				const entity = {
					owner: PUBLIC_OWNER,
					address: normalizeAddress(address),
					address_formatted: address,
					categories: mapCategory(domain),
					tags: mapDomainTag(domain),
				};
				entities.push(entity);
			} catch (err) {
				console.warn(`Skipping invalid address ${address}:`, err);
			}
		}
	}

	return entities;
}
