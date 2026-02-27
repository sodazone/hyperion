import { ChevronUpDownIcon } from "./icons";

export function RichSelect({
	name,
	options,
	selected,
}: {
	name: string;
	selected: string;
	options: Array<{
		label: string;
		value: string;
		icon?: string;
	}>;
}) {
	return (
		<div
			x-data={`richSelect({
    name: '${name}',
    selected: '${selected}',
    options: ${JSON.stringify(options)}
  })`}
			className="relative w-56 text-sm z-0"
			x-bind="{ 'x-on:click.outside': 'close()' }"
		>
			<input type="hidden" x-bind:name="name" x-model="value" x-ref="hidden" />

			<button
				type="button"
				x-on:click="toggle()"
				className="flex items-center justify-between w-full px-3 py-2 text-zinc-500 border border-zinc-800 rounded-md hover:bg-zinc-900 transition-colors"
			>
				<span className="flex items-center gap-2 text-zinc-200">
					<img
						alt=""
						x-show="current?.icon"
						x-bind:src="current?.icon"
						className="bg-zinc-900 w-6 h-6 rounded-full"
					/>

					<span x-text="current?.label"></span>
				</span>

				<ChevronUpDownIcon />
			</button>

			<div
				x-show="open"
				x-transition=""
				className="absolute top-full mt-1 w-full max-h-48 overflow-auto bg-zinc-900 border border-zinc-700 shadow-lg z-10"
			>
				<template x-for="opt in options" x-bind:key="opt.value">
					<button
						type="button"
						x-show="opt.value !== value"
						x-on:click="select(opt.value)"
						className="flex items-center gap-2 w-full px-2 py-1 hover:bg-zinc-800 text-left"
					>
						<img
							alt=""
							x-show="opt.icon"
							x-bind:src="opt.icon"
							className="bg-zinc-950 w-4 h-4 rounded-full"
						/>

						<span x-text="opt.label"></span>
					</button>
				</template>
			</div>
		</div>
	);
}
