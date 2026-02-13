import type { HyperionDB } from "@/db";
import { coerce, coerceNetworkId } from "@/server/api/params";

export function parseAlertsUrlParams(url: URL) {
	const cursor = url.searchParams.get("cursor") ?? undefined;
	const after = url.searchParams.get("after") ?? undefined;
	const network = coerceNetworkId(url.searchParams.get("networkId"));
	const severity = coerce<number>(url.searchParams.get("severity"));
	const search = url.searchParams.get("q") ?? undefined;

	return {
		cursor,
		after,
		network,
		severity,
		search,
	};
}

export function fetchAlertPage(
	db: HyperionDB,
	url: URL,
	ownerHash: Uint8Array,
	limit = 35,
) {
	const { cursor, after, network, severity, search } =
		parseAlertsUrlParams(url);
	const { rows, cursorNext } = db.alerting.alerts.findAlerts({
		owner: ownerHash,
		levelMin: severity,
		levelMax: severity,
		network,
		address: search,
		cursor,
		after,
		limit,
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
