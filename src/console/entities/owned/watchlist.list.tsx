import { EntitySearchFilters } from "@/console/components/entity.filters";
import { EntityTable } from "@/console/components/entity.table";
import { PlusIcon } from "@/console/components/icons";
import { Paginated } from "@/console/components/paginated";
import { TopBar } from "@/console/components/top.bar";
import type { EntityRow } from "@/console/types";
import { withCursor } from "@/console/util";

type EntityPage = {
	rows: Array<EntityRow>;
	cursorNext?: string | null;
	cursorCurrent?: string | null;
	filters: {
		networkId?: string;
		category?: string;
		q?: string;
	};
};

type Props = {
	page: EntityPage;
	ctx: {
		url: URL;
	};
};
export function WatchlistList({ page, ctx: { url } }: Props) {
	const { rows, cursorNext, cursorCurrent, filters } = page;

	const nextUrl = withCursor(url, cursorNext);
	const path = "/console/watchlist";

	return (
		<Paginated
			nextUrl={nextUrl}
			hasNext={!!cursorNext}
			hasPrev={!!cursorCurrent}
		>
			<TopBar
				left={<h1 className="text-lg font-semibold">My Registry</h1>}
				right={
					<button
						type="button"
						hx-get="/console/watchlist/form/__new__"
						hx-target="#main-content"
						hx-push-url="true"
						className="ui-btn"
						hx-swap="innerHTML swap:80ms"
					>
						<PlusIcon size={18} />
						<span>Add Entity</span>
					</button>
				}
			/>

			<EntitySearchFilters path={path} filters={filters} />

			<EntityTable
				rows={rows}
				rowLink={(row: EntityRow) =>
					`/console/watchlist/form/${row.address_formatted}`
				}
			/>
		</Paginated>
	);
}
