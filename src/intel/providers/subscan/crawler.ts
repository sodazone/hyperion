import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { HyperionRecord } from "@/db/types";
import { toHyperionRecords } from "./mapping";

export interface MerkleAccount {
	account: {
		address: string;
		merkle: {
			address_type: string;
			tag_type: string;
			tag_subtype: string;
			tag_name: string;
		};
		people: Record<string, unknown>;
	};
	tag_name: string;
	address_type: string;
	tag_type: string;
	tag_sub_type: string;
	balance: string;
	locked: string;
	count_extrinsic: number;
}

interface SubscanResponse {
	code: number;
	message: string;
	generated_at: number;
	data: {
		count: number;
		list: MerkleAccount[];
	};
}

interface Checkpoint {
	totalCount: number;
	lastCompletedPage: number;
	uniqueCount: number;
	lastRun: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const checkpointFile = (dataPath: string) => join(dataPath, "checkpoint.json");

const readCheckpoint = async (dataPath: string): Promise<Checkpoint | null> => {
	try {
		return JSON.parse(await readFile(checkpointFile(dataPath), "utf8"));
	} catch {
		return null;
	}
};

const writeCheckpoint = async (dataPath: string, cp: Checkpoint) => {
	await mkdir(dataPath, { recursive: true });
	await writeFile(checkpointFile(dataPath), JSON.stringify(cp, null, 2));
};

const fetchPage =
	(apiUrl: string, row: number) =>
	async (page: number): Promise<SubscanResponse> => {
		await sleep(500);

		const res = await fetch(apiUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ page, row }),
		});

		if (!res.ok) {
			throw new Error(`HTTP ${res.status}`);
		}

		const json = (await res.json()) as SubscanResponse;

		if (json.code !== 0) {
			throw new Error(json.message);
		}

		return json;
	};

export async function* fetchMerkleAccounts({
	dataPath,
	apiUrl,
	networkId,
	row = 100,
}: {
	dataPath: string;
	apiUrl: string;
	networkId: number;
	row?: number;
}): AsyncGenerator<HyperionRecord> {
	const fetch = fetchPage(apiUrl, row);

	const first = await fetch(0);
	const totalCount = first.data.count;
	const totalPages = Math.ceil(totalCount / row);

	const checkpoint = await readCheckpoint(dataPath);

	const startPage =
		checkpoint && checkpoint.totalCount === totalCount
			? checkpoint.lastCompletedPage + 1
			: 0;

	let uniqueCount = checkpoint?.uniqueCount ?? 0;

	if (startPage === 0) {
		await writeCheckpoint(dataPath, {
			totalCount,
			lastCompletedPage: -1,
			uniqueCount: 0,
			lastRun: new Date().toISOString(),
		});
	}

	for (let page = startPage; page < totalPages; page++) {
		const response = page === 0 ? first : await fetch(page);

		for (const item of response.data.list) {
			uniqueCount++;
			yield* toHyperionRecords(networkId, item);
		}

		await writeCheckpoint(dataPath, {
			totalCount,
			lastCompletedPage: page,
			uniqueCount,
			lastRun: new Date().toISOString(),
		});

		console.log(
			`Page ${page}/${totalPages - 1} processed (+${response.data.list.length})`,
		);
	}
}
