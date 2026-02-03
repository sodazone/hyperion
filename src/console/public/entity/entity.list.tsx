import { Paginated } from "@/console/components/paginated";
import { SearchFilters } from "@/console/components/search.filters";
import { TopBar } from "@/console/components/top.bar";
import { CopyButton } from "../../components/btn.copy";
import { CategoryBadge } from "../../components/category.badge";
import { NetworkIconGroup } from "../../components/network.icon.group";
import type { NetworkInfos } from "../../extra.infos";
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
		networkInfos: NetworkInfos;
	};
};

export function EntitiesList({ page, ctx: { networkInfos } }: Props) {
	const { rows, cursorNext, filters, cursorCurrent } = page;
	const path = "/console/entities";

	return (
		<Paginated
			path={path}
			cursorNext={cursorNext}
			cursorCurrent={cursorCurrent}
		>
			<TopBar left={<SearchFilters path={path} filters={filters} />} />

			{/* Table */}
			<div id="entity-table" className="flex-1 overflow-auto">
				<table className="w-full text-sm">
					<thead className="sticky top-0 bg-zinc-950 text-xs uppercase tracking-wide text-zinc-500">
						<tr>
							<th className="px-4 py-2 text-left">Address</th>
							<th className="px-4 py-2 text-left">Networks</th>
							<th className="px-4 py-2 text-left">Categories</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-zinc-800">
						{rows.map((e) => (
							<tr
								key={e.address_formatted}
								className="hover:bg-zinc-900 cursor-pointer"
								hx-get={`/console/entities/${e.address_formatted}`}
								hx-target="#main-panel"
								hx-push-url="true"
							>
								<td className="px-4 py-2 font-mono text-xs text-zinc-200">
									<div className="flex items-center gap-2">
										<span>{e.address_formatted}</span>
										<CopyButton
											text={e.address_formatted}
											title="Copy address"
										/>
									</div>
								</td>
								<td className="px-4 py-2 text-zinc-300">
									<NetworkIconGroup
										networkInfos={networkInfos}
										urns={e.sets.networks}
									/>
								</td>
								<td className="px-4 py-2 text-zinc-300">
									{e.sets.categories?.map((category) => (
										<CategoryBadge key={category} categoryCode={category} />
									))}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Paginated>
	);
}
