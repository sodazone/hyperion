import { hashOwner } from "@/auth";
import {
	encodeCategorizedKey,
	encodeTaggedKey,
	encodeValue,
	PUBLIC_OWNER,
} from "@/db";
import { normalizeAddress } from "@/intel/mapping";
import { createTag } from "@/intel/mapping/tags";
import { KeyFamily } from "@/intel/types";
import type { Serve } from "@/server/serve";

type TestCategorizedRecord = {
	owner?: Uint8Array;
	networkId: number;
	address: string;
	categoryCode: number;
	subcategoryCode: number;
	meta?: Record<string, unknown>;
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

async function putTaggedTestRecord(srv: Serve, record: TestTaggedRecord) {
	const {
		owner,
		networkId,
		address,
		tagType,
		tagName,
		source = "test",
		version = 0,
	} = record;

	const { tagCode, tagValue } = createTag(tagType, tagName);

	await srv.db.put({
		key: encodeTaggedKey({
			family: KeyFamily.Tagged,
			owner,
			networkId,
			address: normalizeAddress(address),
			tagCode,
		}),
		value: encodeValue(
			{
				source,
				timestamp: Date.now(),
				version,
			},
			tagValue,
		),
	});
}

function createCategorizedRecord(record: TestCategorizedRecord) {
	const {
		owner,
		networkId,
		address,
		categoryCode,
		subcategoryCode,
		meta = {},
		source = "test",
		version = 0,
	} = record;

	return {
		key: encodeCategorizedKey({
			family: KeyFamily.Categorized,
			owner: owner ?? PUBLIC_OWNER,
			networkId,
			address: normalizeAddress(address),
			categoryCode,
			subcategoryCode,
		}),
		value: encodeValue(
			{
				source,
				timestamp: Date.now(),
				version,
			},
			meta,
		),
	};
}

async function putCategorizedTestRecord(
	srv: Serve,
	record: TestCategorizedRecord,
) {
	await srv.db.put(createCategorizedRecord(record));
}

export async function withTestData(srv: Serve) {
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
			await putCategorizedTestRecord(srv, record);
		} else {
			await putTaggedTestRecord(srv, record);
		}
	}
}
