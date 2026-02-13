import type { HyperionDB } from "@/db";
import { alertCursor } from "@/db/backend/cursors";
import { render } from "@/server/render";
import { Ok } from "@/server/response";
import { parseAlertsUrlParams } from "./alert.fetch";

export function AlertPoller({
	row,
	filters,
	path,
}: {
	row?: { timestamp: number; id?: number };
	filters: any;
	path: string;
}) {
	if (!row || row.id === undefined) return null;

	const params = new URLSearchParams();

	params.set("after", alertCursor.encode({ ts: row.timestamp, id: row.id }));

	Object.entries(filters).forEach(([key, value]) => {
		if (value != null && value !== "") {
			params.set(key, value.toString());
		}
	});

	const hxGetUrl = `${path}$?${params.toString()}`;

	return (
		<div
			id="alerts-poller"
			hx-get={hxGetUrl}
			hx-trigger="every 10s"
			hx-target="#alerts-poller"
			className="flex"
		></div>
	);
}

export function handleAlertPoll({
	path,
	db,
	req,
	owner,
}: {
	path: string;
	db: HyperionDB;
	req: Bun.BunRequest;
	owner: Uint8Array;
}) {
	const { after, network, severity, search } = parseAlertsUrlParams(
		new URL(req.url),
	);
	const count = db.alerting.alerts.countAlerts({
		owner,
		after,
		levelMin: severity,
		levelMax: severity,
		network,
		address: search,
	});

	if (count === 0) {
		return Ok;
	}

	if (req.headers.get("HX-Request")) {
		const params = new URLSearchParams();

		if (network != null) params.set("network", String(network));
		if (severity != null) params.set("severity", String(severity));
		if (search) params.set("search", search);

		const hxGet = `${path}${params.size ? `?${params}` : ""}`;

		return render(
			<div
				className="text-sm inline-flex ml-auto px-2 py-2 text-zinc-500 cursor-pointer items-center gap-1.5"
				hx-get={hxGet}
				hx-target="#main-content"
				hx-swap="innerHTML swap:80ms"
			>
				<span className="text-zinc-300 font-semibold">{count}</span>
				<span className="pr-1">new {count > 1 ? "alerts" : "alert"}</span>
				<span className="relative flex h-2.5 w-2.5 items-center justify-center">
					<span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-60 animate-ping"></span>
					<span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
				</span>
			</div>,
		);
	}

	return Ok;
}
