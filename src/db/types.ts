import type { RootDatabase } from "lmdb";

export type Cursor = string;
export type Database = RootDatabase<Uint8Array, Uint8Array>;
export type HyperionMetadata = {
	source: string;
	timestamp: number;
	version: number;
};
export type HyperionValue<T = unknown> = {
	canonical: { address: string };
	data: T;
};
export type HyperionEnvelope<T = unknown> = {
	metadata: HyperionMetadata;
	value: HyperionValue<T>;
};
export type HyperionRecord = {
	key: Uint8Array;
	value: Uint8Array;
};
