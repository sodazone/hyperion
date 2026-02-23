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

export type AlertMessagePart = ["t" | "a" | "e" | "cex" | "addr", string];

export type AlertNetwork = {
	network: number;
	tx_hash?: string;
	block_number?: string;
	block_hash?: string;
	role: string;
};

export interface Alert<T extends AlertPayload = AlertPayload> {
	id?: number;
	timestamp: number;

	name: string;
	level: number;
	remark?: string;

	networks?: AlertNetwork[];

	message: AlertMessagePart[];
	payload?: T;
}

export type OwnedAlert<T extends AlertPayload = AlertPayload> = Alert<T> & {
	owner: Uint8Array;
};

export interface AlertPage {
	rows: Alert[];
	cursorNext?: string;
}
