import { topLevelCategories } from "@/intel/mapping";
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
			className="flex flex-wrap items-center gap-2"
			hx-get={path}
			hx-target="#main-content"
			hx-trigger="change from:select, reset"
			hx-push-url="true"
		>
			{/* Search Input */}
			<div className="relative w-80 mr-4">
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
					className="w-full pl-8 pr-3 py-2 text-sm bg-transparent
                 border-b border-zinc-800
                 text-zinc-100
                 placeholder-zinc-600
                 focus:border-zinc-300
                 focus:outline-none"
				/>
			</div>

			{/* Network Filter */}
			<div className="relative w-40">
				<select
					name="networkId"
					defaultValue={filters.networkId ?? "*"}
					className="
             w-full
             border
             border-zinc-900
             bg-zinc-950
             text-zinc-400
             text-sm
             px-3
             py-2
             rounded-md
             appearance-none
             hover:text-zinc-200
             hover:bg-zinc-900
             focus:outline-none
           "
				>
					<option value="*">All Networks</option>
					<option value="768">Ethereum</option>
					<option value="257">Polkadot Asset Hub</option>
					<option value="1280">Bitcoin</option>
				</select>
				<div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-600">
					<ChevronUpDownIcon />
				</div>
			</div>

			{/* Category Filter */}
			<div className="relative w-40">
				<select
					name="category"
					defaultValue={filters.category ?? "*"}
					className="
             w-full
             border
             border-zinc-900
             bg-zinc-950
             text-zinc-400
             text-sm
             px-3
             py-2
             rounded-md
             appearance-none
             hover:text-zinc-200
             hover:bg-zinc-900
             focus:outline-none
           "
				>
					<option value="*">All Categories</option>
					{topLevelCategories.map(({ category, label }) => (
						<option key={category} value={category}>
							{label}
						</option>
					))}
				</select>
				<div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-600">
					<ChevronUpDownIcon />
				</div>
			</div>

			<input
				type="reset"
				value="Reset All"
				className="cursor-pointer text-sm text-zinc-400 hover:text-zinc-200 ml-4"
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
