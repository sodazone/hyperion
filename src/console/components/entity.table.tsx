import type { NetworkInfos } from "../extra.infos";
import type { EntityRow } from "../types";
import { TagBadge } from "./badge";
import { CopyButton } from "./btn.copy";
import { CategoryBadge } from "./category.badge";
import { NetworkIconGroup } from "./network.icon.group";

export function EntityTable({
	rows,
	rowLink,
	networkInfos,
	actions,
	empty,
}: {
	rows: EntityRow[];
	rowLink: (row: EntityRow) => string;
	networkInfos: NetworkInfos;
	empty?: React.ReactNode;
	actions?: (row: EntityRow) => React.ReactNode;
}) {
	return (
		<div id="entity-table" className="flex-1 overflow-auto">
			<table className="w-full text-sm">
				<thead className="sticky top-0 bg-zinc-950 text-xs uppercase tracking-wide text-zinc-500">
					<tr>
						<th className="px-4 py-2 text-left">Address</th>
						<th className="px-4 py-2 text-left">Networks</th>
						<th className="px-4 py-2 text-left">Categories</th>
						<th className="px-4 py-2 text-left">Tags</th>
						{actions && <th className="px-4 py-2 text-left">Actions</th>}
					</tr>
				</thead>
				<tbody className="divide-y divide-zinc-800">
					{(rows.length === 0 && empty) ?? (
						<tr>
							<td
								colSpan={actions ? 5 : 4}
								className="px-4 py-2 text-center text-zinc-500"
							>
								<div className="my-20">No entities found</div>
							</td>
						</tr>
					)}
					{rows.map((e) => (
						<tr
							key={e.address_formatted}
							className="hover:bg-zinc-900 cursor-pointer"
							hx-get={rowLink(e)}
							hx-target="#main-panel"
							hx-push-url="true"
						>
							<td className="px-4 py-2 font-mono text-xs text-zinc-200">
								<div className="flex items-center gap-2">
									<span>{e.address_formatted}</span>
									<CopyButton text={e.address_formatted} title="Copy address" />
								</div>
							</td>
							<td className="px-4 py-2 text-zinc-300">
								<NetworkIconGroup
									networkInfos={networkInfos}
									urns={e.sets.networks}
								/>
							</td>
							<td className="px-4 py-2 text-zinc-300">
								<div className="flex gap-1 flex-wrap">
									{e.sets.categories.length > 0 ? (
										e.sets.categories.map((category) => (
											<CategoryBadge key={category} categoryCode={category} />
										))
									) : (
										<span className="text-zinc-500">-</span>
									)}
								</div>
							</td>

							<td className="px-4 py-2 text-zinc-300">
								<div className="flex gap-1 flex-wrap">
									{e.sets.tags.length > 0 ? (
										e.sets.tags.map((tag) => <TagBadge key={tag} tag={tag} />)
									) : (
										<span className="text-zinc-500">-</span>
									)}
								</div>
							</td>

							{actions && (
								<td className="px-4 py-2 text-zinc-300">{actions(e)}</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
