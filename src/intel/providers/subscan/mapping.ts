import { type Category, type Entity, PUBLIC_OWNER, type Tag } from "@/db";
import { normalizeAddress } from "@/intel/mapping";
import { classifyPolkadotBalance } from "./balance";
import type { MerkleAccount } from "./crawler";

function createTag(prefix: string, text: string): { tag: string } {
	return {
		tag: `${prefix}:${text}`,
	};
}

type Classification =
	| { category: number; subcategory: number }
	| { tag: string };

function classify(
	networkId: number,
	account: MerkleAccount,
): Array<Classification> {
	const { tag_type, tag_sub_type, tag_name, address_type } = account;
	const classifications: Classification[] = [];

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
				category: 0x0001,
				subcategory: 0x0001,
			});
		} else if (tag_sub_type === "Optional KYC and AML") {
			classifications.push({
				category: 0x0001,
				subcategory: 0x0002,
			});
		} else if (tag_sub_type === "Inactive") {
			classifications.push({
				category: 0x0001,
				subcategory: 0x0003,
			});
		} else if (tag_sub_type === "OTC") {
			classifications.push({
				category: 0x0001,
				subcategory: 0x0004,
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
				category: 0x0006,
				subcategory: 0x0001,
			});
		} else if (tag_sub_type === "Custody") {
			classifications.push({
				category: 0x0006,
				subcategory: 0x0002,
			});
		} else {
			console.log("Unknown Service sub-type:", tag_sub_type);
			throw new Error(`Unknown Service sub-type: ${tag_sub_type}`);
			/*classifications.push({
        category: 0x0006,
        subcategory: 0x0000,
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
				category: 0x0007,
				subcategory: 0x0001,
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
				category: 0x0007,
				subcategory: 0x0000,
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

export function toHyperionEntity(network: number, item: MerkleAccount): Entity {
	const { account } = item;

	const address = normalizeAddress(account.address);
	const classifications = classify(network, item);

	const tags: Array<Tag> = [];
	const categories: Array<Category> = [];

	for (const classification of classifications) {
		if ("tag" in classification) {
			const { tag } = classification;

			tags.push({
				source: "subscan",
				network,
				tag,
				timestamp: Date.now(),
				version: 0,
			});
		} else {
			const { category, subcategory } = classification;
			categories.push({
				subcategory,
				category,
				source: "subscan",
				network,
				timestamp: Date.now(),
				version: 0,
			});
		}
	}

	return {
		owner: PUBLIC_OWNER,
		address,
		address_formatted: account.address,
		tags,
		categories,
	};
}
