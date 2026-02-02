export interface Meta {
	timestamp: number;
	version: number;
	source?: string;
	raw?: unknown;
}

export interface Tag extends Meta {
	network: number;
	tag: string;
}

export interface Category extends Meta {
	network: number;
	category: number;
	subcategory: number;
}

export interface Entity {
	owner: Uint8Array;
	address: Uint8Array;
	address_formatted: string;

	tags?: Tag[];
	categories?: Category[];
}
