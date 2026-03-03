export function Multiselect({
	name,
	options,
	selected = [],
	required = false,
	placeholder = "Search…",
}: {
	name: string;
	selected?: Array<string | number>;
	options: Array<{ label: string; value: string | number }>;
	placeholder?: string;
	required?: boolean;
}) {
	return (
		<div
			x-data={`multiselect({
        name: '${name}',
        options: ${JSON.stringify(options)},
        selected: ${JSON.stringify(selected)},
        required: ${required},
      })`}
			x-init="init()"
			x-cloak=""
			className="multiselect relative flex flex-col gap-1 text-sm"
			x-bind="{ 'x-on:click.outside': 'closeDropdown()' }"
		>
			{/* Selected items / chips */}
			<div className="selected flex flex-wrap gap-1" x-ref="selectedWrap">
				<template
					x-for="(item, index) in selectedItems"
					x-bind:key="item.value ?? index"
				>
					<span className="inline-flex items-center gap-2 px-2 py-1 bg-zinc-900 rounded-md text-sm text-zinc-200">
						<span x-text="item.label"></span>
						<button
							type="button"
							className="text-center text-zinc-500 px-1.5 hover:text-red-400"
							x-on:click="remove(item)"
						>
							x
						</button>
					</span>
				</template>
			</div>

			{/* Search input */}
			<input
				type="search"
				x-ref="input"
				placeholder={placeholder}
				className="px-2 py-1 ui-input"
				x-model="query"
				x-on:focus="openDropdown()"
				x-on:input="openDropdown()"
				x-on:keydown="keyDown($event)"
			/>

			{/* Validation input */}
			<input
				type="text"
				tabIndex={-1}
				hidden
				aria-hidden="true"
				className="hidden"
				x-bind:required="required"
				x-bind:value="selectedItems.length ? '1' : ''"
				x-on:invalid="$refs.input.focus()"
			/>

			{/* Dropdown results */}
			<template x-if="open">
				<div
					className="results absolute top-full mt-1 w-full max-h-48 overflow-auto bg-zinc-900 border border-zinc-700 shadow-lg z-10"
					x-transition=""
					x-cloak=""
					x-ref="results"
				>
					<template x-for="opt in filteredOptions" x-bind:key="opt.value">
						<button
							type="button"
							className="block w-full text-left px-2 py-1 hover:bg-zinc-800"
							x-on:click="select(opt)"
						>
							<span x-text="opt.label"></span>
						</button>
					</template>

					<template x-if="filteredOptions.length === 0">
						<div className="px-2 py-1 text-zinc-500">No results</div>
					</template>
				</div>
			</template>

			{/* Form Data */}
			<template
				x-for="(item, index) in selectedItems"
				x-bind:key="item.value ?? index"
			>
				<input
					type="hidden"
					x-bind:name="name + '[]'"
					x-bind:value="item.value"
				/>
			</template>
		</div>
	);
}
