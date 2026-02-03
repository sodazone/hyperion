import type { Category } from "@/db";
import { topLevelCategories } from "@/intel/mapping";

export function TagRow(t?: { network?: number; tag?: string }) {
	return (
		<div className="flex items-center gap-2 tag-row">
			<select
				name="tag_network[]"
				defaultValue={t?.network ?? 768}
				className="bg-zinc-900 px-2 py-2 text-xs rounded"
			>
				<option value="768">ETH</option>
				<option value="257">DOT</option>
				<option value="1280">BTC</option>
			</select>

			<input
				name="tag_value[]"
				defaultValue={t?.tag ?? ""}
				placeholder="tag"
				className="flex-1 bg-zinc-900 px-3 py-2 text-sm rounded"
			/>

			<button
				type="button"
				hx-on:click="this.closest('.tag-row')?.remove()"
				className="text-zinc-600 hover:text-red-400"
			>
				✕
			</button>
		</div>
	);
}

export function CategoryRow({
	network = 768,
	category,
	subcategory = 0,
}: Partial<Category> = {}) {
	return (
		<div className="flex items-center gap-2 category-row">
			<select
				name="cat_network[]"
				required
				defaultValue={network}
				className="bg-zinc-900 px-2 py-2 text-xs rounded"
			>
				<option value="768">ETH</option>
				<option value="257">DOT</option>
				<option value="1280">BTC</option>
			</select>

			<select
				required
				name="cat_category[]"
				defaultValue={category}
				className="bg-zinc-900 px-2 py-2 text-xs rounded"
			>
				{topLevelCategories.map(({ category, label }) => (
					<option key={category} value={category}>
						{label}
					</option>
				))}
			</select>

			<input
				name="cat_subcategory[]"
				type="number"
				required
				defaultValue={subcategory}
				className="w-20 bg-zinc-900 px-2 py-2 text-xs rounded"
			/>

			<button
				type="button"
				hx-on:click="this.closest('.category-row')?.remove()"
				className="text-zinc-600 hover:text-red-400"
			>
				✕
			</button>
		</div>
	);
}
