import type { RootDatabase } from "lmdb";

export type Tag = {
	name: string;
	source: string;
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
	Categorized: 0x01,
	Tagged: 0x02,
} as const;

export type KeyFamily = (typeof KeyFamily)[keyof typeof KeyFamily];
export type CategoryFamily = 1 | 2;
export type TagFamily = 3 | 4;
export type CryptoAddressKey = Uint8Array;
export type TaggedKey = {
	owner: Uint8Array;
	family: KeyFamily;
	address: Uint8Array;
	networkId: number;
	tagCode: Uint8Array;
};
export type CategorizedKey = {
	owner: Uint8Array;
	family: KeyFamily;
	address: Uint8Array;
	networkId: number;
	categoryCode: number;
	subcategoryCode: number;
};

export interface SourceParser<T = unknown> {
	name: string;
	parse(path: string): Promise<T[]>;
}

export type Database = RootDatabase<Uint8Array, Uint8Array>;
export type HyperionRecord = {
	key: Uint8Array;
	value: Uint8Array;
};
