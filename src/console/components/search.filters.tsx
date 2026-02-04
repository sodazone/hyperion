import { topLevelCategories } from "@/intel/mapping";
import { NetworkCache } from "../network.cache";
import { ChevronUpDownIcon, SearchIcon } from "./icons";

export type Filters = {
	q?: string;
	networkId?: string;
	category?: string;
};

type Props = {
	path: string;
	filters: Filters;
};

export function SearchFilters({ path, filters }: Props) {
	return (
		<form
			id="search-filters-form"
			className="flex flex-col md:items-center gap-2 md:flex-row md:gap-4 border-b border-zinc-800 py-4 px-2"
			hx-get={path}
			hx-target="#main-content"
			hx-trigger="change from:select, reset"
			hx-push-url="true"
		>
			{/* Search Input */}
			<div className="relative flex-1 min-w-50 md:w-80">
				<button
					type="submit"
					className="absolute left-1 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-600 hover:text-zinc-100"
					aria-label="Search"
				>
					<SearchIcon />
				</button>
				<input
					type="text"
					name="q"
					defaultValue={filters.q}
					placeholder="Search address..."
					className="ui-input w-full pl-8 pr-3 py-2"
				/>
			</div>

			<div className="flex flex-col md:flex-row gap-2 md:gap-4 flex-1 min-w-37.5">
				{/* Network Filter */}
				<div className="ui-select w-40">
					<select name="networkId" defaultValue={filters.networkId ?? "*"}>
						<option value="*">All Networks</option>
						{NetworkCache.all().map(({ name, id }) => (
							<option key={id} value={id}>
								{name}
							</option>
						))}
					</select>
					<div className="ui-select-btn">
						<ChevronUpDownIcon />
					</div>
				</div>

				{/* Category Filter */}
				<div className="ui-select w-40">
					<select name="category" defaultValue={filters.category ?? "*"}>
						<option value="*">All Categories</option>
						{topLevelCategories.map(({ category, label }) => (
							<option key={category} value={category}>
								{label}
							</option>
						))}
					</select>
					<div className="ui-select-btn">
						<ChevronUpDownIcon />
					</div>
				</div>
			</div>

			<input
				type="reset"
				value="Reset All"
				className="cursor-pointer w-fit text-sm text-zinc-400 hover:text-zinc-200 ml-4"
				hx-on:click={`
             window.entityPageStack = [];

             const form = document.getElementById('search-filters-form');
             if(form) {
               form.q.value = '';
               form.networkId.value = '*';
               form.category.value = '*';
             }

             htmx.trigger(form, 'reset');
           `}
			/>
		</form>
	);
}
