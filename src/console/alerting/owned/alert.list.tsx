import { AlertSearchFilters } from "@/console/components/alert.filters";
import { AlertCards } from "@/console/components/card.alert";
import { Paginated } from "@/console/components/paginated";
import { TopBar } from "@/console/components/top.bar";
import { withCursor } from "@/console/util";
import { alertCursor } from "@/db/backend/cursors";
import type { AlertPage } from "../common/alert.types";

type Props = {
	page: AlertPage;
	ctx: {
		url: URL;
	};
};

function MyAlertUpdater({
	row,
	filters,
}: {
	row?: { timestamp: number; id?: number };
	filters: any;
}) {
	if (!row || row.id === undefined) return null;

	const params = new URLSearchParams();

	params.set("after", alertCursor.encode({ ts: row.timestamp, id: row.id }));

	Object.entries(filters).forEach(([key, value]) => {
		if (value != null && value !== "") {
			params.set(key, value.toString());
		}
	});

	const hxGetUrl = `/console/my/alerts/$?${params.toString()}`;

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

export function MyAlertList({ page, ctx: { url } }: Props) {
	const { rows, cursorNext, cursorCurrent, filters } = page;
	const nextUrl = withCursor(url, cursorNext);
	const path = "/console/my/alerts";

	return (
		<Paginated
			nextUrl={nextUrl}
			hasNext={!!cursorNext}
			hasPrev={!!cursorCurrent}
		>
			<TopBar left={<h1 className="text-lg font-semibold">My Alerts</h1>} />
			<AlertSearchFilters path={path} filters={filters} />
			{!cursorCurrent && rows && rows.length > 0 && (
				<MyAlertUpdater row={rows[0]} filters={filters} />
			)}
			<AlertCards rows={rows} />
		</Paginated>
	);
}
