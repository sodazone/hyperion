import { BackButton } from "@/console/components/btn.back";
import type { Entity } from "@/db";
import { CategoryRow, TagRow } from "./watchlist.form.rows";

export function WatchlistForm({ entity }: { entity?: Entity }) {
	const isEdit = !!entity;

	const method = isEdit ? "hx-put" : "hx-post";
	const inputClass =
		"w-full px-3 py-2 text-sm bg-transparent border-b border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-300 focus:outline-none";

	return (
		<section className="h-full overflow-auto bg-zinc-950 p-6 space-y-8">
			<BackButton href="/console/watchlist" />

			<h1 className="text-lg font-medium text-zinc-300">
				{isEdit ? "Edit Watchlist" : "Add to Watchlist"}
			</h1>

			<form
				{...{ [method]: "/console/watchlist" }}
				hx-target="#error"
				hx-swap="innerHTML"
				hx-disabled-elt="button[type=submit]"
				className="space-y-4 p-4 min-w-xl max-w-xl mx-auto"
			>
				<div id="error"></div>

				{/* Address */}
				<input
					name="address"
					required
					readOnly={isEdit}
					defaultValue={entity?.address_formatted}
					placeholder="Address"
					className={inputClass}
				/>

				<div className="space-y-4">
					{/* Tags */}
					<div className="space-y-2">
						<div className="flex items-center justify-between text-xs text-zinc-500">
							<span>Tags</span>
							<button
								type="button"
								hx-get="/console/watchlist/form/rows/tag"
								hx-target="#tag-list"
								hx-swap="beforeend"
							>
								+ Add
							</button>
						</div>

						<div id="tag-list" className="space-y-2">
							{entity?.tags?.map((t) => (
								<TagRow key={t.tag} {...t} />
							))}
						</div>
					</div>

					{/* Categories */}
					<div className="space-y-2">
						<div className="flex items-center justify-between text-xs text-zinc-500">
							<span>Categories</span>
							<button
								type="button"
								hx-get="/console/watchlist/form/rows/category"
								hx-target="#cat-list"
								hx-swap="beforeend"
							>
								+ Add
							</button>
						</div>

						<div id="cat-list" className="space-y-2">
							{entity?.categories?.map((c) => (
								<CategoryRow key={`${c.category}.${c.subcategory}`} {...c} />
							))}
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="flex justify-end gap-2 pt-2">
					<button
						type="button"
						hx-get="/console/watchlist"
						hx-target="#main-content"
						className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
					>
						Cancel
					</button>

					<button
						type="submit"
						className="rounded bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700 disabled:opacity-40"
					>
						{isEdit ? "Save" : "Add"}
					</button>
				</div>
			</form>
		</section>
	);
}
