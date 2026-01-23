import fs from "node:fs";
import {
	encodeCategorizedKey,
	encodeTaggedKey,
	encodeValue,
	PUBLIC_OWNER,
} from "@/db";
import { CAT, normalizeAddress } from "@/mapping";
import { createTag } from "@/mapping/tags";
import { type HyperionRecord, KeyFamily } from "@/types";

const NETWORK_POLKADOT = 0x0101;

function mapCategory(address: string, campaign: string) {
	const addressBytes = normalizeAddress(address);
	const family = KeyFamily.Categorized;
	const categoryCode = CAT.CYBERCRIME;
	const subcategoryCode = 0x0005;

	const key = encodeCategorizedKey({
		owner: PUBLIC_OWNER,
		family,
		address: addressBytes,
		networkId: NETWORK_POLKADOT,
		categoryCode,
		subcategoryCode,
	});

	return {
		key,
		value: encodeValue(
			{
				source: "polkadot-js",
				timestamp: Date.now(),
				version: 0,
			},
			{
				campaign,
			},
		),
	};
}

function mapDomainTag(address: string, domain: string): HyperionRecord {
	const addressBytes = normalizeAddress(address);
	const { tagCode, tagValue } = createTag("phishing_domain", domain);
	const key = encodeTaggedKey({
		owner: PUBLIC_OWNER,
		address: addressBytes,
		family: KeyFamily.Tagged,
		networkId: NETWORK_POLKADOT,
		tagCode,
	});

	return {
		key,
		value: encodeValue(
			{
				source: "polkadot-js",
				timestamp: Date.now(),
				version: 0,
			},
			tagValue,
		),
	};
}

export function parse(path: string): HyperionRecord[] {
	const raw = fs.readFileSync(path, "utf8");
	const json = JSON.parse(raw) as Record<string, string[]>;

	const records: HyperionRecord[] = [];

	for (const [domain, addresses] of Object.entries(json)) {
		if (!Array.isArray(addresses)) continue;

		for (const address of addresses) {
			try {
				records.push(mapCategory(address, domain));
				records.push(mapDomainTag(address, domain));
			} catch (err) {
				console.warn(`Skipping invalid address ${address}:`, err);
			}
		}
	}

	return records;
}
