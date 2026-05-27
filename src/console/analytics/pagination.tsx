export function PaginationControls() {
	return (
		<div
			className="flex justify-end space-x-2 mt-4 items-center gap-1 flex-wrap"
			x-show="totalPages() > 1"
		>
			<button
				x-bind:disabled="currentPage === 1"
				x-on:click="prevPage()"
				className="ui-btn text-xs"
				type="button"
			>
				Prev
			</button>

			<template x-for="item in pages()" x-bind:key="item.key">
				<span>
					<template x-if="item.type === 'page'">
						<button
							x-on:click="goToPage(item.value)"
							x-bind:class="{'bg-zinc-900 font-semibold text-zinc-100': currentPage === item.value}"
							className="ui-btn text-xs"
							type="button"
						>
							<span x-text="item.value"></span>
						</button>
					</template>
					<template x-if="item.type === 'ellipsis'">
						<span className="px-1 text-zinc-500 text-xs">…</span>
					</template>
				</span>
			</template>

			<button
				x-bind:disabled="currentPage === totalPages()"
				x-on:click="nextPage()"
				className="ui-btn text-xs"
				type="button"
			>
				Next
			</button>
		</div>
	);
}
