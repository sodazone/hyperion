import { EntityTable } from "@/console/components/entity.table";
import { PencilIcon, PlusIcon } from "@/console/components/icons";
import { Paginated } from "@/console/components/paginated";
import { SearchFilters } from "@/console/components/search.filters";
import { TopBar } from "@/console/components/top.bar";
import type { NetworkInfos } from "@/console/extra.infos";
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
		networkInfos: NetworkInfos;
		url: URL;
	};
};
export function WatchlistList({ page, ctx: { networkInfos, url } }: Props) {
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
				left={<SearchFilters path={path} filters={filters} />}
				right={
					<button
						type="button"
						hx-get="/console/watchlist/form/__new__"
						hx-target="#main-content"
						hx-push-url="true"
						className="flex space-x-2 items-center rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200  hover:bg-zinc-900"
					>
						<span className="text-zinc-600">
							<PlusIcon size={18} />
						</span>
						<span>Add Entity</span>
					</button>
				}
			/>

			<EntityTable
				rows={rows}
				networkInfos={networkInfos}
				rowLink={(row: EntityRow) =>
					`/console/watchlist/form/${row.address_formatted}`
				}
				actions={(row: EntityRow) => (
					<div className="flex space-x-2">
						<button
							type="button"
							hx-get={`/console/watchlist/form/${row.address_formatted}`}
							hx-target="#main-content"
							hx-on:click="event.stopPropagation()"
							className="flex space-x-2 items-center rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200  hover:bg-zinc-900"
						>
							<span className="text-zinc-600">
								<PencilIcon />
							</span>
							<span>Edit</span>
						</button>

						<button
							type="button"
							className="flex items-center space-x-2 rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200  hover:bg-zinc-900"
							hx-delete={`/console/watchlist/${row.address_formatted}`}
							hx-target="#main-content"
							hx-on:click="event.stopPropagation()"
							hx-confirm="Are you sure you want to delete this watchlist entry?"
						>
							<span className="text-red-900">✕</span>
							<span>Delete</span>
						</button>
					</div>
				)}
			/>
		</Paginated>
	);
}
