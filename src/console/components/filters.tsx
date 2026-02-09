import {
	ChevronDownIcon,
	ChevronUpDownIcon,
	MenuFilterIcon,
	SearchIcon,
} from "./icons";

type FilterOption = {
	label: string;
	value: string;
};

type FilterDef =
	| {
			type: "search";
			name: string;
			placeholder?: string;
	  }
	| {
			type: "select";
			name: string;
			label?: string;
			width?: string;
			options: FilterOption[];
			default?: string;
	  };

function FilterField({ def, value }: { def: FilterDef; value?: string }) {
	if (def.type === "search") {
		return (
			<div className="relative flex-1 min-w-50 md:w-80">
				<button
					type="submit"
					className="absolute left-1 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-600 hover:text-zinc-100"
				>
					<SearchIcon />
				</button>

				<input
					type="text"
					name={def.name}
					defaultValue={value}
					placeholder={def.placeholder ?? "Search..."}
					className="ui-input w-full pl-8 pr-3 py-2"
				/>
			</div>
		);
	}

	if (def.type === "select") {
		return (
			<div className={`ui-select ${def.width ?? "w-40"}`}>
				<select name={def.name} defaultValue={value ?? def.default ?? "*"}>
					{def.options.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>
				<div className="ui-select-btn">
					<ChevronUpDownIcon />
				</div>
			</div>
		);
	}

	return null;
}

type Props = {
	path: string;
	values: Record<string, string | undefined>;
	defs: FilterDef[];
};

export function SearchFilters({ path, values, defs }: Props) {
	return (
		<div>
			{/* Mobile */}
			<button
				type="button"
				className="md:hidden flex w-full items-center justify-between px-3 py-3 text-sm text-zinc-300 hover:bg-zinc-900"
				hx-on:click="
          const el = document.getElementById('filters-body');
          el.classList.toggle('hidden');
          el.classList.toggle('flex');
        "
			>
				<span className="flex items-center gap-2">
					<MenuFilterIcon />
					Filters
				</span>
				<ChevronDownIcon />
			</button>

			<form
				id="filters-body"
				className="
          hidden md:flex
          flex-col md:flex-row
          md:items-center
          gap-2 md:gap-4
          py-4 px-2
        "
				hx-get={path}
				hx-target="#main-content"
				hx-trigger="
          change from:select,
          keyup delay:400ms from:input[type=text],
          reset
        "
				hx-push-url="true"
			>
				{defs.map((def) => (
					<FilterField key={def.name} def={def} value={values[def.name]} />
				))}

				{/* Reset */}
				<button
					type="reset"
					className="text-sm text-zinc-400 hover:text-zinc-200 ml-2"
					hx-on:click={`
            const form = this.closest('form');

            for (const el of form.elements) {
              if (!el.name) continue;

              if (el.type === 'text') el.value = '';
              if (el.tagName === 'SELECT') el.value = '*';
              if (el.type === 'checkbox') el.checked = false;
            }

            htmx.trigger(form, 'reset');
          `}
				>
					Reset
				</button>
			</form>
		</div>
	);
}
