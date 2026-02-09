import { AlertSearchFilters } from "@/console/components/alert.filters";
import { AlertCards } from "@/console/components/card.alert";
import { Paginated } from "@/console/components/paginated";
import { TopBar } from "@/console/components/top.bar";
import { withCursor } from "@/console/util";
import type { Alert } from "@/db/model";

type AlertPage = {
	rows: Alert[];
	cursorNext?: string | null;
	cursorCurrent?: string | null;
	filters: {
		networkId?: string;
		severity?: string;
		q?: string;
	};
};

type Props = {
	page: AlertPage;
	ctx: {
		url: URL;
	};
};

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
			<AlertCards rows={rows} />
		</Paginated>
	);
}
