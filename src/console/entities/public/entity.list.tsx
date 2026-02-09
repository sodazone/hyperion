import { EntitySearchFilters } from "@/console/components/entity.filters";
import { EntityTable } from "@/console/components/entity.table";
import { Paginated } from "@/console/components/paginated";
import { TopBar } from "@/console/components/top.bar";
import { withCursor } from "@/console/util";
import type { EntityRow } from "../../types";

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

export function EntitiesList({ page, ctx: { url } }: Props) {
	const { rows, cursorNext, cursorCurrent, filters } = page;

	const nextUrl = withCursor(url, cursorNext);
	const path = "/console/entities";

	return (
		<Paginated
			nextUrl={nextUrl}
			hasNext={!!cursorNext}
			hasPrev={!!cursorCurrent}
		>
			<TopBar
				left={<h1 className="text-lg font-semibold">Public Entities</h1>}
			/>
			<EntitySearchFilters path={path} filters={filters} />
			<EntityTable
				rowLink={(e: EntityRow) => `/console/entities/${e.address_formatted}`}
				rows={rows}
			/>
		</Paginated>
	);
}
