import { BackButton } from "@/console/components/btn.back";
import type { Entity } from "@/db";
import { CategoryRow, TagRow } from "./watchlist.form.rows";

export function WatchlistForm({ entity }: { entity?: Entity }) {
	const isEdit = !!entity;
	const method = isEdit ? "hx-put" : "hx-post";

	return (
		<section className="h-full min-h-screen flex flex-col max-w-full md:w-4xl lg:w-5xl md:mx-auto space-y-8">
			<div className="flex gap-6 items-center">
				<BackButton href="/console/watchlist" />

				<h1 className="text-lg font-semibold text-zinc-300">
					{isEdit ? "Edit Entity" : "Add Entity"}
				</h1>
				{isEdit && (
					<button
						type="button"
						hx-delete={`/console/watchlist/${entity.address_formatted}`}
						hx-target="#main-content"
						hx-on:click="event.stopPropagation()"
						hx-confirm="Are you sure you want to delete this entry?"
						className="ml-auto px-2"
					>
						<span className="text-zinc-400 hover:text-red-400 text-sm">
							Delete
						</span>
					</button>
				)}
			</div>

			<form
				{...{ [method]: "/console/watchlist" }}
				hx-target="#address-error"
				hx-disabled-elt="button[type=submit]"
				className="w-full border border-zinc-900 p-6 rounded-md space-y-6"
			>
				{/* Error div */}
				<div id="address-error" className="text-sm"></div>

				{/* Address */}
				<label
					htmlFor="input-address"
					className="text-xs uppercase font-semibold text-zinc-500"
				>
					Address
				</label>
				<input
					name="address"
					id="input-address"
					required
					readOnly={isEdit}
					defaultValue={entity?.address_formatted}
					placeholder="Address"
					className="w-full px-3 py-2 ui-input"
					type="text"
				/>

				{/* Tags */}
				<div className="space-y-2 pb-6">
					<div className="flex flex-col gap-1">
						<span className="text-xs uppercase font-semibold">Tags</span>
						<span className="text-xs text-zinc-400">
							Free-form text labels for adding context and fine-grained
							grouping. Useful for precise filtering and rule-based alerts
							across related addresses.
						</span>
					</div>

					<div id="tag-list" className="space-y-2">
						{entity?.tags?.map((t) => (
							<TagRow key={t.tag} {...t} />
						))}
					</div>

					<button
						type="button"
						hx-get="/console/watchlist/form/rows/tag"
						hx-target="#tag-list"
						hx-swap="beforeend"
						className="shrink-0 text-zinc-400 hover:text-zinc-200 text-sm bg-zinc-900 rounded-md py-1 px-2"
					>
						+ Add
					</button>
				</div>

				{/* Categories */}
				<div className="space-y-2">
					<div className="flex flex-col gap-1">
						<span className="text-xs uppercase font-semibold">Categories</span>
						<span className="text-xs text-zinc-400">
							Predefined classifications based on address function for
							consistent, broad grouping. Enables rules to match across all
							entities in the same category.
						</span>
					</div>

					<div id="cat-list" className="space-y-2">
						{entity?.categories?.map((c) => (
							<CategoryRow key={`${c.category}.${c.subcategory}`} {...c} />
						))}
					</div>

					<button
						type="button"
						hx-get="/console/watchlist/form/rows/category"
						hx-target="#cat-list"
						hx-swap="beforeend"
						className="shrink-0 text-zinc-400 hover:text-zinc-200 text-sm bg-zinc-900 rounded-md py-1 px-2"
					>
						+ Add
					</button>
				</div>

				{/* Actions */}
				<div className="flex justify-end gap-2 pt-2">
					<button
						type="button"
						hx-get="/console/watchlist"
						hx-target="#main-content"
						hx-push-url="true"
						className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
					>
						Cancel
					</button>
					<button type="submit" className="ui-btn">
						{isEdit ? "Save" : "Create"}
					</button>
				</div>
			</form>
		</section>
	);
}
