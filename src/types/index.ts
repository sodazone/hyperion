import type { RootDatabase } from "lmdb";

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
export type TaggedKey = {
	family: KeyFamily;
	address: Uint8Array;
	networkId: number;
	tagCode: Uint8Array;
};
export type CategorizedKey = {
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

/**
 * value:
 * - sources: [
 *   - id: ofac
 *   - raw ...
 *   - confidence: xxx
 *   - updated: ts
 * ]
 *
 * Qs
 * is it an address beloging to a Sanction Entity? and in which jurisdiction, depends on the source...?
 * is it an address of interest? ---> custom category or tag?
 * -> address, network => map address to 32 bytes and network urn to 2 byte -> all categories
 * -> ^+ cat, subcat   => ...
 *
 */
