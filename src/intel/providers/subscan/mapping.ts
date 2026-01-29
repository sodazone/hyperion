import {
	encodeCategorizedKey,
	encodeTaggedKey,
	encodeValue,
	PUBLIC_OWNER,
} from "@/db";
import type { HyperionRecord } from "@/db/types";
import { normalizeAddress } from "@/intel/mapping";
import { createTag } from "@/intel/mapping/tags";
import { KeyFamily } from "@/intel/types";
import { classifyPolkadotBalance } from "./balance";
import type { MerkleAccount } from "./crawler";

function makeMerkleValue(address: string, value: unknown) {
	return encodeValue(
		{
			source: "subscan",
			timestamp: Date.now(),
			version: 0,
		},
		{
			canonical: {
				address,
			},
			data: value,
		},
	);
}

function classify(
	networkId: number,
	account: MerkleAccount,
): Array<
	| {
			categoryCode: number;
			subcategoryCode: number;
	  }
	| { tagCode: Uint8Array; tagValue: unknown }
> {
	const { tag_type, tag_sub_type, tag_name, address_type } = account;
	const classifications = [];

	if (account.count_extrinsic > 10_000) {
		classifications.push(createTag("tx_class", "high_count"));
	}

	if (networkId >= 0x0100 && networkId <= 0x0103) {
		const balanceClass = classifyPolkadotBalance(account.balance);
		classifications.push(createTag("balance_class", balanceClass));
	}

	// Exchange
	if (tag_type === "Exchange") {
		if (tag_sub_type === "Mandatory KYC and AML") {
			classifications.push({
				categoryCode: 0x0001,
				subcategoryCode: 0x0001,
			});
		} else if (tag_sub_type === "Optional KYC and AML") {
			classifications.push({
				categoryCode: 0x0001,
				subcategoryCode: 0x0002,
			});
		} else if (tag_sub_type === "Inactive") {
			classifications.push({
				categoryCode: 0x0001,
				subcategoryCode: 0x0003,
			});
		} else if (tag_sub_type === "OTC") {
			classifications.push({
				categoryCode: 0x0001,
				subcategoryCode: 0x0004,
			});
		} else {
			console.log("Unknown Exchange sub-type:", tag_sub_type);
			throw new Error(`Unknown Exchange sub-type: ${tag_sub_type}`);
			/*classifications.push({
        categoryCode: 0x0001,
        subcategoryCode: 0x0000,
      });*/
		}

		if (tag_name) {
			classifications.push(createTag("exchange_name", tag_name));
		}

		if (address_type) {
			classifications.push(createTag("address_type", address_type));
		}

		return classifications;
	}
	// Service
	else if (tag_type === "Service") {
		if (tag_sub_type === "Financial Service") {
			classifications.push({
				categoryCode: 0x0006,
				subcategoryCode: 0x0001,
			});
		} else if (tag_sub_type === "Custody") {
			classifications.push({
				categoryCode: 0x0006,
				subcategoryCode: 0x0002,
			});
		} else {
			console.log("Unknown Service sub-type:", tag_sub_type);
			throw new Error(`Unknown Service sub-type: ${tag_sub_type}`);
			/*classifications.push({
        categoryCode: 0x0006,
        subcategoryCode: 0x0000,
      });*/
		}

		if (tag_name) {
			classifications.push(createTag("service_name", tag_name));
		}

		if (address_type) {
			classifications.push(createTag("address_type", address_type));
		}

		return classifications;
	}
	// High Risk Organization
	else if (tag_type === "High Risk Organization") {
		if (tag_sub_type === "High Risk Exchanges") {
			classifications.push({
				categoryCode: 0x0007,
				subcategoryCode: 0x0001,
			});
			if (tag_name) {
				classifications.push(createTag("exchange_name", tag_name));
			}
		} else {
			console.log("Unknown High Risk Organization sub-type:", tag_sub_type);
			throw new Error(
				`Unknown High Risk Organization sub-type: ${tag_sub_type}`,
			);
			/*classifications.push({
				categoryCode: 0x0007,
				subcategoryCode: 0x0000,
			});*/
		}

		if (tag_name) {
			classifications.push(createTag("organization_name", tag_name));
		}

		if (address_type) {
			classifications.push(createTag("address_type", address_type));
		}

		return classifications;
	}

	throw new Error(
		`Unknown tag type n:${tag_name} t:${tag_type} a:${address_type} JSON: ${JSON.stringify(account)}`,
	);
}

export function toHyperionRecords(
	networkId: number,
	item: MerkleAccount,
): Array<HyperionRecord> {
	const { account } = item;

	const records = [];
	const address = normalizeAddress(account.address);
	const classifications = classify(networkId, item);

	for (const classification of classifications) {
		if ("tagCode" in classification) {
			const family = KeyFamily.Tagged;
			const { tagCode } = classification;

			const key = encodeTaggedKey({
				owner: PUBLIC_OWNER,
				family,
				address,
				networkId,
				tagCode,
			});

			const value = makeMerkleValue(account.address, classification.tagValue);
			records.push({
				key,
				value,
			});
		} else {
			const family = KeyFamily.Categorized;
			const { categoryCode, subcategoryCode } = classification;

			const key = encodeCategorizedKey({
				owner: PUBLIC_OWNER,
				family,
				address,
				networkId,
				categoryCode,
				subcategoryCode,
			});

			const value = makeMerkleValue(account.address, {
				name: item.tag_name,
				subType: item.tag_sub_type,
				type: item.tag_type,
			});

			records.push({
				key,
				value,
			});
		}
	}

	return records;
}
