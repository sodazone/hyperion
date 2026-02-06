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

export interface AlertActor {
	address: string;
	address_formatted: string;
	role: string;
	name?: string;
	labels?: string[];
}

export interface AlertPayload {
	actors: Array<AlertActor>;
}

export interface Alert<T extends AlertPayload = AlertPayload> {
	id?: number;
	owner: Uint8Array;
	timestamp: number;

	rule_id: string;
	level: number;
	remark?: string;

	network?: number;
	tx_hash?: string;
	block_number?: string;
	block_hash?: string;
	message: string;
	payload?: T;
}

export interface AlertPage {
	rows: Alert[];
	cursorNext?: string;
}
