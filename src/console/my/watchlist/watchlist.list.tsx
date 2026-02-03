import { PencilIcon, PlusIcon } from "@/console/components/icons";
import { Paginated } from "@/console/components/paginated";
import { SearchFilters } from "@/console/components/search.filters";
import { TopBar } from "@/console/components/top.bar";
import type { NetworkInfos } from "@/console/extra.infos";
import type { EntityRow } from "@/console/types";

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
	};
};
export function WatchlistList({ page, ctx: { networkInfos } }: Props) {
	const { rows, cursorNext, filters, cursorCurrent } = page;
	const path = "/console/watchlist";
	return (
		<Paginated
			path={path}
			cursorNext={cursorNext}
			cursorCurrent={cursorCurrent}
		>
			<TopBar
				left={<SearchFilters path={path} filters={filters} />}
				right={
					<button
						type="button"
						hx-get="/console/watchlist/form/__new__"
						hx-target="#main-content"
						hx-swap="outerHTML"
						className="flex space-x-2 items-center rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200  hover:bg-zinc-900"
					>
						<span className="text-zinc-600">
							<PlusIcon size={18} />
						</span>
						<span>Add Entity</span>
					</button>
				}
			/>

			<div className="flex flex-col gap-4 min-h-60">
				{rows.map((row) => (
					<div key={row.address_formatted}>
						<button
							type="button"
							hx-get={`/console/watchlist/form/${row.address_formatted}`}
							hx-target="#main-content"
							hx-swap="outerHTML"
							className="flex space-x-2 items-center rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200  hover:bg-zinc-900"
						>
							<span className="text-zinc-600">
								<PencilIcon />
							</span>
							<span>Edit Entity</span>
						</button>
						<code>
							<pre>{JSON.stringify(row, null, 2)}</pre>
						</code>
					</div>
				))}
			</div>
		</Paginated>
	);
}
