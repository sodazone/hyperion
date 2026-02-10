import type { HyperionDB } from "@/db";
import { coerce, coerceNetworkId } from "@/server/api/params";

export function fetchAlertPage(
	db: HyperionDB,
	url: URL,
	ownerHash: Uint8Array,
) {
	const cursor = url.searchParams.get("cursor") ?? undefined;
	const network = coerceNetworkId(url.searchParams.get("networkId"));
	const severity = coerce<number>(url.searchParams.get("severity"));
	const search = url.searchParams.get("q") ?? undefined;

	const { rows, cursorNext } = db.alerts.findAlerts({
		owner: ownerHash,
		levelMin: severity,
		levelMax: severity,
		network,
		address: search,
		cursor,
		limit: 35,
	});

	const page = {
		rows: rows,
		cursorNext,
		cursorCurrent: cursor,
		filters: {
			networkId: network?.toString(),
			severity: severity?.toString(),
			q: search,
		},
	};

	return page;
}
