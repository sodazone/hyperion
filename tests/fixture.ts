import { hashOwner } from "@/auth";
import { PUBLIC_OWNER } from "@/db";
import { normalizeAddress } from "@/intel/mapping";
import type { Serve } from "@/server/serve";

type TestCategorizedRecord = {
	owner?: Uint8Array;
	networkId: number;
	address: string;
	categoryCode: number;
	subcategoryCode: number;
	raw?: Record<string, unknown>;
	source?: string;
	version?: number;
};

type TestTaggedRecord = {
	owner: Uint8Array;
	networkId: number;
	address: string;
	tagType: string;
	tagName: string;
	meta?: Record<string, unknown>;
	source?: string;
	version?: number;
};

type TestRecord = TestCategorizedRecord | TestTaggedRecord;

function putTaggedTestRecord(srv: Serve, record: TestTaggedRecord) {
	const {
		owner,
		networkId,
		address,
		tagType,
		tagName,
		source = "test",
		version = 0,
	} = record;

	srv.db.entities.upsertEntities([
		{
			address: normalizeAddress(address),
			address_formatted: address,
			owner,
			tags: [
				{
					network: networkId,
					timestamp: Date.now(),
					version,
					source,
					tag: `${tagType}:${tagName}`,
				},
			],
		},
	]);
}

function createCategorizedRecord(record: TestCategorizedRecord) {
	const {
		owner,
		networkId,
		address,
		categoryCode,
		subcategoryCode,
		raw = {},
		source = "test",
		version = 0,
	} = record;

	return {
		address: normalizeAddress(address),
		address_formatted: address,
		owner: owner ?? PUBLIC_OWNER,
		categories: [
			{
				timestamp: Date.now(),
				version,
				source,
				network: networkId,
				category: categoryCode,
				subcategory: subcategoryCode,
				raw,
			},
		],
	};
}

function putCategorizedTestRecord(srv: Serve, record: TestCategorizedRecord) {
	srv.db.entities.upsertEntities([createCategorizedRecord(record)]);
}

export function withTestData(srv: Serve) {
	const records: TestRecord[] = [
		{
			owner: PUBLIC_OWNER,
			networkId: 1,
			address: "14FscqFT8S8W8emC5294cEpDctgAucJW7C99mpxS4cucpHoA",
			categoryCode: 1,
			subcategoryCode: 1,
			meta: { test: true },
		},
		{
			owner: PUBLIC_OWNER,
			networkId: 1,
			address: "14FscqFT8S8W8emC5294cEpDctgAucJW7C99mpxS4cucpHoA",
			categoryCode: 1,
			subcategoryCode: 2,
			meta: { label: "alt-subcat" },
		},
		{
			owner: PUBLIC_OWNER,
			networkId: 1,
			address: "14FscqFT8S8W8emC5294cEpDctgAucJW7C99mpxS4cucpHoA",
			tagType: "phishing-domain",
			tagName: "example.com",
		},
		{
			owner: hashOwner("did:test|user"),
			networkId: 1,
			address: "14FscqFT8S8W8emC5294cEpDctgAucJW7C99mpxS4cucpHoA",
			categoryCode: 2,
			subcategoryCode: 1,
			meta: { private: true },
		},
	];

	for (const record of records) {
		if ("categoryCode" in record) {
			putCategorizedTestRecord(srv, record);
		} else {
			putTaggedTestRecord(srv, record);
		}
	}
}
