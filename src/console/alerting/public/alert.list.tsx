import { AlertSearchFilters } from "@/console/components/alert.filters";
import { AlertCards } from "@/console/components/card.alert";
import { Paginated } from "@/console/components/paginated";
import { TopBar } from "@/console/components/top.bar";
import { withCursor } from "@/console/util";
import type { AlertPage } from "../common/alert.types";
import { AlertUpdater } from "../common/alert.update";

type Props = {
	page: AlertPage;
	ctx: {
		url: URL;
	};
};

export function PublicAlertsList({ page, ctx: { url } }: Props) {
	const { rows, cursorNext, cursorCurrent, filters } = page;
	const nextUrl = withCursor(url, cursorNext);
	const path = "/console/public/alerts";
	const needAlertUpdater = !cursorCurrent && rows && rows.length > 0;

	return (
		<Paginated
			nextUrl={nextUrl}
			hasNext={!!cursorNext}
			hasPrev={!!cursorCurrent}
		>
			<TopBar left={<h1 className="text-lg font-semibold">Alerts</h1>} />
			<AlertSearchFilters path={path} filters={filters} />
			{needAlertUpdater && (
				<AlertUpdater path={path} filters={filters} row={rows[0]} />
			)}
			<AlertCards rows={rows} />
		</Paginated>
	);
}
