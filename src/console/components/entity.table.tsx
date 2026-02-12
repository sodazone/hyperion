import type { EntityRow } from "../types";
import { TagBadge } from "./badge";
import { CopyButton } from "./btn.copy";
import { CategoryBadge } from "./category.badge";
import { NetworkIconGroup } from "./network.icon.group";

export function EntityTable({
	rows,
	rowLink,
	empty,
}: {
	rows: EntityRow[];
	rowLink: (row: EntityRow) => string;
	empty?: React.ReactNode;
}) {
	return (
		<div id="entity-table" className="flex-1 overflow-auto">
			<table className="w-full table-auto md:table-fixed text-sm">
				<colgroup>
					<col className="w-40" />
					<col className="w-20" />
					<col className="w-20" />
					<col className="w-20" />
				</colgroup>

				<thead className="sticky top-0 bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500 z-10">
					<tr>
						<th className="px-4 py-2 text-left">Address</th>
						<th className="px-4 py-2 text-left">Networks</th>
						<th className="px-4 py-2 text-left">Categories</th>
						<th className="px-4 py-2 text-left">Tags</th>
					</tr>
				</thead>

				<tbody className="divide-y divide-zinc-900/90">
					{rows.length === 0 && (
						<tr>
							<td colSpan={4} className="px-4 py-16 text-center text-zinc-500">
								{empty ?? "No entities found"}
							</td>
						</tr>
					)}

					{rows.map((e) => (
						<tr
							key={e.address_formatted}
							className="hover:bg-teal-700/5 cursor-pointer transition-colors duration-75"
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

							{/* Categories */}
							<td className="px-4 py-2">
								{e.sets.categories.length > 0 ? (
									<div className="flex items-center gap-1 truncate">
										<CategoryBadge categoryCode={e.sets.categories[0] ?? 0} />

										{e.sets.categories.length > 1 && (
											<span className="text-xs text-zinc-500">
												+{e.sets.categories.length - 1}
											</span>
										)}
									</div>
								) : (
									<span className="text-zinc-500">-</span>
								)}
							</td>

							{/* Tags */}
							<td className="px-4 py-2">
								{e.sets.tags.length > 0 ? (
									<div className="flex gap-1 items-center">
										<TagBadge tag={e.sets.tags[0] ?? ""} />

										{e.sets.tags.length > 1 && (
											<span className="text-xs text-zinc-500">
												+{e.sets.tags.length - 1}
											</span>
										)}
									</div>
								) : (
									<span className="text-zinc-500">-</span>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
