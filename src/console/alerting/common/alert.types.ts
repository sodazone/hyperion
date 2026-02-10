import type { Alert } from "@/db";

export type AlertPage = {
	rows: Alert[];
	cursorNext?: string | null;
	cursorCurrent?: string | null;
	filters: {
		networkId?: string;
		severity?: string;
		q?: string;
	};
};
