import type { EntityRow } from "../types";
import { TagBadge } from "./badge";
import { CopyButton } from "./btn.copy";
import { CategoryBadge } from "./category.badge";
import { NetworkIconGroup } from "./network.icon.group";

export function EntityTable({
	rows,
	rowLink,
	actions,
	empty,
}: {
	rows: EntityRow[];
	rowLink: (row: EntityRow) => string;
	empty?: React.ReactNode;
	actions?: (row: EntityRow) => React.ReactNode;
}) {
	return (
		<div id="entity-table" className="flex-1 overflow-auto">
			<table className="w-full table-fixed text-sm">
				<colgroup>
					<col className="w-40" />
					<col className="w-20" />
					<col className="w-20" />
					<col className="w-20" />
					{actions && <col className="w-20" />}
				</colgroup>

				<thead className="sticky top-0 bg-zinc-950 text-xs uppercase tracking-wide text-zinc-500">
					<tr>
						<th className="px-4 py-2 text-left">Address</th>
						<th className="px-4 py-2 text-left">Networks</th>

						{/* hide on small */}
						<th className="px-4 py-2 text-left hidden md:table-cell">
							Categories
						</th>
						<th className="px-4 py-2 text-left hidden md:table-cell">Tags</th>

						{actions && <th className="px-4 py-2 text-left">Actions</th>}
					</tr>
				</thead>

				<tbody className="divide-y divide-zinc-800">
					{rows.length === 0 && (
						<tr>
							<td
								colSpan={actions ? 5 : 4}
								className="px-4 py-16 text-center text-zinc-500"
							>
								{empty ?? "No entities found"}
							</td>
						</tr>
					)}

					{rows.map((e) => (
						<tr
							key={e.address_formatted}
							className="hover:bg-zinc-900 cursor-pointer transition-colors"
							hx-get={rowLink(e)}
							hx-target="#main-content"
							hx-push-url="true"
						>
							{/* Address */}
							<td className="px-4 py-2 font-mono text-xs text-zinc-200">
								<div className="flex items-center gap-2 min-w-0">
									<span className="truncate max-w-full">
										{e.address_formatted}
									</span>
									<CopyButton text={e.address_formatted} title="Copy address" />
								</div>
							</td>

							{/* Networks */}
							<td className="px-4 py-2 text-zinc-300">
								<NetworkIconGroup urns={e.sets.networks} />
							</td>

							{/* Categories (desktop only) */}
							<td className="px-4 py-2 hidden md:table-cell">
								<div className="flex gap-1 flex-wrap max-h-10 overflow-hidden">
									{e.sets.categories.length ? (
										e.sets.categories.map((c) => (
											<CategoryBadge key={c} categoryCode={c} />
										))
									) : (
										<span className="text-zinc-500">-</span>
									)}
								</div>
							</td>

							{/* Tags (desktop only) */}
							<td className="px-4 py-2 hidden md:table-cell">
								<div className="flex gap-1 flex-wrap max-h-10 overflow-hidden">
									{e.sets.tags.length ? (
										e.sets.tags.map((t) => <TagBadge key={t} tag={t} />)
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
