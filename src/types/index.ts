import type RocksDB from "rocksdb";

export type Tag = {
	name: string;
	source: string;
	owner: string;
	confidence: number;
};

export type Classifier = Tag & {
	code: Uint8Array;
};

export type Category = Classifier & {
	subcategory?: Classifier;
};

export type Entity = {
	id: string;
	source: string;
	owner: string;
	confidence: number;
	name?: string;
	aliases?: string[];
};

export type CryptoAddressEntry = {
	chainId: string;
	address: string;
	entities?: Entity[];
	categories: Category[];
	tags?: Classifier[];
};

export const KeyFamily = {
	CategorizedPublic: 0x01,
	CategorizedPrivate: 0x02,
	TaggedPublic: 0x03,
	TaggedPrivate: 0x04,
} as const;

export type KeyFamily = (typeof KeyFamily)[keyof typeof KeyFamily];
export type CryptoAddressKey = Uint8Array;

export interface SourceParser<T = unknown> {
	name: string;
	parse(path: string): Promise<T[]>;
}

export type Database = RocksDB;
export type HyperionRecord = {
	key: Uint8Array;
	value: Uint8Array;
};
